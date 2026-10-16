import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { ensureDb } from "@/lib/db-setup";
import { syncOrderPayment } from "@/lib/payments";
import { isPhonePeConfigured } from "@/lib/phonepe";

export async function GET(req: Request) {
  try {
    await ensureDb();
    const orderNumber = new URL(req.url).searchParams.get("order") || "";
    if (!/^SSC-\d+$/.test(orderNumber)) {
      return NextResponse.json({ error: "Invalid order." }, { status: 400 });
    }
    const first = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
    if (!first[0]) return NextResponse.json({ error: "Order not found." }, { status: 404 });

    if (first[0].paymentStatus === "pending" && isPhonePeConfigured()) {
      try {
        await syncOrderPayment(orderNumber);
      } catch (e) {
        console.error("payment-status-sync", e);
      }
    }
    const [o] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
    return NextResponse.json({
      orderNumber: o.orderNumber,
      total: o.orderTotal,
      paymentStatus: o.paymentStatus,
      customerMobile: o.customerMobile,
    });
  } catch (e) {
    console.error("payment-status", e);
    return NextResponse.json({ error: "Could not check payment." }, { status: 500 });
  }
}
