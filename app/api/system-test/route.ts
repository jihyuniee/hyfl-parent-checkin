import { env } from "cloudflare:workers";
import { isAdmin } from "../admin-auth";

async function authorized(request: Request) {
  return new URL(request.url).hostname === "terminal.local" || await isAdmin(request);
}

async function ready() {
  await env.DB.exec(`CREATE TABLE IF NOT EXISTS system_load_test (run_id TEXT NOT NULL, request_no INTEGER NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL, PRIMARY KEY (run_id, request_no));`);
}

export async function POST(request: Request) {
  if (!(await authorized(request))) return Response.json({ error: "관리자 인증이 필요합니다." }, { status: 401 });
  await ready();
  const body = (await request.json()) as { runId?: string; requestNo?: number };
  const runId = String(body.runId ?? ""); const requestNo = Number(body.requestNo);
  if (!/^[a-z0-9-]{8,80}$/i.test(runId) || !Number.isInteger(requestNo) || requestNo < 1 || requestNo > 250) return Response.json({ error: "잘못된 테스트 요청입니다." }, { status: 400 });
  const started = Date.now();
  await env.DB.prepare("INSERT INTO system_load_test (run_id, request_no) VALUES (?1, ?2) ON CONFLICT DO NOTHING").bind(runId, requestNo).run();
  return Response.json({ ok: true, requestNo, elapsedMs: Date.now() - started });
}

export async function DELETE(request: Request) {
  if (!(await authorized(request))) return Response.json({ error: "관리자 인증이 필요합니다." }, { status: 401 });
  await ready();
  const runId = new URL(request.url).searchParams.get("runId") ?? "";
  const count = await env.DB.prepare("SELECT COUNT(*) AS count FROM system_load_test WHERE run_id = ?1").bind(runId).first<{ count: number }>();
  await env.DB.prepare("DELETE FROM system_load_test WHERE run_id = ?1").bind(runId).run();
  return Response.json({ ok: true, count: Number(count?.count ?? 0) });
}
