"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BadgeCheck, Loader2, XCircle } from "lucide-react";
import { useCart } from "@/store/cart";
import { formatINR } from "@/lib/format";

type Info = {
  orderNumber: string;
  total: number;
  paymentStatus: string;
  customerMobile: string;
};

export default function PaymentStatusClient() {
  const order = useSearchParams().get("order") || "";
  const { clear } = useCart();
  const [info, setInfo] = useState<Info | null>(null);
  const [error, setError] = useState("");
  const cleared = useRef(false);

  useEffect(() => {
    if (!order) return;
    let stop = false;
    let tries = 0;

    async function check() {
      try {
        const res = await fetch(`/api/payment/status?order=${encodeURIComponent(order)}`, {
          cache: "no-store",
        });
        const d = await res.json();
        if (stop) return;
        if (!res.ok || d.error) {
          setError(d.error || "Could not check your payment.");
          return;
        }
        setInfo(d);
        if (d.paymentStatus === "paid" && !cleared.current) {
          cleared.current = true;
          clear();
        }
        // Keep polling for up to ~2 minutes while the payment is still pending.
        if (d.paymentStatus === "pending" && ++tries < 40) setTimeout(check, 3000);
      } catch {
        if (!stop) setError("Network error. Please refresh this page.");
      }
    }
    check();
    return () => {
      stop = true;
    };
  }, [order, clear]);

  const status = info?.paymentStatus;

  return (
    <div className="mx-auto max-w-xl px-4 pt-10 pb-16">
      <div className="card overflow-hidden text-center">
        {!order || error ? (
          <div className="p-8">
            <XCircle className="mx-auto mb-3 h-10 w-10 text-red-500" />
            <h1 className="font-display text-xl font-semibold text-plum">Something went wrong</h1>
            <p className="mt-2 text-sm text-plumsoft">{error || "No order found."}</p>
          </div>
        ) : !info || status === "pending" ? (
          <div className="p-8">
            <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-rose" />
            <h1 className="font-display text-xl font-semibold text-plum">Confirming your payment…</h1>
            <p className="mt-2 text-sm text-plumsoft">
              Please don&apos;t close this page. This usually takes a few seconds.
            </p>
            {info && (
              <p className="mt-3 text-xs font-semibold text-plumsoft">
                Order ID: <span className="font-mono text-rosedeep">{info.orderNumber}</span>
              </p>
            )}
          </div>
        ) : status === "paid" ? (
          <>
            <div className="bg-sage/15 px-6 py-8">
              <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-sage/20 text-sage">
                <BadgeCheck className="h-7 w-7" />
              </span>
              <h1 className="font-display text-2xl font-semibold text-plum">Payment successful!</h1>
              <p className="mt-1 text-sm font-semibold text-plumsoft">
                Order ID: <span className="font-mono font-bold text-rosedeep">{info.orderNumber}</span>
              </p>
            </div>
            <div className="space-y-2 p-6 text-sm text-plumsoft">
              <p>
                We received <span className="font-bold text-plum">{formatINR(info.total)}</span>. We&apos;ll
                contact you on +91 {info.customerMobile} to confirm delivery.
              </p>
              <Link href="/products" className="btn-outline mt-3">Continue Shopping</Link>
            </div>
          </>
        ) : (
          <div className="p-8">
            <XCircle className="mx-auto mb-3 h-10 w-10 text-red-500" />
            <h1 className="font-display text-xl font-semibold text-plum">Payment not completed</h1>
            <p className="mt-2 text-sm text-plumsoft">
              Your payment for order <span className="font-mono">{info.orderNumber}</span> did not go through,
              so the order was cancelled. If money was deducted, it will be refunded automatically by your bank.
              Your cart is still saved.
            </p>
            <Link href="/checkout" className="btn-rose mt-4 px-7 py-3">Try Again</Link>
          </div>
        )}
      </div>
    </div>
  );
}
