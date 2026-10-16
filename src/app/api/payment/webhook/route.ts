import { NextResponse } from "next/server";
import { ensureDb } from "@/lib/db-setup";
import { verifyWebhookAuth } from "@/lib/phonepe";
import { syncOrderPayment } from "@/lib/payments";

/**
 * PhonePe server-to-server callback. Configure this URL in the PhonePe dashboard:
 *   https://YOUR-DOMAIN/api/payment/webhook
 * Events: checkout.order.completed, checkout.order.failed
 * We never trust the payload alone — we re-check the state with PhonePe's status API.
 */
export async function POST(req: Request) {
  if (!verifyWebhookAuth(req.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await ensureDb();
    const body = await req.json();
    const merchantOrderId: string | undefined =
      body?.payload?.merchantOrderId || body?.payload?.originalMerchantOrderId;
    if (merchantOrderId && /^SSC-\d+$/.test(merchantOrderId)) {
      await syncOrderPayment(merchantOrderId);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("phonepe-webhook", e);
    // Non-2xx makes PhonePe retry.
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
