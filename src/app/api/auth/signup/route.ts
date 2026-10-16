import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { ensureDb } from "@/lib/db-setup";
import { hashPassword } from "@/lib/crypto";
import { createSession, isValidMobile, isStrongPassword, rateLimit } from "@/lib/auth";

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
    const inserted = await db
      .insert(customers)
      .values({
        mobileNumber: mobile,
        passwordHash: hashPassword(password),
        mobileVerified: false,
        lastLogin: new Date(),
      })
      .returning({ id: customers.id });
    await createSession("customer", inserted[0].id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("signup", e);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
