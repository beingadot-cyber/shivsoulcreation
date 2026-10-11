"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/store/cart";
import { formatINR } from "@/lib/format";
import ProductImage from "@/components/ProductImage";

type ProductInfo = {
  code: string;
  name: string;
  price: number;
  imageUrl: string | null;
  stockQuantity: number;
};

export default function CartPage() {
  const { items, setQty, remove } = useCart();
  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState<ProductInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    const codes = items.map((i) => i.code).join(",");
    if (!codes) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/products?codes=${encodeURIComponent(codes)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setProducts(d.products || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [mounted, items]);

  const info = new Map(products.map((p) => [p.code, p]));
  const lines = items
    .map((i) => ({ ...i, product: info.get(i.code) }))
    .filter((l) => l.product);
  const subtotal = lines.reduce((s, l) => s + l.product!.price * l.qty, 0);

  if (!mounted || loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 pt-16 pb-16 text-center text-sm font-semibold text-plumsoft">
        Loading your cart…
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-20 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-blush text-rose">
          <ShoppingBag className="h-7 w-7" strokeWidth={1.6} />
        </span>
        <h1 className="font-display text-2xl font-semibold text-plum">Your cart is empty</h1>
        <p className="text-sm text-plumsoft">
          Browse our handcrafted festive décor and find something you love.
        </p>
        <Link href="/products" className="btn-rose px-7 py-3">
          Continue Shopping <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pt-8">
      <h1 className="section-title mb-6">Shopping Cart</h1>
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-3">
          {lines.map((l) => (
            <div key={l.code} className="card flex gap-3 p-3 sm:gap-4 sm:p-4">
              <Link
                href={`/products/${l.code.toLowerCase()}`}
                className="h-20 w-20 shrink-0 overflow-hidden rounded-xl sm:h-24 sm:w-24"
              >
                <ProductImage src={l.product!.imageUrl} alt={l.product!.name} code={l.code} />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href={`/products/${l.code.toLowerCase()}`}
                      className="line-clamp-2 text-sm font-bold text-plum hover:text-rose"
                    >
                      {l.product!.name}
                    </Link>
                    <p className="mt-0.5 text-[11px] font-semibold tracking-wider text-plumsoft/80">
                      {l.code} · {formatINR(l.product!.price)} each
                    </p>
                  </div>
                  <button
                    onClick={() => remove(l.code)}
                    aria-label="Remove item"
                    className="cursor-pointer p-1.5 text-plumsoft transition hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="inline-flex items-center rounded-full border border-plum/15 bg-white">
                    <button
                      onClick={() => setQty(l.code, l.qty - 1)}
                      aria-label="Decrease quantity"
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-plum transition hover:bg-blush"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-bold">{l.qty}</span>
                    <button
                      onClick={() => setQty(l.code, Math.min(l.product!.stockQuantity || 99, l.qty + 1))}
                      aria-label="Increase quantity"
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-plum transition hover:bg-blush"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="font-display text-base font-semibold text-rosedeep">
                    {formatINR(l.product!.price * l.qty)}
                  </span>
                </div>
              </div>
            </div>
          ))}
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 pt-1 text-sm font-bold text-rose hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Continue Shopping
          </Link>
        </div>

        <aside className="card h-fit p-5 lg:sticky lg:top-28">
          <h2 className="font-display text-lg font-semibold text-plum">Order Summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-plumsoft">Subtotal</dt>
              <dd className="font-bold">{formatINR(subtotal)}</dd>
            </div>
            <div className="flex justify-between border-t border-plum/10 pt-3 text-base">
              <dt className="font-bold">Total</dt>
              <dd className="font-display font-semibold text-rosedeep">{formatINR(subtotal)}</dd>
            </div>
          </dl>
          <Link href="/checkout" className="btn-rose mt-5 w-full py-3 text-base">
            Proceed to Checkout <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-3 text-center text-[11px] font-semibold text-plumsoft">
            Guest checkout available — no account needed
          </p>
        </aside>
      </div>
    </div>
  );
}
