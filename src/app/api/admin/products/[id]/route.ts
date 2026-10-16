import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { ensureDb } from "@/lib/db-setup";
import { requireAdminApi } from "@/lib/auth";

const CODE_RE = /^[A-Z0-9-]{3,20}$/;

async function getId(ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return parseInt(id, 10);
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdminApi();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await ensureDb();
    const id = await getId(ctx);
    const b = await req.json();
    const updates: Partial<typeof products.$inferInsert> = { updatedAt: new Date() };
    if (b.name !== undefined) {
      const name = String(b.name).trim();
      if (name.length < 3) return NextResponse.json({ error: "Product name is too short." }, { status: 400 });
      updates.name = name;
    }
    if (b.productCode !== undefined) {
      const code = String(b.productCode).trim().toUpperCase();
      if (!CODE_RE.test(code)) return NextResponse.json({ error: "Invalid product code." }, { status: 400 });
      const dupe = await db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.productCode, code))
        .limit(1);
      if (dupe[0] && dupe[0].id !== id)
        return NextResponse.json({ error: "Another product already uses this code." }, { status: 409 });
      updates.productCode = code;
    }
    if (b.price !== undefined) {
      const price = Math.round(Number(b.price));
      if (!Number.isFinite(price) || price <= 0) return NextResponse.json({ error: "Enter a valid price." }, { status: 400 });
      updates.price = price;
    }
    if (b.mrp !== undefined) updates.mrp = b.mrp ? Math.round(Number(b.mrp)) : null;
    if (b.description !== undefined) updates.description = String(b.description).trim();
    if (b.category !== undefined) updates.category = String(b.category).trim() || null;
    if (b.imageUrl !== undefined) updates.imageUrl = b.imageUrl || null;
    if (b.stockQuantity !== undefined)
      updates.stockQuantity = Math.max(0, Math.floor(Number(b.stockQuantity) || 0));
    if (b.isActive !== undefined) updates.isActive = !!b.isActive;
    if (b.isFeatured !== undefined) updates.isFeatured = !!b.isFeatured;
    if (b.isBestseller !== undefined) updates.isBestseller = !!b.isBestseller;
    if (b.isArchived !== undefined) updates.isArchived = !!b.isArchived;
    await db.update(products).set(updates).where(eq(products.id, id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("admin-update-product", e);
    return NextResponse.json({ error: "Could not update the product." }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdminApi();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureDb();
  const id = await getId(ctx);
  // Archive instead of hard-delete so historical orders stay intact.
  await db
    .update(products)
    .set({ isArchived: true, isActive: false, updatedAt: new Date() })
    .where(eq(products.id, id));
  return NextResponse.json({ ok: true, archived: true });
}
