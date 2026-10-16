import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { getOrderState, type PhonePeState } from "./phonepe";

/**
 * Idempotently apply a PhonePe state to an order.
 * - COMPLETED → payment "paid", order "confirmed"
 * - FAILED    → payment "failed", order "cancelled", stock restored
 * Only orders still in payment "pending" are touched, so repeated webhook /
 * status-poll calls are safe.
 */
export async function applyPaymentState(
  orderNumber: string,
  state: PhonePeState,
  phonepeOrderId?: string
): Promise<void> {
  if (state === "PENDING") return;
  await db.transaction(async (tx) => {
    const rows = await tx.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
    const order = rows[0];
    if (!order) return;

    if (state === "COMPLETED") {
      // A late success can still arrive after our own expiry/failure handling; accept it.
      if (order.paymentStatus === "paid") return;
      const wasCancelled = order.orderStatus === "cancelled";
      await tx
        .update(orders)
        .set({
          paymentStatus: "paid",
          orderStatus: order.orderStatus === "pending" || wasCancelled ? "confirmed" : order.orderStatus,
          paymentRef: phonepeOrderId || order.paymentRef,
        })
        .where(eq(orders.id, order.id));
      if (wasCancelled) {
        const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, order.id));
        for (const it of items) {
          if (!it.productId) continue;
          await tx.execute(
            sql`UPDATE products SET stock_quantity = GREATEST(stock_quantity - ${it.quantity}, 0), updated_at = now() WHERE id = ${it.productId}`
          );
        }
      }
      return;
    }

    // FAILED
    if (order.paymentStatus !== "pending") return;
    await tx
      .update(orders)
      .set({
        paymentStatus: "failed",
        orderStatus: "cancelled",
        paymentRef: phonepeOrderId || order.paymentRef,
      })
      .where(eq(orders.id, order.id));
    const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    for (const it of items) {
      if (!it.productId) continue;
      await tx.execute(
        sql`UPDATE products SET stock_quantity = stock_quantity + ${it.quantity}, updated_at = now() WHERE id = ${it.productId}`
      );
    }
  });
}

/** Query PhonePe for the true state of an order and sync it to the database. */
export async function syncOrderPayment(orderNumber: string): Promise<PhonePeState> {
  const { state, phonepeOrderId } = await getOrderState(orderNumber);
  await applyPaymentState(orderNumber, state, phonepeOrderId);
  return state;
}
