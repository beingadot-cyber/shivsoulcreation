import { NextResponse } from "next/server";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { products, orders, orderItems } from "@/db/schema";
import { ensureDb } from "@/lib/db-setup";
import { getSession, isValidMobile, rateLimit } from "@/lib/auth";
import { createPayment, isPhonePeConfigured } from "@/lib/phonepe";
import { applyPaymentState } from "@/lib/payments";
import { couponDiscount, findCoupon } from "@/lib/coupons";
import { shippingFor } from "@/lib/shipping";

const NAME_RE = /^[a-zA-Z][a-zA-Z .'-]{1,59}$/;

export async function POST(req: Request) {
  try {
    await ensureDb();
    if (!isPhonePeConfigured()) {
      console.error("create-order: PhonePe env variables are missing");
      return NextResponse.json(
        { error: "Online payment is temporarily unavailable. Please contact us on WhatsApp." },
        { status: 503 }
      );
    }
    const body = await req.json();
    const items: { code: string; qty: number }[] = Array.isArray(body.items)
      ? body.items
      : [];
    const c = body.customer || {};

    if (items.length === 0) {
      return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
    }
    if (!NAME_RE.test((c.name || "").trim())) {
      return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
    }
    if (!isValidMobile(c.mobile || "")) {
      return NextResponse.json({ error: "Enter a valid 10-digit mobile number." }, { status: 400 });
    }
    if (!c.address || String(c.address).trim().length < 8) {
      return NextResponse.json({ error: "Please enter your complete delivery address." }, { status: 400 });
    }
    if (!c.city || !c.state) {
      return NextResponse.json({ error: "Please enter your city and state." }, { status: 400 });
    }
    if (!/^\d{6}$/.test(c.pin || "")) {
      return NextResponse.json({ error: "Enter a valid 6-digit PIN code." }, { status: 400 });
    }

    const ip = req.headers.get("x-forwarded-for") || "local";
    if (!rateLimit(`order:${ip}`, 12, 10 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many orders. Please try again later." }, { status: 429 });
    }

    const codes = items.map((i) => String(i.code).toUpperCase());
    const rows = await db
      .select()
      .from(products)
      .where(
        inArray(products.productCode, codes.length ? codes : ["__none__"])
      );
    const map = new Map(rows.map((p) => [p.productCode, p]));

    let subtotal = 0;
    const lineItems: {
      productId: number;
      name: string;
      code: string;
      price: number;
      qty: number;
    }[] = [];
    for (const item of items) {
      const p = map.get(String(item.code).toUpperCase());
      const qty = Math.max(1, Math.min(99, Math.floor(Number(item.qty) || 1)));
      if (!p || p.isArchived || !p.isActive) {
        return NextResponse.json(
          { error: "One of the products is no longer available. Please review your cart." },
          { status: 400 }
        );
      }
      subtotal += p.price * qty;
      lineItems.push({
        productId: p.id,
        name: p.name,
        code: p.productCode,
        price: p.price,
        qty,
      });
    }

    // Optional coupon — always re-validated here on the server.
    let couponCode: string | null = null;
    let discount = 0;
    if (body.couponCode) {
      const coupon = findCoupon(body.couponCode);
      if (!coupon) {
        return NextResponse.json({ error: "This coupon code is not valid." }, { status: 400 });
      }
      discount = couponDiscount(coupon.code, subtotal);
      if (discount <= 0) {
        return NextResponse.json(
          { error: `${coupon.code} needs a minimum order of ₹${coupon.minOrder}.` },
          { status: 400 }
        );
      }
      couponCode = coupon.code;
    }

    const shipping = shippingFor(subtotal); // ₹49 below ₹399, free from ₹399
    const total = subtotal - discount + shipping;

    const session = await getSession();
    const customerId = session?.userType === "customer" ? session.userId : null;

    const order = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(orders)
        .values({
          orderNumber: `TMP-${Date.now()}`,
          customerId,
          customerName: String(c.name).trim(),
          customerMobile: c.mobile,
          addressLine: String(c.address).trim(),
          city: String(c.city).trim(),
          state: String(c.state).trim(),
          pincode: c.pin,
          subtotal,
          shippingCharge: shipping,
          discount,
          couponCode,
          orderTotal: total,
          paymentStatus: "pending",
          orderStatus: "pending",
        })
        .returning({ id: orders.id });
      const orderNumber = `SSC-${String(created.id).padStart(5, "0")}`;
      await tx
        .update(orders)
        .set({ orderNumber })
        .where(eq(orders.id, created.id));
      for (const li of lineItems) {
        await tx.insert(orderItems).values({
          orderId: created.id,
          productId: li.productId,
          productNameSnapshot: li.name,
          productCodeSnapshot: li.code,
          unitPriceSnapshot: li.price,
          quantity: li.qty,
        });
        await tx.execute(
          sql`UPDATE products SET stock_quantity = GREATEST(stock_quantity - ${li.qty}, 0), updated_at = now() WHERE id = ${li.productId}`
        );
      }
      return { id: created.id, orderNumber };
    });

    // Start the PhonePe payment for this order.
    const h = req.headers;
    const host = h.get("x-forwarded-host") || h.get("host");
    const proto = h.get("x-forwarded-proto") || (host?.startsWith("localhost") ? "http" : "https");
    const origin = (process.env.SITE_URL || `${proto}://${host}`).replace(/\/$/, "");
    try {
      const pay = await createPayment({
        merchantOrderId: order.orderNumber,
        amountRupees: total,
        redirectUrl: `${origin}/payment/status?order=${order.orderNumber}`,
        message: `Order ${order.orderNumber}`,
      });
      await db
        .update(orders)
        .set({ paymentRef: pay.phonepeOrderId || null })
        .where(eq(orders.id, order.id));
      return NextResponse.json({
        ok: true,
        orderNumber: order.orderNumber,
        redirectUrl: pay.redirectUrl,
      });
    } catch (err) {
      console.error("create-order/phonepe", err);
      // Could not even start the payment: cancel the order and put the stock back.
      await applyPaymentState(order.orderNumber, "FAILED");
      return NextResponse.json(
        { error: "Could not start the payment. Please try again in a moment." },
        { status: 502 }
      );
    }
  } catch (e) {
    console.error("create-order", e);
    return NextResponse.json({ error: "Could not place the order. Please try again." }, { status: 500 });
  }
}

export async function GET() {
  const session = await getSession();
  if (!session || session.userType !== "customer") {
    return NextResponse.json({ orders: [] }, { status: 401 });
  }
  await ensureDb();
  const myOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.customerId, session.userId))
    .orderBy(desc(orders.id));
  const ids = myOrders.map((o) => o.id);
  const items = ids.length
    ? await db.select().from(orderItems).where(inArray(orderItems.orderId, ids))
    : [];
  return NextResponse.json({
    orders: myOrders.map((o) => ({
      ...o,
      items: items.filter((i) => i.orderId === o.id),
    })),
  });
}
