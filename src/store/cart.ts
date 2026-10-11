"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = { code: string; qty: number };

type CartState = {
  items: CartItem[];
  add: (code: string, qty?: number) => void;
  setQty: (code: string, qty: number) => void;
  remove: (code: string) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (code, qty = 1) =>
        set((s) => {
          const existing = s.items.find((i) => i.code === code);
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.code === code ? { ...i, qty: Math.min(99, i.qty + qty) } : i
              ),
            };
          }
          return { items: [...s.items, { code, qty: Math.min(99, qty) }] };
        }),
      setQty: (code, qty) =>
        set((s) => ({
          items:
            qty <= 0
              ? s.items.filter((i) => i.code !== code)
              : s.items.map((i) =>
                  i.code === code ? { ...i, qty: Math.min(99, qty) } : i
                ),
        })),
      remove: (code) => set((s) => ({ items: s.items.filter((i) => i.code !== code) })),
      clear: () => set({ items: [] }),
    }),
    { name: "ssc-cart" }
  )
);

export function cartCount(items: CartItem[]): number {
  return items.reduce((n, i) => n + i.qty, 0);
}
