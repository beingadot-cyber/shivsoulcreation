"use client";

import { useEffect } from "react";
import { useCart } from "@/store/cart";

/**
 * Keeps the saved cart honest: if a product in someone's cart was deleted or
 * switched off, it is removed automatically so the cart badge never counts
 * items that can't be bought. A failed network request never touches the cart.
 */
export default function CartSync() {
  const items = useCart((s) => s.items);
  const remove = useCart((s) => s.remove);
  const key = items
    .map((i) => i.code)
    .sort()
    .join(",");

  useEffect(() => {
    if (!key) return;
    const codes = key.split(",").slice(0, 50);
    let stop = false;
    fetch(`/api/products?codes=${encodeURIComponent(codes.join(","))}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (stop || !d || !Array.isArray(d.products)) return;
        const live = new Set<string>(d.products.map((p: { code: string }) => p.code.toUpperCase()));
        for (const code of codes) if (!live.has(code.toUpperCase())) remove(code);
      })
      .catch(() => {});
    return () => {
      stop = true;
    };
  }, [key, remove]);

  return null;
}
