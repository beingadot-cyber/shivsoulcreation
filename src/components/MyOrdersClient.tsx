"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Loader2, Package, Search, Truck } from "lucide-react";
import { formatINR, formatDate, statusLabel } from "@/lib/format";

type Item = { id: number; name: string; code: string; price: number; qty: number };
type Order = {
  orderNumber: string;
  createdAt: string;
  orderStatus: string;
  paymentStatus: string;
  subtotal: number;
  discount: number;
  couponCode: string | null;
  shippingCharge: number;
  orderTotal: number;
  city: string;
  state: string;
  items: Item[];
};

const STEPS = ["confirmed", "processing", "shipped", "delivered"] as const;

function Pill({ value, kind }: { value: string; kind: "order" | "payment" }) {
  const palette: Record<string, string> = {
    delivered: "bg-sage/15 text-sage",
    paid: "bg-sage/15 text-sage",
    cancelled: "bg-red-50 text-red-500",
    failed: "bg-red-50 text-red-500",
    refunded: "bg-amber-50 text-amber-700",
    shipped: "bg-blue-50 text-blue-600",
  };
  const cls = palette[value] || (kind === "order" ? "bg-blush text-rosedeep" : "bg-amber-50 text-amber-700");
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase ${cls}`}>
      {statusLabel(value)}
    </span>
  );
}

function Progress({ status }: { status: string }) {
  if (status === "cancelled") return null;
  const idx = STEPS.indexOf(status as (typeof STEPS)[number]); // pending → -1
  return (
    <ol className="flex items-start py-3" aria-label="Order progress">
      {STEPS.map((s, i) => {
        const done = i <= idx;
        return (
          <li key={s} className="relative flex flex-1 flex-col items-center text-center">
            {i > 0 && (
              <span
                className={`absolute top-3 right-1/2 h-0.5 w-full ${i <= idx ? "bg-sage" : "bg-plum/10"}`}
                aria-hidden
              />
            )}
            <span
              className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                done ? "border-sage bg-sage text-white" : "border-plum/15 bg-white text-plumsoft"
              }`}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : i === 3 ? <Truck className="h-3 w-3" /> : null}
            </span>
            <span className={`mt-1.5 text-[10px] font-bold sm:text-xs ${done ? "text-plum" : "text-plumsoft/70"}`}>
              {statusLabel(s)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default function MyOrdersClient() {
  const [mobile, setMobile] = useState("");
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [searched, setSearched] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setError("Enter the valid 10-digit mobile number you used while ordering.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Could not fetch your orders.");
        setOrders(null);
      } else {
        setOrders(data.orders);
        setSearched(mobile);
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pt-8 pb-16 sm:pt-12">
      <div className="mb-6 text-center">
        <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blush text-rose">
          <Package className="h-7 w-7" />
        </span>
        <h1 className="font-display text-3xl font-semibold text-plum">My Orders</h1>
        <p className="mt-1 text-sm font-semibold text-plumsoft">
          Enter the mobile number you used while ordering to see your order status.
        </p>
      </div>

      <form onSubmit={lookup} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-5">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-sm font-bold text-plumsoft">
            +91
          </span>
          <input
            value={mobile}
            onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="10-digit mobile number"
            aria-label="Mobile number"
            className="input pl-12"
          />
        </div>
        <button type="submit" disabled={loading} className="btn-rose w-full sm:w-auto">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Track Orders
        </button>
      </form>
      {error && (
        <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</p>
      )}

      {orders && orders.length === 0 && (
        <div className="card mt-6 flex flex-col items-center gap-3 p-10 text-center">
          <p className="text-sm font-semibold text-plumsoft">
            No orders found for +91 {searched}. Check the number, or place your first order!
          </p>
          <Link href="/products" className="btn-rose">Start Shopping</Link>
        </div>
      )}

      {orders && orders.length > 0 && (
        <div className="mt-6 space-y-4">
          <p className="text-xs font-bold tracking-wider text-plumsoft uppercase">
            {orders.length} order{orders.length === 1 ? "" : "s"} for +91 {searched}
          </p>
          {orders.map((o) => (
            <div key={o.orderNumber} className="card p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-plum/10 pb-3">
                <div>
                  <p className="font-mono text-sm font-bold text-rosedeep">{o.orderNumber}</p>
                  <p className="text-xs font-semibold text-plumsoft">
                    {formatDate(o.createdAt)} · Delivering to {o.city}, {o.state}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Pill value={o.orderStatus} kind="order" />
                  <Pill value={o.paymentStatus} kind="payment" />
                </div>
              </div>

              <Progress status={o.orderStatus} />
              {o.orderStatus === "cancelled" && (
                <p className="py-2 text-xs font-semibold text-red-500">
                  This order was cancelled.
                  {o.paymentStatus === "failed" ? " The payment did not go through." : ""}
                </p>
              )}

              <ul className="space-y-1.5 border-t border-plum/10 py-3 text-sm">
                {o.items.map((i) => (
                  <li key={i.id} className="flex justify-between gap-3">
                    <span className="min-w-0 text-plum/90">
                      {i.name} <span className="text-plumsoft">({i.code}) × {i.qty}</span>
                    </span>
                    <span className="font-bold whitespace-nowrap">{formatINR(i.price * i.qty)}</span>
                  </li>
                ))}
              </ul>

              <dl className="space-y-1 border-t border-plum/10 pt-3 text-sm">
                <div className="flex justify-between text-plumsoft">
                  <dt>Subtotal</dt>
                  <dd>{formatINR(o.subtotal)}</dd>
                </div>
                {o.discount > 0 && (
                  <div className="flex justify-between font-semibold text-sage">
                    <dt>Coupon ({o.couponCode})</dt>
                    <dd>− {formatINR(o.discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between text-plumsoft">
                  <dt>Delivery</dt>
                  <dd>{o.shippingCharge === 0 ? "FREE" : formatINR(o.shippingCharge)}</dd>
                </div>
                <div className="flex justify-between pt-1 text-base font-bold">
                  <dt>Total</dt>
                  <dd className="font-display text-rosedeep">{formatINR(o.orderTotal)}</dd>
                </div>
              </dl>
            </div>
          ))}
          <p className="text-center text-xs font-semibold text-plumsoft">
            Need help with an order?{" "}
            <Link href="/support" className="text-rose underline-offset-2 hover:underline">
              Contact Support
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
