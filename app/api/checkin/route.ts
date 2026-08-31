import { and, asc, desc, eq, like, or } from "drizzle-orm";
import { getDb } from "../../../db";
import { attendance, events, students } from "../../../db/schema";
import { ensureDatabase } from "../../../db/setup";
import { env } from "cloudflare:workers";

type AttendanceRecord = {
  id: number;
  eventId: number;
  studentId: number;
  guardianName: string;
  relationship: string;
  partySize: number;
  checkedInAt: string;
};
type StudentRecord = {
  id: number;
  grade: number;
  classNo: number;
  studentNo: number;
  name: string;
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isTransientD1Error(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /overload|too many requests|queued|network|reset|timeout|temporar/i.test(
    message,
  );
}

async function withD1Retry<T>(operation: () => Promise<T>) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isTransientD1Error(error) || attempt === 2) throw error;
      await wait(70 * (attempt + 1) + Math.floor(Math.random() * 70));
    }
  }
  throw lastError;
}

function koreaDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function GET(request: Request) {
  try {
    await ensureDatabase();
    const db = getDb();
    const grade = Number(new URL(request.url).searchParams.get("grade"));

    if (grade) {
      const gradeFilter = or(
        eq(events.targetGrades, String(grade)),
        like(events.targetGrades, `${grade},%`),
        like(events.targetGrades, `%,${grade}`),
        like(events.targetGrades, `%,${grade},%`),
      );
      const [event] = await db
        .select()
        .from(events)
        .where(gradeFilter)
        .orderBy(desc(events.id))
        .limit(1);
      return Response.json({ event: event ?? null });
    }

    const today = koreaDate();
    const [event] = await db
      .select()
      .from(events)
      .where(
        and(
          eq(events.eventDate, today),
          or(eq(events.status, "active"), eq(events.status, "scheduled")),
        ),
      )
      .orderBy(asc(events.id))
      .limit(1);
    return Response.json({ event: event ?? null });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "데이터를 불러오지 못했습니다.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (body.action !== "checkin") {
      return Response.json(
        { error: "지원하지 않는 요청입니다." },
        { status: 400 },
      );
    }

    const eventId = Number(body.eventId);
    const grade = Number(body.grade);
    const classNo = Number(body.classNo);
    const studentName = String(body.studentName ?? "").replace(/\s/g, "");
    const partySize = Number(body.partySize ?? 1);
    const preview = body.preview === true;
    const today = koreaDate();
    const gradeTwoTestOpen = today === "2026-08-31" && grade === 2;
    if (
      !eventId ||
      !grade ||
      !classNo ||
      !studentName ||
      ![1, 2].includes(partySize)
    ) {
      return Response.json(
        { error: "입력 내용을 확인해 주세요." },
        { status: 400 },
      );
    }

    const record = await withD1Retry(() =>
      env.DB.prepare(
        `
      INSERT INTO attendance (event_id, student_id, guardian_name, relationship, party_size)
      SELECT ?1, s.id, '미수집', '미수집', ?5
      FROM students s
      JOIN events e ON e.id = ?1
      WHERE s.active = 1 AND s.grade = ?2 AND s.class_no = ?3 AND REPLACE(s.name, ' ', '') = ?4
        AND e.status IN ('active', 'scheduled') AND (?7 = 1 OR e.event_date = ?6)
        AND (',' || e.target_grades || ',') LIKE '%,' || ?2 || ',%'
      ON CONFLICT(event_id, student_id) DO NOTHING
      RETURNING id, event_id AS eventId, student_id AS studentId,
        guardian_name AS guardianName, relationship, party_size AS partySize,
        checked_in_at AS checkedInAt
    `,
      )
        .bind(
          eventId,
          grade,
          classNo,
          studentName,
          partySize,
          today,
          preview || gradeTwoTestOpen ? 1 : 0,
        )
        .first<AttendanceRecord>(),
    );

    const student = await withD1Retry(() =>
      env.DB.prepare(
        `
      SELECT id, grade, class_no AS classNo, student_no AS studentNo, name
      FROM students
      WHERE active = 1 AND grade = ?1 AND class_no = ?2 AND REPLACE(name, ' ', '') = ?3
      LIMIT 1
    `,
      )
        .bind(grade, classNo, studentName)
        .first<StudentRecord>(),
    );
    if (!student)
      return Response.json(
        {
          error: `${grade}학년 ${classNo}반 명단에서 이름을 찾지 못했습니다. 자녀 이름을 다시 확인해 주세요.`,
        },
        { status: 404 },
      );

    if (!record) {
      const existing = await withD1Retry(() =>
        env.DB.prepare(
          `
        SELECT id, event_id AS eventId, student_id AS studentId,
          guardian_name AS guardianName, relationship, party_size AS partySize,
          checked_in_at AS checkedInAt
        FROM attendance WHERE event_id = ?1 AND student_id = ?2 LIMIT 1
      `,
        )
          .bind(eventId, student.id)
          .first<AttendanceRecord>(),
      );
      if (existing)
        return Response.json({
          attendance: existing,
          student,
          alreadyRegistered: true,
        });
      return Response.json(
        { error: "현재 체크인 가능한 행사가 아닙니다." },
        { status: 400 },
      );
    }

    return Response.json(
      {
        attendance: record,
        student: {
          id: student.id,
          grade: student.grade,
          classNo: student.classNo,
          studentNo: student.studentNo,
          name: student.name,
        },
        alreadyRegistered: false,
      },
      { status: 201 },
    );
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "등록하지 못했습니다.",
      },
      { status: 500 },
    );
  }
}
