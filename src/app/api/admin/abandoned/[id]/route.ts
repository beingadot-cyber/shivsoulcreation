import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { abandonedCheckouts } from "@/db/schema";
import { ensureDb } from "@/lib/db-setup";
import { requireAdminApi } from "@/lib/auth";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminApi();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureDb();
  const { id } = await ctx.params;
  const b = await req.json().catch(() => ({}));
  await db
    .update(abandonedCheckouts)
    .set({ contacted: !!b.contacted })
    .where(eq(abandonedCheckouts.id, parseInt(id, 10)));
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminApi();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureDb();
  const { id } = await ctx.params;
  await db.delete(abandonedCheckouts).where(eq(abandonedCheckouts.id, parseInt(id, 10)));
  return NextResponse.json({ ok: true });
}
