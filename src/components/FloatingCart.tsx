"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { useCart, cartCount } from "@/store/cart";
import { formatINR } from "@/lib/format";

/**
 * Fixed cart bar at the bottom of the screen. It appears as soon as something
 * is in the cart, stays in place while the page scrolls, and keeps a margin
 * from the screen edges (and from the phone's home-indicator area).
 */
export default function FloatingCart() {
  const items = useCart((s) => s.items);
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [prices, setPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  const codesKey = items.map((i) => i.code).sort().join(",");
  useEffect(() => {
    if (!codesKey) return;
    let stop = false;
    fetch(`/api/products?codes=${encodeURIComponent(codesKey)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (stop) return;
        const m: Record<string, number> = {};
        for (const p of d.products || []) m[p.code] = p.price;
        setPrices(m);
      })
      .catch(() => {});
    return () => {
      stop = true;
    };
  }, [codesKey]);

  const count = cartCount(items);
  const hidden =
    !mounted ||
    count === 0 ||
    pathname.startsWith("/cart") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/payment");
  if (hidden) return null;

  const total = items.reduce((s, i) => s + (prices[i.code] || 0) * i.qty, 0);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <Link
        href="/cart"
        key={count}
        aria-label={`View cart, ${count} item${count === 1 ? "" : "s"}`}
        className="cart-bar pointer-events-auto flex w-full max-w-md items-center justify-between gap-3 rounded-full bg-plum px-5 py-3 text-white shadow-[0_8px_30px_rgba(66,38,47,0.35)] transition-transform active:scale-[0.98]"
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
            <ShoppingBag className="h-[18px] w-[18px]" />
            <span className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose px-1 text-[10px] font-bold">
              {count}
            </span>
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block text-sm font-bold">View Cart</span>
            {total > 0 && (
              <span className="block text-[11px] font-semibold text-white/75">
                {count} item{count === 1 ? "" : "s"} · {formatINR(total)}
              </span>
            )}
          </span>
        </span>
        <ArrowRight className="h-5 w-5 shrink-0" />
      </Link>
    </div>
  );
}
