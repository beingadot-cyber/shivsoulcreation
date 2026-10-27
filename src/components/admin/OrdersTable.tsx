"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, FileDown, Search } from "lucide-react";
import { formatINR, formatDate, statusLabel } from "@/lib/format";
import OrderStatusControls from "./OrderStatusControls";

type Row = {
  id: number;
  orderNumber: string;
  customerName: string;
  customerMobile: string;
  orderTotal: number;
  orderStatus: string;
  paymentStatus: string;
  createdAt: string;
};

export default function OrdersTable({
  orders: initial,
  initialStatus,
  initialQuery,
  orderStatuses,
  paymentStatuses,
}: {
  orders: Row[];
  initialStatus: string;
  initialQuery: string;
  orderStatuses: string[];
  paymentStatuses: string[];
}) {
  const router = useRouter();
  const [orders, setOrders] = useState(initial);
  const [q, setQ] = useState(initialQuery);
  const [status, setStatus] = useState(initialStatus);

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    let list = orders;
    if (status !== "all") list = list.filter((o) => o.orderStatus === status);
    if (n) {
      list = list.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(n) ||
          o.customerName.toLowerCase().includes(n) ||
          o.customerMobile.includes(n)
      );
    }
    return list;
  }, [orders, q, status]);

  return (
    <div>
      <h1 className="font-display mb-6 text-2xl font-semibold text-plum">Orders</h1>

      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-plum/10 p-4 sm:flex-row sm:items-center">
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 text-plumsoft" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search order ID, name or mobile…"
              className="input py-2 pl-10"
            />
          </div>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              router.replace(
                e.target.value === "all" ? "/admin/orders" : `/admin/orders?status=${e.target.value}`
              );
            }}
            className="input w-full cursor-pointer py-2 sm:w-48"
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
            {orderStatuses.map((s) => (
              <option key={s} value={s}>{statusLabel(s)}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px]">
            <thead className="bg-blush/40">
              <tr>
                <th className="admin-th">Order</th>
                <th className="admin-th">Customer</th>
                <th className="admin-th">Total</th>
                <th className="admin-th">Order Status</th>
                <th className="admin-th">Payment</th>
                <th className="admin-th">Date</th>
                <th className="admin-th text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-plum/5">
              {filtered.map((o) => (
                <tr key={o.id} className="align-top transition hover:bg-blush/20">
                  <td className="admin-td">
                    <Link href={`/admin/orders/${o.id}`} className="font-mono font-bold text-rosedeep hover:underline">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="admin-td">
                    <span className="block font-semibold">{o.customerName}</span>
                    <span className="text-xs text-plumsoft">+91 {o.customerMobile}</span>
                  </td>
                  <td className="admin-td font-bold whitespace-nowrap">{formatINR(o.orderTotal)}</td>
                  <td className="admin-td" colSpan={2}>
                    <OrderStatusControls
                      orderId={o.id}
                      orderStatus={o.orderStatus}
                      paymentStatus={o.paymentStatus}
                      orderStatuses={orderStatuses}
                      paymentStatuses={paymentStatuses}
                      onUpdated={(os, ps) =>
                        setOrders((list) =>
                          list.map((x) =>
                            x.id === o.id ? { ...x, orderStatus: os, paymentStatus: ps } : x
                          )
                        )
                      }
                    />
                  </td>
                  <td className="admin-td text-plumsoft whitespace-nowrap">{formatDate(o.createdAt)}</td>
                  <td className="admin-td text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <a
                        href={`/api/admin/orders/${o.id}/pdf`}
                        download={`${o.orderNumber}.pdf`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blush text-rosedeep transition hover:bg-blushdeep"
                        aria-label={`Download PDF for ${o.orderNumber}`}
                        title="Download PDF"
                      >
                        <FileDown className="h-3.5 w-3.5" />
                      </a>
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blush text-rosedeep transition hover:bg-blushdeep"
                        aria-label={`View ${o.orderNumber}`}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="admin-td py-10 text-center text-plumsoft">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
