"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2,
  LogOut,
  Package,
  Phone,
  User,
  CalendarDays,
} from "lucide-react";
import { openAuthModal, SESSION_EVENT } from "@/components/AuthModal";
import { formatINR, formatDate, statusLabel } from "@/lib/format";

type Customer = { id: number; mobileNumber: string; createdAt: string; lastLogin: string | null };
type OrderItem = { id: number; productNameSnapshot: string; productCodeSnapshot: string; unitPriceSnapshot: number; quantity: number };
type Order = {
  id: number;
  orderNumber: string;
  orderTotal: number;
  orderStatus: string;
  paymentStatus: string;
  createdAt: string;
  items: OrderItem[];
};

function StatusPill({ value, kind }: { value: string; kind: "order" | "payment" }) {
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

export default function AccountPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const meRes = await fetch("/api/auth/me", { cache: "no-store" });
      const meData = await meRes.json();
      setCustomer(meData.customer);
      if (meData.customer) {
        const oRes = await fetch("/api/orders", { cache: "no-store" });
        const oData = await oRes.json();
        setOrders(oData.orders || []);
      } else {
        setOrders([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    window.addEventListener(SESSION_EVENT, load);
    return () => window.removeEventListener(SESSION_EVENT, load);
  }, [load]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.dispatchEvent(new Event(SESSION_EVENT));
    router.refresh();
    load();
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 pt-16 text-center">
        <Loader2 className="mx-auto h-5 w-5 animate-spin text-rose" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-20 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-blush text-rose">
          <User className="h-7 w-7" strokeWidth={1.6} />
        </span>
        <h1 className="font-display text-2xl font-semibold text-plum">Log in to view your account</h1>
        <p className="text-sm text-plumsoft">
          See your orders and manage your Shiv Soul Creations account.
        </p>
        <button onClick={() => openAuthModal("login")} className="btn-rose px-7 py-3">
          Login / Continue
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pt-8 pb-16">
      <h1 className="section-title mb-6">My Account</h1>

      <div className="card mb-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blush text-rose">
            <User className="h-6 w-6" />
          </span>
          <div>
            <p className="flex items-center gap-2 text-sm font-bold text-plum">
              <Phone className="h-4 w-4 text-plumsoft" /> +91 {customer.mobileNumber}
            </p>
            <p className="mt-1 flex items-center gap-2 text-xs font-semibold text-plumsoft">
              <CalendarDays className="h-3.5 w-3.5" /> Member since {formatDate(customer.createdAt)}
            </p>
          </div>
        </div>
        <button onClick={logout} className="btn-outline text-rosedeep">
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </div>

      <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold text-plum">
        <Package className="h-5 w-5 text-rose" /> My Orders
      </h2>
      {orders.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 p-10 text-center">
          <p className="text-sm font-semibold text-plumsoft">No orders yet.</p>
          <Link href="/products" className="btn-rose">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-plum/10 pb-3">
                <div>
                  <p className="font-mono text-sm font-bold text-rosedeep">{o.orderNumber}</p>
                  <p className="text-xs font-semibold text-plumsoft">{formatDate(o.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill value={o.orderStatus} kind="order" />
                  <StatusPill value={o.paymentStatus} kind="payment" />
                </div>
              </div>
              <ul className="space-y-1.5 py-3 text-sm">
                {o.items.map((i) => (
                  <li key={i.id} className="flex justify-between gap-3">
                    <span className="text-plum/90">
                      {i.productNameSnapshot}{" "}
                      <span className="text-plumsoft">({i.productCodeSnapshot}) × {i.quantity}</span>
                    </span>
                    <span className="font-bold whitespace-nowrap">
                      {formatINR(i.unitPriceSnapshot * i.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between border-t border-plum/10 pt-3 text-sm font-bold">
                <span>Total</span>
                <span className="font-display text-rosedeep">{formatINR(o.orderTotal)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
