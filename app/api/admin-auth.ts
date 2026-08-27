import { env } from "cloudflare:workers";

const COOKIE = "hyfl_admin";

async function digest(value: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, "0")).join("");
}

export async function adminToken() {
  const password = String(env.ADMIN_PASSWORD ?? "");
  if (!password) return "";
  return digest(`hyfl-admin:${password}`);
}

export async function isAdmin(request: Request) {
  const expected = await adminToken();
  if (!expected) return false;
  const cookie = request.headers.get("cookie") ?? "";
  const value = cookie.split(";").map(v => v.trim()).find(v => v.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  return value === expected;
}

export function adminCookie(token: string) {
  return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`;
}

export function clearAdminCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}
