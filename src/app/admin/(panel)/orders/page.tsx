import type { Metadata } from "next";
import { getAdminOrders, ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/data";
import OrdersTable from "@/components/admin/OrdersTable";

export const metadata: Metadata = { title: "Manage Orders" };

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const orders = await getAdminOrders(sp.status);
  return (
    <OrdersTable
      initialStatus={sp.status || "all"}
      initialQuery={sp.q || ""}
      orderStatuses={[...ORDER_STATUSES]}
      paymentStatuses={[...PAYMENT_STATUSES]}
      orders={orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        customerMobile: o.customerMobile,
        orderTotal: o.orderTotal,
        orderStatus: o.orderStatus,
        paymentStatus: o.paymentStatus,
        createdAt: o.createdAt.toISOString(),
      }))}
    />
  );
}
