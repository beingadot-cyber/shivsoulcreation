"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Minus, Plus, ShoppingBag, Zap } from "lucide-react";
import { useCart } from "@/store/cart";

export default function BuyBox({ code, stock }: { code: string; stock: number }) {
  const router = useRouter();
  const add = useCart((s) => s.add);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const out = stock <= 0;
  const max = Math.max(1, Math.min(99, stock));

  function handleAdd() {
    add(code, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <span className="label mb-0">Quantity</span>
        <div className="inline-flex items-center rounded-full border border-plum/15 bg-white">
          <button
            onClick={() => setQty((v) => Math.max(1, v - 1))}
            disabled={qty <= 1}
            aria-label="Decrease quantity"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-plum transition hover:bg-blush disabled:opacity-40"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-10 text-center text-sm font-bold">{qty}</span>
          <button
            onClick={() => setQty((v) => Math.min(max, v + 1))}
            disabled={qty >= max}
            aria-label="Increase quantity"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-plum transition hover:bg-blush disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row">
        <button
          onClick={handleAdd}
          disabled={out}
          className={`flex-1 py-3 text-base ${added ? "btn-dark bg-sage" : "btn-outline border-rose text-rose"}`}
        >
          {added ? (
            <>
              <Check className="h-5 w-5" /> Added to Cart
            </>
          ) : (
            <>
              <ShoppingBag className="h-5 w-5" /> Add to Cart
            </>
          )}
        </button>
        <button
          onClick={() => router.push(`/checkout?buy=${encodeURIComponent(code)}&qty=${qty}`)}
          disabled={out}
          className="btn-rose flex-1 py-3 text-base"
        >
          <Zap className="h-5 w-5" /> Buy Now
        </button>
      </div>
      {out && (
        <p className="text-sm font-semibold text-red-500">
          This piece is currently out of stock. Check back soon!
        </p>
      )}
    </div>
  );
}
