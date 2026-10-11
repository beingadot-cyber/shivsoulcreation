import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { sessions, customers, admins, type Customer } from "@/db/schema";
import { ensureDb } from "./db-setup";
import { randomToken, sha256 } from "./crypto";

export const SESSION_COOKIE = "ssc_session";
const SESSION_DAYS = 30;

export type SessionInfo =
  | { userType: "customer"; userId: number; customer: Customer }
  | { userType: "admin"; userId: number; admin: { id: number; username: string } }
  | null;

export async function createSession(
  userType: "customer" | "admin",
  userId: number
): Promise<void> {
  await ensureDb();
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 3600 * 1000);
  await db.insert(sessions).values({
    tokenHash: sha256(token),
    userType,
    userId,
    expiresAt,
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function getSession(): Promise<SessionInfo> {
  await ensureDb();
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const rows = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.tokenHash, sha256(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);
  const s = rows[0];
  if (!s) return null;
  if (s.userType === "customer") {
    const c = await db
      .select()
      .from(customers)
      .where(eq(customers.id, s.userId))
      .limit(1);
    if (!c[0] || c[0].accountStatus !== "active") return null;
    return { userType: "customer", userId: s.userId, customer: c[0] };
  }
  const a = await db
    .select({ id: admins.id, username: admins.username })
    .from(admins)
    .where(eq(admins.id, s.userId))
    .limit(1);
  if (!a[0]) return null;
  return { userType: "admin", userId: s.userId, admin: a[0] };
}

export async function destroySession(): Promise<void> {
  await ensureDb();
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.tokenHash, sha256(token)));
  }
  store.delete(SESSION_COOKIE);
}

/** Server-side guard for admin pages. Redirects to /admin when not authenticated. */
export async function requireAdmin() {
  const s = await getSession();
  if (!s || s.userType !== "admin") redirect("/admin");
  return s;
}

/** Throws-401 helper for admin API routes. */
export async function requireAdminApi() {
  const s = await getSession();
  if (!s || s.userType !== "admin") return null;
  return s;
}

/* ---------- Lightweight in-memory rate limiting ---------- */

const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (b.count >= limit) return false;
  b.count += 1;
  return true;
}

/* ---------- Validation helpers ---------- */

export const MOBILE_RE = /^[6-9]\d{9}$/;

export function isValidMobile(mobile: string): boolean {
  return MOBILE_RE.test(mobile);
}

export function isStrongPassword(pw: string): boolean {
  return pw.length >= 8 && /[a-zA-Z]/.test(pw) && /\d/.test(pw);
}
