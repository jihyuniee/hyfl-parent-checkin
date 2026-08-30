"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardCheck,
  Download,
  FileUp,
  Plus,
  QrCode,
  School,
  Settings2,
  Trash2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Bar,
  BarChart as ReBarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Student = {
  id: number;
  grade: number;
  classNo: number;
  studentNo: number;
  name: string;
};
type Attendance = {
  id: number;
  eventId: number;
  studentId: number;
  guardianName: string;
  relationship: string;
  partySize: number;
  checkedInAt: string;
};
type EventRecord = {
  id: number;
  title: string;
  eventDate: string;
  status: string;
  targetGrades: string;
};

const demoStudents: Student[] = [];
const demoEvent: EventRecord = {
  id: 0,
  title: "학부모 행사 참석 등록",
  eventDate: "2026-09-03",
  status: "scheduled",
  targetGrades: "1,2,3",
};

function Mark() {
  return (
    <div className="mark" aria-label="한영외국어고등학교">
      <span>HYFL</span>
    </div>
  );
}
function AppHeader({
  admin,
  onAdmin,
}: {
  admin?: boolean;
  onAdmin?: () => void;
}) {
  return (
    <header className="site-header">
      <div className="header-brand">
        <img
          className="school-logo"
          src="/hyfl-logo-embedded.svg"
          alt="한영외국어고등학교"
        />
        <span>학부모 행사 참석 관리</span>
      </div>
      {onAdmin && (
        <button className="quiet-link" onClick={onAdmin}>
          {admin ? "체크인 화면" : "관리자"}
        </button>
      )}
    </header>
  );
}

export default function Home() {
  const [mode, setMode] = useState<"checkin" | "admin">("checkin");
  const [event, setEvent] = useState<EventRecord>(demoEvent);
  const [students, setStudents] = useState<Student[]>(demoStudents);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [connected, setConnected] = useState(false);
  const [eventAvailable, setEventAvailable] = useState(false);
  const [requestedGrade, setRequestedGrade] = useState<number>();
  const [previewMode, setPreviewMode] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const grade = Number(params.get("grade")) || undefined;
    const preview = params.get("preview") === "1";
    setRequestedGrade(grade);
    setPreviewMode(preview);
    fetch(`/api/checkin${grade ? `?grade=${grade}` : ""}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (data.event) {
          setEvent(data.event);
          setEventAvailable(
            preview ||
              data.event.eventDate ===
                new Intl.DateTimeFormat("en-CA", {
                  timeZone: "Asia/Seoul",
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                }).format(new Date()),
          );
          const eventGrade = Number(data.event.targetGrades);
          if ([1, 2, 3].includes(eventGrade)) setRequestedGrade(eventGrade);
        } else setEventAvailable(false);
        setConnected(true);
      })
      .catch(() => {
        setConnected(false);
        setEventAvailable(false);
      });
  }, []);
  const openAdmin = async () => {
    await fetch("/api/admin-auth", { method: "DELETE" });
    setPassword("");
    setLoginError("");
    setShowLogin(true);
  };
  const loadAdmin = async () => {
    const r = await fetch("/api/admin");
    if (!r.ok) return false;
    const data = await r.json();
    if (data.students) setStudents(data.students);
    if (data.attendance) setAttendance(data.attendance);
    if (data.activeEvent) setEvent(data.activeEvent);
    setConnected(true);
    return true;
  };
  const login = async () => {
    setLoginError("");
    const r = await fetch("/api/admin-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!r.ok) {
      setLoginError("비밀번호가 올바르지 않습니다.");
      return;
    }
    await loadAdmin();
    setShowLogin(false);
    setPassword("");
    setMode("admin");
  };
  const logout = async () => {
    await fetch("/api/admin-auth", { method: "DELETE" });
    setMode("checkin");
  };
  return (
    <>
      {mode === "admin" ? (
        <Admin
          event={event}
          students={students}
          attendance={attendance}
          connected={connected}
          onDelete={(id) => setAttendance((p) => p.filter((a) => a.id !== id))}
          onExit={logout}
        />
      ) : (
        <Checkin
          event={event}
          students={students}
          connected={connected}
          available={eventAvailable}
          fixedGrade={requestedGrade}
          previewMode={previewMode}
          onAdmin={openAdmin}
          onRecorded={(a) => setAttendance((p) => [...p, a])}
        />
      )}
      {showLogin && (
        <div className="login-backdrop" onMouseDown={() => setShowLogin(false)}>
          <section
            className="login-card"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <img src="/hyfl-logo-embedded.svg" alt="한영외국어고등학교" />
            <p>ADMINISTRATION</p>
            <h2>관리자 로그인</h2>
            <span>행사 현황과 참석 명단은 관리자만 확인할 수 있습니다.</span>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && login()}
              placeholder="관리자 비밀번호"
              autoFocus
            />
            {loginError && <small>{loginError}</small>}
            <Button onClick={login}>확인</Button>
            <button
              className="login-cancel"
              onClick={() => setShowLogin(false)}
            >
              취소
            </button>
          </section>
        </div>
      )}
    </>
  );
}

function Checkin({
  event,
  connected,
  available,
  fixedGrade,
  previewMode,
  onAdmin,
  onRecorded,
}: {
  event: EventRecord;
  students: Student[];
  connected: boolean;
  available: boolean;
  fixedGrade?: number;
  previewMode: boolean;
  onAdmin: () => void;
  onRecorded: (a: Attendance) => void;
}) {
  const [step, setStep] = useState(1);
  const [grade, setGrade] = useState<number>();
  const [classNo, setClassNo] = useState<number>();
  const [student, setStudent] = useState<Student>();
  const [studentName, setStudentName] = useState("");
  const [partySize, setPartySize] = useState(1);
  const [done, setDone] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const grades = event.targetGrades.split(",").map(Number);
  const classes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  useEffect(() => {
    if (fixedGrade) {
      setGrade(fixedGrade);
      setStep(2);
    }
  }, [fixedGrade]);
  const goBack = () => {
    if (step === 3) {
      setClassNo(undefined);
      setStudentName("");
      setStep(2);
    } else if (step === 2) {
      setGrade(undefined);
      setStep(1);
    }
  };
  const submit = async () => {
    if (!grade || !classNo || !studentName.trim()) return;
    setSaving(true);
    setSaveError("");
    try {
      let lastError: Error | undefined;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          const r = await fetch("/api/checkin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "checkin",
              eventId: event.id,
              grade,
              classNo,
              studentName: studentName.trim(),
              partySize,
              preview: previewMode,
            }),
          });
          const data = await r.json();
          if (!r.ok) throw new Error(data.error ?? "등록하지 못했습니다.");
          setStudent(data.student);
          setPartySize(data.attendance.partySize);
          setAlreadyRegistered(Boolean(data.alreadyRegistered));
          if (!data.alreadyRegistered) onRecorded(data.attendance);
          setDone(true);
          return;
        } catch (error) {
          lastError =
            error instanceof Error ? error : new Error("등록하지 못했습니다.");
          if (
            attempt < 2 &&
            /network|fetch|서버|연결|temporar|overload/i.test(lastError.message)
          )
            await new Promise((resolve) =>
              setTimeout(resolve, 350 * (attempt + 1)),
            );
        }
      }
      throw lastError;
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "네트워크 연결을 확인한 뒤 다시 눌러 주세요.",
      );
    } finally {
      setSaving(false);
    }
  };
  const reset = () => {
    setStep(fixedGrade ? 2 : 1);
    setGrade(fixedGrade);
    setClassNo(undefined);
    setStudent(undefined);
    setStudentName("");
    setPartySize(1);
    setDone(false);
    setAlreadyRegistered(false);
    setSaveError("");
  };
  if (connected && !available)
    return (
      <main className="public-shell">
        <AppHeader onAdmin={onAdmin} />
        <section className="closed-card">
          <CalendarDays />
          <p>CHECK-IN CLOSED</p>
          <h1>현재 진행 중인 학부모 행사가 없습니다</h1>
          <span>
            1학년 학부모 총회는 9월 3일,
            <br />
            2학년 학부모 총회는 9월 4일에 열립니다.
          </span>
        </section>
      </main>
    );
  if (done && student)
    return (
      <main className="public-shell">
        <AppHeader onAdmin={onAdmin} />
        <section className="success-card">
          <div className="success-icon">
            <Check />
          </div>
          <p className="eyebrow">ATTENDANCE CONFIRMED</p>
          <h1>
            {alreadyRegistered
              ? "이미 참석 등록이 되어 있습니다"
              : "학부모님 참석 등록이 완료되었습니다"}
          </h1>
          <p className="success-student">
            {student.grade}학년 {student.classNo}반&nbsp; {student.name} 학생
          </p>
          {alreadyRegistered && (
            <p className="already-note">
              정상적으로 등록된 상태입니다. 별도로 확인하지 않으셔도 됩니다.
            </p>
          )}
          <div className="receipt">
            <span>참석 인원</span>
            <strong>{partySize}명</strong>
            <span>{alreadyRegistered ? "최초 등록 시각" : "등록 시각"}</span>
            <strong>
              {new Date().toLocaleTimeString("ko-KR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </strong>
          </div>
          <Button className="primary-action" onClick={reset}>
            다른 자녀도 등록하기
          </Button>
          <p className="close-note">이 화면을 닫으셔도 됩니다.</p>
        </section>
      </main>
    );
  const shownStep = fixedGrade ? step - 1 : step,
    totalSteps = fixedGrade ? 2 : 3;
  return (
    <main className="public-shell">
      <AppHeader onAdmin={onAdmin} />
      <section className="checkin-card">
        <div className="event-heading">
          <Badge variant="outline">{previewMode ? "사전 테스트" : "진행 중"}</Badge>
          <p>{event.eventDate.replaceAll("-", ".")}</p>
          <h1>{event.title}</h1>
          <span>{previewMode ? "실제 명단과 저장 기능을 미리 확인하는 화면입니다." : "자녀 정보를 선택하고 참석을 등록해 주세요."}</span>
        </div>
        <div className="stepbar">
          <span>0{shownStep}</span>
          <Progress value={(shownStep / totalSteps) * 100} />
          <small>0{totalSteps}</small>
        </div>
        {step > 1 && !(fixedGrade && step === 2) && (
          <button className="back-button" onClick={goBack}>
            <ArrowLeft size={17} /> 이전
          </button>
        )}
        {step === 1 && (
          <Choice title="자녀의 학년을 선택해 주세요">
            {grades.map((g) => (
              <button
                key={g}
                className="choice large"
                onClick={() => {
                  setGrade(g);
                  setStep(2);
                }}
              >
                <span>{g}</span>학년
                <ChevronRight />
              </button>
            ))}
          </Choice>
        )}
        {step === 2 && (
          <Choice title={`${grade}학년 몇 반인가요?`}>
            <div className="number-grid">
              {classes.map((c) => (
                <button
                  key={c}
                  className="number-choice"
                  onClick={() => {
                    setClassNo(c);
                    setStep(3);
                  }}
                >
                  <b>{c}</b>
                  <span>반</span>
                </button>
              ))}
            </div>
          </Choice>
        )}
        {step === 3 && (
          <div className="form-stage">
            <h2>자녀 이름을 입력해 주세요</h2>
            <div className="selected-student">
              <School />
              <div>
                <small>선택한 학급</small>
                <strong>
                  {grade}학년 {classNo}반
                </strong>
              </div>
            </div>
            <label>
              자녀 이름
              <Input
                value={studentName}
                onChange={(e) =>
                  setStudentName(e.target.value.replace(/\s/g, ""))
                }
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="예: 김한영"
                autoFocus
                autoComplete="off"
              />
            </label>
            <label>참석 인원</label>
            <div className="segmented two">
              {[1, 2].map((n) => (
                <button
                  key={n}
                  className={partySize === n ? "active" : ""}
                  onClick={() => setPartySize(n)}
                >
                  {n}명
                </button>
              ))}
            </div>
            <p className="privacy-note">
              보호자 성명이나 관계는 수집하지 않습니다.
            </p>
            {saveError && <p className="submit-error">{saveError}</p>}
            <Button
              disabled={!studentName.trim() || saving || !connected}
              className="primary-action"
              onClick={submit}
            >
              {saving
                ? "등록 중…"
                : connected
                  ? "참석 등록하기"
                  : "서버 연결 확인 중…"}
            </Button>
          </div>
        )}
      </section>
      <footer>등록에 어려움이 있으시면 안내 데스크에 말씀해 주세요.</footer>
    </main>
  );
}
function Choice({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="choice-stage">
      <h2>{title}</h2>
      {children}
    </div>
  );
}

function Admin({
  event,
  students,
  attendance,
  connected,
  onDelete,
  onExit,
}: {
  event: EventRecord;
  students: Student[];
  attendance: Attendance[];
  connected: boolean;
  onDelete: (id: number) => void;
  onExit: () => void;
}) {
  const [section, setSection] = useState<"overview" | "events" | "students">(
    "overview",
  );
  const [gradeFilter, setGradeFilter] = useState<number | "all">("all");
  const eventGrade = Number(event.targetGrades);
  const eventStudents = students.filter((s) => s.grade === eventGrade);
  const eventAttendance = attendance.filter((a) => a.eventId === event.id);
  const attendees = new Set(eventAttendance.map((a) => a.studentId));
  const classSummary = Array.from({ length: 10 }, (_, index) => {
    const classNo = index + 1;
    const rows = eventStudents.filter((s) => s.classNo === classNo);
    const records = eventAttendance.filter((a) => rows.some((s) => s.id === a.studentId));
    return { classNo, families: records.length, people: records.reduce((sum, a) => sum + a.partySize, 0) };
  });
  const attendedRows = eventAttendance.map((a) => ({ attendance: a, student: eventStudents.find((s) => s.id === a.studentId) })).filter((row): row is { attendance: Attendance; student: Student } => Boolean(row.student)).sort((a,b) => a.student.classNo-b.student.classNo || a.student.studentNo-b.student.studentNo);
  const filtered =
    gradeFilter === "all"
      ? students
      : students.filter((s) => s.grade === gradeFilter);
  const counts = [1, 2, 3].map((g) => {
    const total = students.filter((s) => s.grade === g).length;
    const attended = students.filter(
      (s) => s.grade === g && attendees.has(s.id),
    ).length;
    return { g, total, attended };
  });
  const arrivalData = useMemo(() => {
    const bins = new Map<string, number>();
    attendance.forEach((a) => {
      const d = new Date(a.checkedInAt);
      d.setMinutes(Math.floor(d.getMinutes() / 10) * 10, 0, 0);
      const key = d.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      bins.set(key, (bins.get(key) ?? 0) + a.partySize);
    });
    let cumulative = 0;
    return [...bins.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([time, count]) => ({
        time,
        count,
        cumulative: (cumulative += count),
      }));
  }, [attendance]);
  const classData = useMemo(() => {
    const keys = [
      ...new Set(students.map((s) => `${s.grade}-${s.classNo}`)),
    ].sort();
    return keys.map((key) => {
      const [g, c] = key.split("-").map(Number);
      const rows = students.filter((s) => s.grade === g && s.classNo === c);
      const present = rows.filter((s) => attendees.has(s.id)).length;
      return {
        name: `${g}-${c}`,
        rate: rows.length ? Math.round((present / rows.length) * 100) : 0,
        present,
        total: rows.length,
      };
    });
  }, [students, attendance]);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [notice, setNotice] = useState("");
  const createEvent = async () => {
    if (!eventTitle || !eventDate) return;
    const r = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "createEvent",
        title: eventTitle,
        eventDate,
        targetGrades: "1,2,3",
      }),
    });
    setNotice(
      r.ok
        ? "새 행사가 생성되었습니다. 화면을 새로고침하면 바로 적용됩니다."
        : "행사를 만들지 못했습니다.",
    );
  };
  const prepareMeetings = async () => {
    const r = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "prepareMeetings" }),
    });
    setNotice(
      r.ok
        ? "1학년(9/3), 2학년(9/4) 총회를 준비했습니다."
        : "행사를 준비하지 못했습니다.",
    );
  };
  const importExcel = async (file: File) => {
    try {
      setNotice("학년별 엑셀 시트를 확인하고 있습니다…");
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const rows: {
        grade: number;
        classNo: number;
        studentNo: number;
        name: string;
      }[] = [];
      for (const sheetName of workbook.SheetNames) {
        const gradeFromSheet = Number(sheetName.match(/[1-3]/)?.[0] ?? 0);
        if (!gradeFromSheet) continue;
        const grid = XLSX.utils.sheet_to_json<unknown[]>(
          workbook.Sheets[sheetName],
          { header: 1, defval: "" },
        );
        const headerIndex = grid.findIndex(
          (row) =>
            Array.isArray(row) &&
            row.some((cell) =>
              ["학번", "성명", "학생명"].includes(
                String(cell).trim().replace(/\s/g, ""),
              ),
            ),
        );
        if (headerIndex < 0) continue;
        const headers = (grid[headerIndex] as unknown[]).map((v) =>
          String(v).trim().replace(/\s/g, ""),
        );
        const classIndex = headers.findIndex((v) => v === "반"),
          idIndex = headers.findIndex((v) => v === "학번"),
          nameIndex = headers.findIndex((v) =>
            ["성명", "학생명", "학생이름", "이름"].includes(v),
          );
        for (const rawRow of grid.slice(headerIndex + 1)) {
          const row = rawRow as unknown[];
          const fullId = String(row[idIndex] ?? "").replace(/\D/g, "");
          const classText = String(row[classIndex] ?? "").trim();
          const name = String(row[nameIndex] ?? "").trim();
          if (!fullId || !name) continue;
          const classNo = Number(
            classText.includes("-")
              ? classText.split("-").at(-1)
              : fullId.slice(1, 3),
          );
          const studentNo = Number(fullId.slice(-2));
          if (classNo > 0 && studentNo > 0)
            rows.push({ grade: gradeFromSheet, classNo, studentNo, name });
        }
      }
      if (!rows.length) throw new Error("no rows");
      const r = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "importStudents",
          schoolYear: new Date().getFullYear(),
          rows,
        }),
      });
      const data = await r.json();
      setNotice(
        r.ok
          ? `${workbook.SheetNames.filter((n) => /[1-3]학년/.test(n)).length}개 학년 시트에서 ${data.count}명의 명단을 등록했습니다. 화면을 새로고침해 주세요.`
          : (data.error ?? "명단을 등록하지 못했습니다."),
      );
    } catch {
      setNotice("학년별 명렬표 시트에서 반·학번·성명 열을 찾지 못했습니다.");
    }
  };
  const exportCsv = () => {
    const rows = [
      ["학년", "반", "번호", "학생명", "참석인원", "등록시각"],
      ...students.map((s) => {
        const a = attendance.find((x) => x.studentId === s.id);
        return [
          s.grade,
          s.classNo,
          s.studentNo,
          s.name,
          a?.partySize ?? "",
          a?.checkedInAt ?? "",
        ];
      }),
    ];
    const blob = new Blob(
      ["\ufeff" + rows.map((r) => r.join(",")).join("\n")],
      { type: "text/csv;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event.title}-참석명단.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const cancelAttendance = async (a: Attendance, studentName: string) => {
    if (!confirm(`${studentName} 학생의 참석 등록을 취소할까요?`)) return;
    const r = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deleteAttendance", id: a.id }),
    });
    if (r.ok) {
      onDelete(a.id);
      setNotice(`${studentName} 학생의 참석 등록을 취소했습니다.`);
    } else setNotice("참석 등록을 취소하지 못했습니다.");
  };
  return (
    <main className="admin-shell">
      <aside className="sidebar">
        <div className="brand inverse">
          <Mark />
          <div>
            <strong>HYFL</strong>
            <span>Attendance</span>
          </div>
        </div>
        <nav>
          <button
            className={section === "overview" ? "active" : ""}
            onClick={() => setSection("overview")}
          >
            <BarChart3 />
            행사 현황
          </button>
          <button
            className={section === "events" ? "active" : ""}
            onClick={() => setSection("events")}
          >
            <CalendarDays />
            행사 관리
          </button>
          <button
            className={section === "students" ? "active" : ""}
            onClick={() => setSection("students")}
          >
            <Users />
            학생 명단
          </button>
        </nav>
        <div className="sidebar-bottom">
          <button>
            <Settings2 />
            설정
          </button>
          <button onClick={onExit}>
            <QrCode />
            체크인 화면
          </button>
        </div>
      </aside>
      <section className="admin-main">
        <div className="admin-top">
          <div>
            <p>학부모 행사 참석 관리</p>
            <h1>
              {section === "overview"
                ? "실시간 행사 현황"
                : section === "events"
                  ? "행사 관리"
                  : "학생 명단 관리"}
            </h1>
          </div>
          <div className="top-actions">
            <span className={`connection ${connected ? "on" : ""}`}>
              {connected ? "실시간 연결" : "미리보기 데이터"}
            </span>
            {section === "overview" && (
              <Button variant="outline" onClick={exportCsv}>
                <Download />
                명단 내려받기
              </Button>
            )}
            {section === "events" && (
              <Button>
                <Plus />새 행사 만들기
              </Button>
            )}
          </div>
        </div>
        {section === "overview" && (
          <>
            <div className="event-strip simple-event-strip">
              <div>
                <Badge>진행 중</Badge>
                <h2>{event.title}</h2>
                <p>
                  {event.eventDate.replaceAll("-", ".")} · 대상 학년{" "}
                  {event.targetGrades}
                </p>
              </div>
              <div className="event-total">
                <strong>{attendees.size}가정</strong>
                <span>보호자 {eventAttendance.reduce((sum, a) => sum + a.partySize, 0)}명</span>
              </div>
            </div>
            <div className="class-attendance-grid">
              {classSummary.map((row) => <div className="class-attendance-card" key={row.classNo}><strong>{row.classNo}반</strong><b>{row.families}<small>가정</small></b><span>보호자 {row.people}명</span></div>)}
            </div>
            <div className="panel">
              <div className="panel-head">
                <div>
                  <h2>{eventGrade}학년 참석 등록 명단</h2>
                  <p>
                    잘못 등록된 경우 오른쪽의 취소 버튼으로 즉시 해제할 수
                    있습니다.
                  </p>
                  {notice && <p className="notice">{notice}</p>}
                </div>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>반</th>
                      <th>번호</th>
                      <th>학생</th>
                      <th>참석 인원</th>
                      <th>등록 시각</th>
                      <th>관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendedRows.map(({student:s,attendance:a}) => {
                      return (
                        <tr key={s.id}>
                          <td>{s.classNo}</td>
                          <td>{String(s.studentNo).padStart(2, "0")}</td>
                          <td>
                            <strong>{s.name}</strong>
                          </td>
                          <td>{a.partySize}명</td>
                          <td>
                            {new Date(a.checkedInAt).toLocaleTimeString(
                                  "ko-KR",
                                  { hour: "2-digit", minute: "2-digit" },
                                )}
                          </td>
                          <td>
                              <button
                                className="cancel-attendance"
                                onClick={() => cancelAttendance(a, s.name)}
                                title="참석 등록 취소"
                              >
                                <Trash2 />
                                취소
                              </button>
                          </td>
                        </tr>
                      );
                    })}
                    {!attendedRows.length&&<tr><td colSpan={6} className="empty-table">아직 참석 등록된 가정이 없습니다.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
        {section === "events" && (
          <div className="empty-panel event-form">
            <div className="empty-icon">
              <CalendarDays />
            </div>
            <h2>새 행사를 만들고 QR을 화면에 띄우세요</h2>
            <p>
              2026학년도 학부모 총회는 아래 버튼으로 한 번에 준비할 수 있습니다.
            </p>
            <Button className="preset-button" onClick={prepareMeetings}>
              <CalendarDays />
              1학년 9/3 · 2학년 9/4 총회 준비
            </Button>
            <div className="inline-form">
              <Input
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="예: 2026학년도 학부모 총회"
              />
              <Input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
              <Button onClick={createEvent}>
                <Plus />
                행사 만들기
              </Button>
            </div>
            {notice && <p className="notice">{notice}</p>}
          </div>
        )}
        {section === "students" && (
          <div className="upload-panel">
            <div>
              <div className="empty-icon">
                <FileUp />
              </div>
              <h2>학생 명단 업로드</h2>
              <p>
                ‘1학년 명렬표·2학년 명렬표·3학년 명렬표’ 시트를 한 번에
                읽습니다.
              </p>
              {notice && <p className="notice">{notice}</p>}
            </div>
            <label className="upload-box">
              <FileUp />
              <strong>학교 명렬표 엑셀 파일을 선택해 주세요</strong>
              <span>각 시트의 반·학번·성명 열을 자동으로 인식합니다.</span>
              <span className="file-button">엑셀 파일 선택</span>
              <input
                type="file"
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                hidden
                onChange={(e) =>
                  e.target.files?.[0] && importExcel(e.target.files[0])
                }
              />
            </label>
          </div>
        )}
      </section>
    </main>
  );
}
function Metric({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="metric">
      <div className="metric-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{sub}</small>
      </div>
    </div>
  );
}
function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="chart-card">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
