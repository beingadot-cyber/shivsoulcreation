import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { reels } from "@/db/schema";
import { ensureDb } from "@/lib/db-setup";
import { requireAdminApi } from "@/lib/auth";

export async function POST(req: Request) {
  const admin = await requireAdminApi();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureDb();
  const b = await req.json();
  if (!b.videoUrl) return NextResponse.json({ error: "Please upload a reel video first." }, { status: 400 });
  const existing = await db.select().from(reels).orderBy(asc(reels.sortOrder));
  await db.insert(reels).values({
    videoUrl: b.videoUrl,
    caption: String(b.caption || "").trim(),
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
  const updates: Partial<typeof reels.$inferInsert> = {};
  if (b.caption !== undefined) updates.caption = String(b.caption).trim();
  if (b.videoUrl !== undefined) updates.videoUrl = b.videoUrl;
  if (b.isEnabled !== undefined) updates.isEnabled = !!b.isEnabled;
  await db.update(reels).set(updates).where(eq(reels.id, id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const admin = await requireAdminApi();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureDb();
  const { id } = await req.json();
  await db.delete(reels).where(eq(reels.id, parseInt(id, 10)));
  return NextResponse.json({ ok: true });
}
