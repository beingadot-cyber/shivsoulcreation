import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { admins } from "@/db/schema";
import { ensureDb } from "@/lib/db-setup";
import { verifyPassword } from "@/lib/crypto";
import { createSession, rateLimit } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await ensureDb();
    const { username, password } = await req.json();
    const ip = req.headers.get("x-forwarded-for") || "local";
    if (!rateLimit(`admin-login:${ip}`, 8, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again after 15 minutes." },
        { status: 429 }
      );
    }
    const rows = await db
      .select()
      .from(admins)
      .where(eq(admins.username, String(username || "").trim()))
      .limit(1);
    const admin = rows[0];
    if (!admin || !verifyPassword(String(password || ""), admin.passwordHash)) {
      return NextResponse.json({ error: "Invalid admin credentials." }, { status: 401 });
    }
    await createSession("admin", admin.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("admin-login", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
