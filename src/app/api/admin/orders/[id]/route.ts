import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { ensureDb } from "@/lib/db-setup";
import { requireAdminApi } from "@/lib/auth";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/data";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdminApi();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await ensureDb();
    const { id } = await ctx.params;
    const orderId = parseInt(id, 10);
    const b = await req.json();
    const rows = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    const order = rows[0];
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

    const updates: Partial<typeof orders.$inferInsert> = {};
    if (b.orderStatus !== undefined) {
      if (!(ORDER_STATUSES as readonly string[]).includes(b.orderStatus))
        return NextResponse.json({ error: "Invalid order status." }, { status: 400 });
      updates.orderStatus = b.orderStatus;
    }
    if (b.paymentStatus !== undefined) {
      if (!(PAYMENT_STATUSES as readonly string[]).includes(b.paymentStatus))
        return NextResponse.json({ error: "Invalid payment status." }, { status: 400 });
      updates.paymentStatus = b.paymentStatus;
    }
    if (Object.keys(updates).length === 0)
      return NextResponse.json({ error: "Nothing to update." }, { status: 400 });

    await db.transaction(async (tx) => {
      // Restore stock when an order becomes cancelled; re-deduct if un-cancelled.
      const becomingCancelled = updates.orderStatus === "cancelled" && order.orderStatus !== "cancelled";
      const leavingCancelled = order.orderStatus === "cancelled" && updates.orderStatus !== undefined && updates.orderStatus !== "cancelled";
      if (becomingCancelled || leavingCancelled) {
        const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
        for (const item of items) {
          if (!item.productId) continue;
          const delta = becomingCancelled ? item.quantity : -item.quantity;
          await tx.execute(
            sql`UPDATE products SET stock_quantity = GREATEST(stock_quantity + ${delta}, 0), updated_at = now() WHERE id = ${item.productId}`
          );
        }
      }
      // Convenience: marking delivered also implies payment handled only when explicitly set.
      await tx.update(orders).set(updates).where(eq(orders.id, orderId));
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("admin-update-order", e);
    return NextResponse.json({ error: "Could not update the order." }, { status: 500 });
  }
}
