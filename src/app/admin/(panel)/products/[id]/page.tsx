import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { db } from "@/db";
import { products } from "@/db/schema";
import { ensureDb } from "@/lib/db-setup";
import ProductForm from "@/components/admin/ProductForm";

export const metadata: Metadata = { title: "Edit Product" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await ensureDb();
  const rows = await db
    .select()
    .from(products)
    .where(eq(products.id, parseInt(id, 10)))
    .limit(1);
  const p = rows[0];
  if (!p) notFound();

  return (
    <div>
      <Link href="/admin/products" className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-rose hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to Products
      </Link>
      <h1 className="font-display mb-6 text-2xl font-semibold text-plum">
        Edit Product <span className="font-mono text-base text-plumsoft">({p.productCode})</span>
      </h1>
      <ProductForm
        isEdit
        initial={{
          id: p.id,
          productCode: p.productCode,
          name: p.name,
          price: String(p.price),
          mrp: p.mrp ? String(p.mrp) : "",
          description: p.description,
          category: p.category || "",
          imageUrl: p.imageUrl,
          stockQuantity: String(p.stockQuantity),
          isActive: p.isActive,
          isFeatured: p.isFeatured,
          isBestseller: p.isBestseller,
        }}
      />
    </div>
  );
}
