import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileDown, MapPin, Phone, User } from "lucide-react";
import { getOrderWithItems, ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/data";
import { formatINR, formatDateTime } from "@/lib/format";
import OrderStatusControls from "@/components/admin/OrderStatusControls";
import ProductImage from "@/components/ProductImage";
import { db } from "@/db";
import { products } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { ensureDb } from "@/lib/db-setup";

export const metadata: Metadata = { title: "Order Details" };

export default async function AdminOrderDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getOrderWithItems(parseInt(id, 10));
  if (!data) notFound();
  const { order, items } = data;

  await ensureDb();
  const productIds = items.map((i) => i.productId).filter(Boolean) as number[];
  const productRows = productIds.length
    ? await db.select().from(products).where(inArray(products.id, productIds))
    : [];
  const imageMap = new Map(productRows.map((p) => [p.id, p.imageUrl]));

  return (
    <div>
      <Link href="/admin/orders" className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-rose hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to Orders
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-plum">
          Order <span className="font-mono text-rosedeep">{order.orderNumber}</span>
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`/api/admin/orders/${order.id}/pdf`}
            download={`${order.orderNumber}.pdf`}
            className="inline-flex items-center gap-1.5 rounded-full bg-blush px-4 py-2 text-xs font-bold text-rosedeep transition hover:bg-blushdeep"
          >
            <FileDown className="h-4 w-4" /> Download PDF
          </a>
          <OrderStatusControls
            orderId={order.id}
            orderStatus={order.orderStatus}
            paymentStatus={order.paymentStatus}
            orderStatuses={[...ORDER_STATUSES]}
            paymentStatuses={[...PAYMENT_STATUSES]}
          />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="card h-fit overflow-hidden">
          <h2 className="border-b border-plum/10 px-5 py-4 font-display text-lg font-semibold text-plum">
            Items ({items.length})
          </h2>
          <ul className="divide-y divide-plum/5">
            {items.map((i) => (
              <li key={i.id} className="flex items-center gap-4 px-5 py-4">
                <span className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-plum/10">
                  <ProductImage
                    src={i.productId ? imageMap.get(i.productId) : null}
                    alt={i.productNameSnapshot}
                    code={i.productCodeSnapshot}
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{i.productNameSnapshot}</p>
                  <p className="text-xs font-semibold text-plumsoft">
                    {i.productCodeSnapshot} · {formatINR(i.unitPriceSnapshot)} × {i.quantity}
                  </p>
                </div>
                <span className="font-bold whitespace-nowrap">
                  {formatINR(i.unitPriceSnapshot * i.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <dl className="space-y-1.5 border-t border-plum/10 px-5 py-4 text-sm">
            <div className="flex justify-between text-plumsoft">
              <dt>Subtotal</dt>
              <dd>{formatINR(order.subtotal)}</dd>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between font-semibold text-sage">
                <dt>Coupon ({order.couponCode})</dt>
                <dd>− {formatINR(order.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between text-plumsoft">
              <dt>Shipping</dt>
              <dd>{formatINR(order.shippingCharge)}</dd>
            </div>
            <div className="flex justify-between text-base font-bold">
              <dt>Total</dt>
              <dd className="font-display text-rosedeep">{formatINR(order.orderTotal)}</dd>
            </div>
          </dl>
          <p className="border-t border-plum/10 px-5 py-3 text-[11px] font-semibold text-plumsoft">
            Prices shown are the original purchase prices captured at order time.
          </p>
        </div>

        <div className="space-y-5">
          <div className="card p-5">
            <h2 className="mb-4 font-display text-lg font-semibold text-plum">Customer</h2>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2.5">
                <User className="h-4 w-4 shrink-0 text-plumsoft" />
                <span className="font-bold">{order.customerName}</span>
                {order.customerId && (
                  <Link href={`/admin/customers`} className="text-xs font-bold text-rose hover:underline">
                    (Customer #{order.customerId})
                  </Link>
                )}
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-plumsoft" />
                <span className="font-mono font-bold">+91 {order.customerMobile}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-plumsoft" />
                <span className="leading-relaxed">
                  {order.addressLine}
                  <br />
                  {order.city}, {order.state} — {order.pincode}
                </span>
              </li>
            </ul>
          </div>
          <div className="card p-5">
            <h2 className="mb-2 font-display text-lg font-semibold text-plum">Timeline</h2>
            <p className="text-sm font-semibold text-plumsoft">
              Placed on {formatDateTime(order.createdAt)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
