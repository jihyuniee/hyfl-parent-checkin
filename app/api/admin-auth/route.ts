import { adminCookie, adminToken, clearAdminCookie, isAdmin, matchesAdminPassword } from "../admin-auth";

export async function GET(request: Request) {
  return Response.json({ authenticated: await isAdmin(request) });
}

export async function POST(request: Request) {
  const { password = "" } = await request.json() as { password?: string };
  if (!await matchesAdminPassword(password)) {
    return Response.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 401 });
  }
  return Response.json({ authenticated: true }, { headers: { "Set-Cookie": adminCookie(await adminToken()) } });
}

export async function DELETE() {
  return Response.json({ authenticated: false }, { headers: { "Set-Cookie": clearAdminCookie() } });
}
