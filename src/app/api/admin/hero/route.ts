import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { heroSlides } from "@/db/schema";
import { ensureDb } from "@/lib/db-setup";
import { requireAdminApi } from "@/lib/auth";

export async function POST(req: Request) {
  const admin = await requireAdminApi();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureDb();
  const b = await req.json();
  if (!b.mediaUrl || !(b.mediaType === "image" || b.mediaType === "video"))
    return NextResponse.json({ error: "Invalid slide data." }, { status: 400 });
  const existing = await db.select().from(heroSlides).orderBy(asc(heroSlides.sortOrder));
  await db.insert(heroSlides).values({
    mediaUrl: b.mediaUrl,
    mediaType: b.mediaType,
    sortOrder: existing.length ? Math.max(...existing.map((s) => s.sortOrder)) + 1 : 1,
    isEnabled: true,
  });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request) {
  const admin = await requireAdminApi();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureDb();
  const b = await req.json();
  const id = parseInt(b.id, 10);
  if (!id) return NextResponse.json({ error: "Invalid slide." }, { status: 400 });

  if (b.move === "up" || b.move === "down") {
    const all = await db
      .select()
      .from(heroSlides)
      .orderBy(asc(heroSlides.sortOrder), asc(heroSlides.id));
    const idx = all.findIndex((s) => s.id === id);
    if (idx === -1) return NextResponse.json({ error: "Slide not found." }, { status: 404 });
    const swapWith = b.move === "up" ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= all.length) return NextResponse.json({ ok: true });
    const a = all[idx];
    const c = all[swapWith];
    // Use distinct temporary values to avoid ties
    await db.update(heroSlides).set({ sortOrder: c.sortOrder === a.sortOrder ? c.sortOrder + 1 : c.sortOrder }).where(eq(heroSlides.id, a.id));
    await db.update(heroSlides).set({ sortOrder: a.sortOrder }).where(eq(heroSlides.id, c.id));
    return NextResponse.json({ ok: true });
  }
  const updates: Partial<typeof heroSlides.$inferInsert> = {};
  if (b.isEnabled !== undefined) updates.isEnabled = !!b.isEnabled;
  if (b.mediaUrl !== undefined) updates.mediaUrl = b.mediaUrl;
  if (b.mediaType !== undefined) updates.mediaType = b.mediaType;
  await db.update(heroSlides).set(updates).where(eq(heroSlides.id, id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const admin = await requireAdminApi();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureDb();
  const { id } = await req.json();
  await db.delete(heroSlides).where(eq(heroSlides.id, parseInt(id, 10)));
  return NextResponse.json({ ok: true });
}
