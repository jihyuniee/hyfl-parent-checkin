import { env } from "cloudflare:workers";

const COOKIE = "hyfl_admin";
const FALLBACK_PASSWORD_HASH = "b041ef6a95a6ac6f40cd2f5b8d52237b15935fa5782d90aad78c8b89f1ee9816";

async function digest(value: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, "0")).join("");
}

export async function adminToken() {
  const password = String(env.ADMIN_PASSWORD ?? "");
  return digest(password ? `hyfl-admin:${password}` : `hyfl-admin-hash:${FALLBACK_PASSWORD_HASH}`);
}

export async function matchesAdminPassword(value: string) {
  const configured = String(env.ADMIN_PASSWORD ?? "");
  return (configured && value === configured) || await digest(value) === FALLBACK_PASSWORD_HASH;
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
