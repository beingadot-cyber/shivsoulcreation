import { createHash, timingSafeEqual } from "crypto";

/**
 * PhonePe Payment Gateway — Standard Checkout (v2, OAuth client credentials).
 *
 * Environment variables (set these in your hosting dashboard):
 *   PHONEPE_CLIENT_ID          Client ID from PhonePe Business dashboard
 *   PHONEPE_CLIENT_SECRET      Client Secret
 *   PHONEPE_CLIENT_VERSION     Client Version (usually "1")
 *   PHONEPE_ENV                "production" or "sandbox" (default: sandbox)
 *   PHONEPE_WEBHOOK_USERNAME   Username you set when creating the webhook
 *   PHONEPE_WEBHOOK_PASSWORD   Password you set when creating the webhook
 *   SITE_URL                   e.g. https://shivsoulcreations.com (used for the return URL)
 */

const HOSTS = {
  production: {
    token: "https://api.phonepe.com/apis/identity-manager/v1/oauth/token",
    pg: "https://api.phonepe.com/apis/pg",
  },
  sandbox: {
    token: "https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token",
    pg: "https://api-preprod.phonepe.com/apis/pg-sandbox",
  },
} as const;

function env() {
  const mode =
    (process.env.PHONEPE_ENV || "sandbox").toLowerCase() === "production"
      ? "production"
      : "sandbox";
  return { mode, hosts: HOSTS[mode] } as const;
}

export function isPhonePeConfigured(): boolean {
  return !!(
    process.env.PHONEPE_CLIENT_ID &&
    process.env.PHONEPE_CLIENT_SECRET &&
    process.env.PHONEPE_CLIENT_VERSION
  );
}

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt - 60 > now) return cachedToken.value;

  const body = new URLSearchParams({
    client_id: process.env.PHONEPE_CLIENT_ID || "",
    client_version: process.env.PHONEPE_CLIENT_VERSION || "",
    client_secret: process.env.PHONEPE_CLIENT_SECRET || "",
    grant_type: "client_credentials",
  });
  const res = await fetch(env().hosts.token, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    console.error("phonepe-token", res.status, data);
    throw new Error("Could not authenticate with PhonePe.");
  }
  const type = data.token_type || "O-Bearer";
  cachedToken = {
    value: `${type} ${data.access_token}`,
    expiresAt: Number(data.expires_at) || now + 600,
  };
  return cachedToken.value;
}

export type PhonePeState = "PENDING" | "COMPLETED" | "FAILED";

/** Create a hosted-checkout payment. Amount is in rupees; sent to PhonePe in paise. */
export async function createPayment(opts: {
  merchantOrderId: string;
  amountRupees: number;
  redirectUrl: string;
  message?: string;
}): Promise<{ redirectUrl: string; phonepeOrderId: string }> {
  const token = await getAccessToken();
  const res = await fetch(`${env().hosts.pg}/checkout/v2/pay`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: token },
    body: JSON.stringify({
      merchantOrderId: opts.merchantOrderId,
      amount: Math.round(opts.amountRupees * 100),
      expireAfter: 1200,
      paymentFlow: {
        type: "PG_CHECKOUT",
        message: opts.message || "Payment for your order",
        merchantUrls: { redirectUrl: opts.redirectUrl },
      },
    }),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.redirectUrl) {
    console.error("phonepe-pay", res.status, data);
    throw new Error("Could not start the PhonePe payment.");
  }
  return { redirectUrl: data.redirectUrl, phonepeOrderId: data.orderId || "" };
}

/** Ask PhonePe for the authoritative state of an order. */
export async function getOrderState(
  merchantOrderId: string
): Promise<{ state: PhonePeState; phonepeOrderId: string }> {
  const token = await getAccessToken();
  const res = await fetch(
    `${env().hosts.pg}/checkout/v2/order/${encodeURIComponent(merchantOrderId)}/status?details=false`,
    { headers: { "Content-Type": "application/json", Authorization: token }, cache: "no-store" }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.state) {
    console.error("phonepe-status", res.status, data);
    throw new Error("Could not fetch PhonePe payment status.");
  }
  const s = String(data.state).toUpperCase();
  const state: PhonePeState = s === "COMPLETED" ? "COMPLETED" : s === "FAILED" ? "FAILED" : "PENDING";
  return { state, phonepeOrderId: data.orderId || "" };
}

/** Webhook auth: PhonePe sends SHA256("username:password") in the Authorization header. */
export function verifyWebhookAuth(header: string | null): boolean {
  const u = process.env.PHONEPE_WEBHOOK_USERNAME;
  const p = process.env.PHONEPE_WEBHOOK_PASSWORD;
  if (!u || !p || !header) return false;
  const expected = createHash("sha256").update(`${u}:${p}`).digest("hex");
  const got = header.replace(/^sha256\s*[(:]?\s*/i, "").replace(/\)$/, "").trim().toLowerCase();
  const a = Buffer.from(expected);
  const b = Buffer.from(got);
  return a.length === b.length && timingSafeEqual(a, b);
}
