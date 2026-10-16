import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { ensureDb } from "@/lib/db-setup";

export async function GET(req: Request) {
  await ensureDb();
  const url = new URL(req.url);
  const codesParam = url.searchParams.get("codes") || "";
  const codes = codesParam
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 50);
  if (codes.length === 0) return NextResponse.json({ products: [] });
  const rows = await db
    .select()
    .from(products)
    .where(
      and(
        inArray(products.productCode, codes),
        eq(products.isArchived, false),
        eq(products.isActive, true)
      )
    );
  return NextResponse.json({
    products: rows.map((p) => ({
      code: p.productCode,
      name: p.name,
      price: p.price,
      imageUrl: p.imageUrl,
      category: p.category,
      stockQuantity: p.stockQuantity,
    })),
  });
}
