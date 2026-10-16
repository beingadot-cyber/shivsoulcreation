import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { ensureDb } from "@/lib/db-setup";
import { verifyPassword } from "@/lib/crypto";
import { createSession, isValidMobile, rateLimit } from "@/lib/auth";

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
    if (!password || password.length < 1) {
      return NextResponse.json({ error: "Please enter your password." }, { status: 400 });
    }
    const ip = req.headers.get("x-forwarded-for") || "local";
    if (!rateLimit(`login:${ip}:${mobile}`, 10, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again after 15 minutes." },
        { status: 429 }
      );
    }
    const rows = await db
      .select()
      .from(customers)
      .where(eq(customers.mobileNumber, mobile))
      .limit(1);
    const customer = rows[0];

    if (customer) {
      if (customer.accountStatus !== "active") {
        return NextResponse.json(
          { error: "Your account has been disabled. Please contact support." },
          { status: 403 }
        );
      }
      if (!verifyPassword(password, customer.passwordHash)) {
        return NextResponse.json(
          { error: "Incorrect password. Please try again." },
          { status: 401 }
        );
      }
      await db
        .update(customers)
        .set({ lastLogin: new Date() })
        .where(eq(customers.id, customer.id));
      await createSession("customer", customer.id);
      return NextResponse.json({ ok: true, status: "logged-in" });
    }

    return NextResponse.json(
      { error: "No account found with this mobile number. Please sign up first." },
      { status: 404 }
    );
  } catch (e) {
    console.error("login", e);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
