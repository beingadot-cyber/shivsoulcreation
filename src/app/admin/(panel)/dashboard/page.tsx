import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  Package,
  PackageX,
  PackageCheck,
  Users,
  IndianRupee,
} from "lucide-react";
import { getAdminStats, getAdminOrders } from "@/lib/data";
import { formatINR, formatDate, statusLabel } from "@/lib/format";

export const metadata: Metadata = { title: "Admin Dashboard" };

export default async function AdminDashboard() {
  const stats = await getAdminStats();
  const recent = (await getAdminOrders()).slice(0, 6);

  const cards = [
    { label: "Total Products", value: stats.products.total, icon: Package, href: "/admin/products" },
    { label: "Active Products", value: stats.products.active, icon: PackageCheck, href: "/admin/products" },
    { label: "Out of Stock", value: stats.products.outOfStock, icon: PackageX, href: "/admin/products" },
    { label: "Registered Customers", value: stats.customers.total, icon: Users, href: "/admin/customers" },
    { label: "Total Orders", value: stats.orders.total, icon: ClipboardList, href: "/admin/orders" },
    { label: "Pending Orders", value: stats.orders.pending, icon: ClipboardList, href: "/admin/orders?status=pending" },
    { label: "Confirmed Orders", value: stats.orders.confirmed, icon: ClipboardList, href: "/admin/orders?status=confirmed" },
    { label: "Delivered Orders", value: stats.orders.delivered, icon: ClipboardList, href: "/admin/orders?status=delivered" },
    { label: "Recorded Revenue", value: formatINR(stats.orders.revenue), icon: IndianRupee, href: "/admin/orders" },
  ];

  return (
    <div>
      <h1 className="font-display mb-6 text-2xl font-semibold text-plum">Dashboard</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="card group flex items-center gap-3 p-4 transition hover:border-rose/40 hover:shadow-md"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blush text-rose transition group-hover:bg-blushdeep">
              <c.icon className="h-5 w-5" strokeWidth={1.7} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-lg font-bold text-plum">{c.value}</span>
              <span className="block text-[11px] font-bold tracking-wider text-plumsoft uppercase">
                {c.label}
              </span>
            </span>
          </Link>
        ))}
      </div>

      <div className="card mt-8 overflow-hidden">
        <div className="flex items-center justify-between border-b border-plum/10 px-5 py-4">
          <h2 className="font-display text-lg font-semibold text-plum">Recent Orders</h2>
          <Link href="/admin/orders" className="inline-flex items-center gap-1 text-sm font-bold text-rose hover:underline">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm font-semibold text-plumsoft">
            No orders yet — they&apos;ll appear here as customers place them.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead className="bg-blush/40">
                <tr>
                  <th className="admin-th">Order</th>
                  <th className="admin-th">Customer</th>
                  <th className="admin-th">Total</th>
                  <th className="admin-th">Status</th>
                  <th className="admin-th">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-plum/5">
                {recent.map((o) => (
                  <tr key={o.id} className="transition hover:bg-blush/20">
                    <td className="admin-td">
                      <Link href={`/admin/orders/${o.id}`} className="font-mono font-bold text-rosedeep hover:underline">
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="admin-td">
                      <span className="block font-semibold">{o.customerName}</span>
                      <span className="text-xs text-plumsoft">+91 {o.customerMobile}</span>
                    </td>
                    <td className="admin-td font-bold">{formatINR(o.orderTotal)}</td>
                    <td className="admin-td">
                      <span className="chip">{statusLabel(o.orderStatus)}</span>
                    </td>
                    <td className="admin-td text-plumsoft">{formatDate(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
