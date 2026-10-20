import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, PackageCheck, PackageX } from "lucide-react";
import { getProductByCode, getPublicProducts } from "@/lib/data";
import { formatINR } from "@/lib/format";
import ProductImage from "@/components/ProductImage";
import ProductCard from "@/components/ProductCard";
import BuyBox from "@/components/BuyBox";
import ProductReviews from "@/components/ProductReviews";
import ViewContentTracker from "@/components/ViewContentTracker";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const product = await getProductByCode(code);
  if (!product) return { title: "Product not found" };
  return { title: product.name };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const product = await getProductByCode(code);
  if (!product) notFound();

  const all = await getPublicProducts();
  const related = all
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, 4);
  const out = product.stockQuantity <= 0;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6">
      <ViewContentTracker code={product.productCode} name={product.name} price={product.price} />
      {/* Breadcrumb */}
      <nav className="mb-5 flex items-center gap-1 text-xs font-semibold text-plumsoft">
        <Link href="/" className="hover:text-rose">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/products" className="hover:text-rose">Products</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-plum">{product.productCode}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="card overflow-hidden">
          <ProductImage src={product.imageUrl} alt={product.name} code={product.productCode} />
        </div>

        <div className="flex flex-col">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="chip">{product.productCode}</span>
            {product.category && <span className="chip bg-blushdeep">{product.category}</span>}
            {product.isBestseller && <span className="chip bg-plum text-cream">Bestseller</span>}
          </div>
          <h1 className="font-display text-2xl leading-tight font-semibold text-plum sm:text-3xl">
            {product.name}
          </h1>

          <div className="mt-3 flex items-baseline gap-3">
            <span className="font-display text-3xl font-semibold text-rosedeep">
              {formatINR(product.price)}
            </span>
            {product.mrp && product.mrp > product.price && (
              <span className="text-sm font-semibold text-plumsoft/70 line-through">
                {formatINR(product.mrp)}
              </span>
            )}
          </div>

          <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold">
            {out ? (
              <>
                <PackageX className="h-4 w-4 text-red-500" />
                <span className="text-red-500">Out of stock</span>
              </>
            ) : (
              <>
                <PackageCheck className="h-4 w-4 text-sage" />
                <span className="text-sage">
                  In stock{product.stockQuantity <= 5 ? ` — only ${product.stockQuantity} left` : ""}
                </span>
              </>
            )}
          </p>

          {product.description && (
            <p className="mt-4 text-sm leading-relaxed text-plum/85">{product.description}</p>
          )}
          {product.productCode === "SSC-010" && (
            <p className="mt-2 text-xs font-semibold text-plumsoft">
              Sold as a pair — price includes 2 pieces.
            </p>
          )}

          <div className="mt-6 border-t border-plum/10 pt-6">
            <BuyBox
              code={product.productCode}
              stock={product.stockQuantity}
              name={product.name}
              price={product.price}
            />
          </div>
        </div>
      </div>

      <ProductReviews code={product.productCode} name={product.name} />

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="section-title mb-5">You may also like</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
