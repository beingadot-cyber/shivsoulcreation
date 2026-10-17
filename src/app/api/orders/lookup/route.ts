import { NextResponse } from "next/server";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { ensureDb } from "@/lib/db-setup";
import { isValidMobile, rateLimit } from "@/lib/auth";

/**
 * Public order lookup by mobile number (used by the "My Orders" page).
 * Because there is no login, we deliberately return only what is needed to
 * track an order — NEVER the customer's name or full address.
 */
export async function POST(req: Request) {
  try {
    await ensureDb();
    const body = await req.json().catch(() => ({}));
    const mobile = String(body.mobile || "").replace(/\D/g, "").slice(-10);
    if (!isValidMobile(mobile)) {
      return NextResponse.json({ error: "Enter a valid 10-digit mobile number." }, { status: 400 });
    }

    const ip = req.headers.get("x-forwarded-for") || "local";
    if (
      !rateLimit(`lookup-ip:${ip}`, 15, 10 * 60 * 1000) ||
      !rateLimit(`lookup-mobile:${mobile}`, 20, 10 * 60 * 1000)
    ) {
      return NextResponse.json({ error: "Too many attempts. Please try again in a few minutes." }, { status: 429 });
    }

    const rows = await db
      .select()
      .from(orders)
      .where(eq(orders.customerMobile, mobile))
      .orderBy(desc(orders.id))
      .limit(20);
    const ids = rows.map((o) => o.id);
    const items = ids.length
      ? await db.select().from(orderItems).where(inArray(orderItems.orderId, ids))
      : [];

    return NextResponse.json({
      orders: rows.map((o) => ({
        orderNumber: o.orderNumber,
        createdAt: o.createdAt,
        orderStatus: o.orderStatus,
        paymentStatus: o.paymentStatus,
        subtotal: o.subtotal,
        discount: o.discount,
        couponCode: o.couponCode,
        shippingCharge: o.shippingCharge,
        orderTotal: o.orderTotal,
        city: o.city,
        state: o.state,
        items: items
          .filter((i) => i.orderId === o.id)
          .map((i) => ({
            id: i.id,
            name: i.productNameSnapshot,
            code: i.productCodeSnapshot,
            price: i.unitPriceSnapshot,
            qty: i.quantity,
          })),
      })),
    });
  } catch (e) {
    console.error("orders-lookup", e);
    return NextResponse.json({ error: "Could not fetch your orders. Please try again." }, { status: 500 });
  }
}
