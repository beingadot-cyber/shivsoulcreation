import { db } from "@/db";
import { otpRequests } from "@/db/schema";
import { and, desc, eq, gt } from "drizzle-orm";
import { ensureDb } from "./db-setup";
import { generateOtp, hashOtp } from "./crypto";
import { rateLimit } from "./auth";

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export type OtpPurpose = "signup" | "register" | "reset";

export async function issueOtp(
  mobile: string,
  purpose: OtpPurpose,
  pendingPasswordHash?: string
): Promise<{ ok: boolean; devOtp?: string; error?: string; waitSeconds?: number }> {
  await ensureDb();

  // cooldown: one OTP per 30s per mobile+purpose
  const recent = await db
    .select()
    .from(otpRequests)
    .where(and(eq(otpRequests.mobile, mobile), eq(otpRequests.purpose, purpose)))
    .orderBy(desc(otpRequests.id))
    .limit(1);
  if (recent[0] && Date.now() - new Date(recent[0].createdAt).getTime() < 30_000) {
    const wait = Math.ceil(
      (30_000 - (Date.now() - new Date(recent[0].createdAt).getTime())) / 1000
    );
    return { ok: false, error: `Please wait ${wait}s before requesting a new OTP.`, waitSeconds: wait };
  }
  if (!rateLimit(`otp:${mobile}`, 6, 60 * 60 * 1000)) {
    return { ok: false, error: "Too many OTP requests. Please try again later." };
  }

  const otp = generateOtp();
  await db
    .update(otpRequests)
    .set({ consumed: true })
    .where(and(eq(otpRequests.mobile, mobile), eq(otpRequests.purpose, purpose)));
  await db.insert(otpRequests).values({
    mobile,
    purpose,
    otpHash: hashOtp(mobile, otp),
    pendingPasswordHash: pendingPasswordHash ?? null,
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
  });

  // No SMS gateway is configured in this environment, so the OTP is surfaced
  // in the API response for demo/development use. Wire an SMS provider here
  // (e.g. MSG91/Twilio) and stop returning the OTP when going live.
  return { ok: true, devOtp: otp };
}

export async function verifyOtp(
  mobile: string,
  purpose: OtpPurpose,
  otp: string
): Promise<{ ok: boolean; error?: string; pendingPasswordHash?: string | null }> {
  await ensureDb();
  const rows = await db
    .select()
    .from(otpRequests)
    .where(
      and(
        eq(otpRequests.mobile, mobile),
        eq(otpRequests.purpose, purpose),
        eq(otpRequests.consumed, false),
        gt(otpRequests.expiresAt, new Date())
      )
    )
    .orderBy(desc(otpRequests.id))
    .limit(1);
  const rec = rows[0];
  if (!rec) return { ok: false, error: "OTP expired. Please request a new one." };
  if (rec.attempts >= MAX_ATTEMPTS)
    return { ok: false, error: "Too many wrong attempts. Please request a new OTP." };
  if (rec.otpHash !== hashOtp(mobile, otp)) {
    await db
      .update(otpRequests)
      .set({ attempts: rec.attempts + 1 })
      .where(eq(otpRequests.id, rec.id));
    return { ok: false, error: "Incorrect OTP. Please try again." };
  }
  await db
    .update(otpRequests)
    .set({ consumed: true })
    .where(eq(otpRequests.id, rec.id));
  return { ok: true, pendingPasswordHash: rec.pendingPasswordHash };
}
