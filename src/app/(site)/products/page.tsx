import type { Metadata } from "next";
import { getPublicProducts } from "@/lib/data";
import ProductsBrowser from "@/components/ProductsBrowser";

export const metadata: Metadata = { title: "All Products" };

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const sp = await searchParams;
  const products = await getPublicProducts();
  const serialised = products.map((p) => ({
    productCode: p.productCode,
    name: p.name,
    price: p.price,
    mrp: p.mrp,
    imageUrl: p.imageUrl,
    category: p.category,
    stockQuantity: p.stockQuantity,
    isBestseller: p.isBestseller,
  }));
  return (
    <div className="mx-auto max-w-6xl px-4 pt-8">
      <p className="mb-1 text-xs font-bold tracking-[0.2em] text-rose uppercase">The full collection</p>
      <h1 className="section-title mb-6">All Products</h1>
      <ProductsBrowser
        products={serialised}
        initialQuery={sp.q || ""}
        initialCategory={sp.category || ""}
      />
    </div>
  );
}
