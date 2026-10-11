import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { ensureDb } from "@/lib/db-setup";
import { hashPassword } from "@/lib/crypto";
import { issueOtp } from "@/lib/otp";
import { isValidMobile, isStrongPassword, rateLimit } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await ensureDb();
    const { mobile, password } = await req.json();
    if (!isValidMobile(mobile || "")) {
      return NextResponse.json(
        { error: "Enter a valid 10-digit mobile number." },
        { status: 400 }
      );
    }
    if (!isStrongPassword(password || "")) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters and include letters and numbers." },
        { status: 400 }
      );
    }
    const ip = req.headers.get("x-forwarded-for") || "local";
    if (!rateLimit(`signup:${ip}`, 20, 15 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
    }
    const existing = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.mobileNumber, mobile))
      .limit(1);
    if (existing[0]) {
      return NextResponse.json(
        { error: "This mobile number is already registered. Please log in.", code: "exists" },
        { status: 409 }
      );
    }
    const issued = await issueOtp(mobile, "signup", hashPassword(password));
    if (!issued.ok) {
      return NextResponse.json({ error: issued.error }, { status: 429 });
    }
    return NextResponse.json({ ok: true, otpRequired: true, devOtp: issued.devOtp });
  } catch (e) {
    console.error("signup", e);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
