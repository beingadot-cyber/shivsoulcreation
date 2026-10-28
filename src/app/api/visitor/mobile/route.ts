import { NextResponse } from "next/server";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { ensureDb } from "@/lib/db-setup";
import { isValidMobile, rateLimit } from "@/lib/auth";

/**
 * Saves a visitor's mobile number (from the site popup) into the Customers list.
 * No password is set — if the person later signs up with this number they simply
 * choose one. Existing customers are left untouched.
 */
export async function POST(req: Request) {
  try {
    await ensureDb();
    const body = await req.json().catch(() => ({}));
    const mobile = String(body.mobile || "").replace(/\D/g, "").slice(-10);
    if (!isValidMobile(mobile)) {
      return NextResponse.json({ error: "Please enter a valid mobile number." }, { status: 400 });
    }
    const ip = req.headers.get("x-forwarded-for") || "local";
    if (!rateLimit(`visitor-ip:${ip}`, 20, 10 * 60 * 1000) || !rateLimit(`visitor-mobile:${mobile}`, 5, 10 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
    }
    await db
      .insert(customers)
      .values({ mobileNumber: mobile, passwordHash: "", mobileVerified: false })
      .onConflictDoNothing({ target: customers.mobileNumber });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("visitor-mobile", e);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
