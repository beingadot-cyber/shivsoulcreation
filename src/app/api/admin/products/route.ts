import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { ensureDb } from "@/lib/db-setup";
import { requireAdminApi } from "@/lib/auth";

const CODE_RE = /^[A-Z0-9-]{3,20}$/;

export async function POST(req: Request) {
  const admin = await requireAdminApi();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await ensureDb();
    const b = await req.json();
    const code = String(b.productCode || "").trim().toUpperCase();
    const name = String(b.name || "").trim();
    const price = Math.round(Number(b.price));
    if (!CODE_RE.test(code))
      return NextResponse.json({ error: "Product code must be 3-20 characters (letters, numbers, dashes)." }, { status: 400 });
    if (name.length < 3)
      return NextResponse.json({ error: "Product name is required (min 3 characters)." }, { status: 400 });
    if (!Number.isFinite(price) || price <= 0 || price > 1000000)
      return NextResponse.json({ error: "Enter a valid price." }, { status: 400 });
    const existing = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.productCode, code))
      .limit(1);
    if (existing[0])
      return NextResponse.json({ error: "A product with this code already exists." }, { status: 409 });
    const [created] = await db
      .insert(products)
      .values({
        productCode: code,
        name,
        price,
        mrp: b.mrp ? Math.round(Number(b.mrp)) : null,
        description: String(b.description || "").trim(),
        category: String(b.category || "").trim() || null,
        imageUrl: b.imageUrl || null,
        stockQuantity: Math.max(0, Math.floor(Number(b.stockQuantity) || 0)),
        isActive: !!b.isActive,
        isFeatured: !!b.isFeatured,
        isBestseller: !!b.isBestseller,
      })
      .returning({ id: products.id });
    return NextResponse.json({ ok: true, id: created.id });
  } catch (e) {
    console.error("admin-create-product", e);
    return NextResponse.json({ error: "Could not save the product." }, { status: 500 });
  }
}
