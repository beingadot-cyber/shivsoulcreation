import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { ensureDb } from "@/lib/db-setup";
import { verifyOtp } from "@/lib/otp";
import { createSession, isValidMobile, rateLimit } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await ensureDb();
    const { mobile, otp, purpose } = await req.json();
    if (!isValidMobile(mobile || "") || !otp) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    if (purpose !== "signup" && purpose !== "register") {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    const ip = req.headers.get("x-forwarded-for") || "local";
    if (!rateLimit(`verify:${ip}:${mobile}`, 10, 15 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
    }
    const result = await verifyOtp(mobile, purpose, otp);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    if (!result.pendingPasswordHash) {
      return NextResponse.json({ error: "Verification expired. Please start again." }, { status: 400 });
    }
    // Create the customer (double-check uniqueness for race safety).
    const existing = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.mobileNumber, mobile))
      .limit(1);
    let customerId: number;
    if (existing[0]) {
      customerId = existing[0].id;
    } else {
      const inserted = await db
        .insert(customers)
        .values({
          mobileNumber: mobile,
          passwordHash: result.pendingPasswordHash,
          mobileVerified: true,
          lastLogin: new Date(),
        })
        .returning({ id: customers.id });
      customerId = inserted[0].id;
    }
    await db
      .update(customers)
      .set({ lastLogin: new Date() })
      .where(eq(customers.id, customerId));
    await createSession("customer", customerId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("verify-otp", e);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
