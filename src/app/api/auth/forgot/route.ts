import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { ensureDb } from "@/lib/db-setup";
import { issueOtp } from "@/lib/otp";
import { isValidMobile, rateLimit } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await ensureDb();
    const { mobile } = await req.json();
    if (!isValidMobile(mobile || "")) {
      return NextResponse.json(
        { error: "Enter a valid 10-digit mobile number." },
        { status: 400 }
      );
    }
    const ip = req.headers.get("x-forwarded-for") || "local";
    if (!rateLimit(`forgot:${ip}:${mobile}`, 8, 60 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
    }
    const rows = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.mobileNumber, mobile))
      .limit(1);
    if (!rows[0]) {
      return NextResponse.json(
        { error: "No account is registered with this mobile number." },
        { status: 404 }
      );
    }
    const issued = await issueOtp(mobile, "reset");
    if (!issued.ok) {
      return NextResponse.json({ error: issued.error }, { status: 429 });
    }
    return NextResponse.json({ ok: true, devOtp: issued.devOtp });
  } catch (e) {
    console.error("forgot", e);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
