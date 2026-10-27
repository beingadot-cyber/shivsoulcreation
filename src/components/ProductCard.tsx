"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Eye, ShoppingBag } from "lucide-react";
import { useCart } from "@/store/cart";
import { formatINR } from "@/lib/format";
import ProductImage from "./ProductImage";

export type CardProduct = {
  productCode: string;
  name: string;
  price: number;
  mrp?: number | null;
  imageUrl?: string | null;
  category?: string | null;
  stockQuantity: number;
  isBestseller?: boolean;
};

export default function ProductCard({ product }: { product: CardProduct }) {
  const add = useCart((s) => s.add);
  const [added, setAdded] = useState(false);
  const out = product.stockQuantity <= 0;
  const href = `/products/${product.productCode.toLowerCase()}`;

  function handleAdd() {
    add(product.productCode, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  }

  return (
    <div className="card group flex flex-col overflow-hidden">
      <Link href={href} className="relative block overflow-hidden">
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          code={product.productCode}
          className="transition-transform duration-300 group-hover:scale-[1.04]"
        />
        {product.isBestseller && (
          <span className="absolute top-2.5 left-2.5 rounded-full bg-plum/90 px-2.5 py-1 text-[10px] font-bold tracking-wider text-cream uppercase">
            Bestseller
          </span>
        )}
        {out && (
          <span className="absolute right-2.5 bottom-2.5 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-red-500">
            Out of stock
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <Link
          href={href}
          className="line-clamp-2 min-h-10 text-sm leading-snug font-bold text-plum transition hover:text-rose"
        >
          {product.name}
        </Link>
        <p className="mt-1 text-[11px] font-semibold tracking-wider text-plumsoft/80">{product.productCode}</p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-display text-lg font-semibold text-rosedeep">
            {formatINR(product.price)}
          </span>
          {product.mrp && product.mrp > product.price && (
            <span className="text-xs font-semibold text-plumsoft/70 line-through">
              {formatINR(product.mrp)}
            </span>
          )}
        </div>
        <div className="mt-3 flex flex-col gap-2">
          <button
            onClick={handleAdd}
            disabled={out}
            aria-label={added ? "Added to cart" : "Add to cart"}
            className={`w-full min-w-0 cursor-pointer px-3 py-2 text-xs sm:text-sm ${
              added ? "btn-dark bg-sage" : "btn-rose"
            }`}
          >
            {added ? (
              <>
                <Check className="h-4 w-4 shrink-0" /> Added
              </>
            ) : (
              <>
                <ShoppingBag className="h-4 w-4 shrink-0" /> Add to Cart
              </>
            )}
          </button>
          <Link
            href={href}
            aria-label={`View ${product.name}`}
            className="btn-outline w-full min-w-0 px-3 py-2 text-xs sm:text-sm"
          >
            <Eye className="h-4 w-4 shrink-0" /> View Product
          </Link>
        </div>
      </div>
    </div>
  );
}
