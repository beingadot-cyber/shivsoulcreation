import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { ensureDb } from "@/lib/db-setup";
import { hashPassword } from "@/lib/crypto";
import { verifyOtp } from "@/lib/otp";
import { createSession, isValidMobile, isStrongPassword } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await ensureDb();
    const { mobile, otp, password } = await req.json();
    if (!isValidMobile(mobile || "") || !otp) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    if (!isStrongPassword(password || "")) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters and include letters and numbers." },
        { status: 400 }
      );
    }
    const result = await verifyOtp(mobile, "reset", otp);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    await db
      .update(customers)
      .set({ passwordHash: hashPassword(password), lastLogin: new Date() })
      .where(eq(customers.mobileNumber, mobile));
    const rows = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.mobileNumber, mobile))
      .limit(1);
    if (rows[0]) await createSession("customer", rows[0].id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("reset", e);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
