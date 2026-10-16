import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { testimonials } from "@/db/schema";
import { ensureDb } from "@/lib/db-setup";
import { requireAdminApi } from "@/lib/auth";

export async function POST(req: Request) {
  const admin = await requireAdminApi();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureDb();
  const b = await req.json();
  const name = String(b.customerName || "").trim();
  const message = String(b.message || "").trim();
  if (name.length < 2 || message.length < 5)
    return NextResponse.json({ error: "Name and message are required." }, { status: 400 });
  await db.insert(testimonials).values({
    customerName: name,
    message,
    rating: Math.min(5, Math.max(1, Math.floor(Number(b.rating) || 5))),
    isPublished: b.isPublished !== false,
  });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request) {
  const admin = await requireAdminApi();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureDb();
  const b = await req.json();
  const id = parseInt(b.id, 10);
  const updates: Partial<typeof testimonials.$inferInsert> = {};
  if (b.customerName !== undefined) updates.customerName = String(b.customerName).trim();
  if (b.message !== undefined) updates.message = String(b.message).trim();
  if (b.rating !== undefined) updates.rating = Math.min(5, Math.max(1, Math.floor(Number(b.rating) || 5)));
  if (b.isPublished !== undefined) updates.isPublished = !!b.isPublished;
  await db.update(testimonials).set(updates).where(eq(testimonials.id, id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const admin = await requireAdminApi();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureDb();
  const { id } = await req.json();
  await db.delete(testimonials).where(eq(testimonials.id, parseInt(id, 10)));
  return NextResponse.json({ ok: true });
}
