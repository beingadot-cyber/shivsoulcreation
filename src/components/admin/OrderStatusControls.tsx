"use client";

import { useState } from "react";
import { statusLabel } from "@/lib/format";

export default function OrderStatusControls({
  orderId,
  orderStatus,
  paymentStatus,
  orderStatuses,
  paymentStatuses,
  onUpdated,
}: {
  orderId: number;
  orderStatus: string;
  paymentStatus: string;
  orderStatuses: string[];
  paymentStatuses: string[];
  onUpdated?: (orderStatus: string, paymentStatus: string) => void;
}) {
  const [os, setOs] = useState(orderStatus);
  const [ps, setPs] = useState(paymentStatus);
  const [saving, setSaving] = useState(false);

  async function update(field: "orderStatus" | "paymentStatus", value: string) {
    const nextOs = field === "orderStatus" ? value : os;
    const nextPs = field === "paymentStatus" ? value : ps;
    if (field === "orderStatus") setOs(value);
    else setPs(value);
    setSaving(true);
    await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    setSaving(false);
    onUpdated?.(nextOs, nextPs);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={os}
        onChange={(e) => update("orderStatus", e.target.value)}
        disabled={saving}
        aria-label="Order status"
        className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-bold transition ${
          saving ? "opacity-50" : ""
        } ${
          os === "cancelled"
            ? "border-red-200 bg-red-50 text-red-600"
            : os === "delivered"
              ? "border-sage/30 bg-sage/10 text-sage"
              : "border-plum/15 bg-white text-plum"
        }`}
      >
        {orderStatuses.map((s) => (
          <option key={s} value={s}>{statusLabel(s)}</option>
        ))}
      </select>
      <select
        value={ps}
        onChange={(e) => update("paymentStatus", e.target.value)}
        disabled={saving}
        aria-label="Payment status"
        className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-bold transition ${
          saving ? "opacity-50" : ""
        } ${
          ps === "paid"
            ? "border-sage/30 bg-sage/10 text-sage"
            : ps === "failed" || ps === "refunded"
              ? "border-red-200 bg-red-50 text-red-600"
              : "border-gold/30 bg-amber-50 text-amber-700"
        }`}
      >
        {paymentStatuses.map((s) => (
          <option key={s} value={s}>{statusLabel(s)}</option>
        ))}
      </select>
    </div>
  );
}
