"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import QRCode from "qrcode";
import {
  BadgeCheck,
  Loader2,
  Lock,
  ShoppingBag,
  Smartphone,
  Truck,
} from "lucide-react";
import { useCart } from "@/store/cart";
import { formatINR } from "@/lib/format";
import ProductImage from "@/components/ProductImage";
import { WhatsAppIcon } from "@/components/icons";

type ProductInfo = {
  code: string;
  name: string;
  price: number;
  imageUrl: string | null;
  stockQuantity: number;
};

type PlacedOrder = {
  orderNumber: string;
  subtotal: number;
  shipping: number;
  total: number;
  customerName: string;
  customerMobile: string;
  address: string;
  items: { name: string; code: string; price: number; qty: number }[];
};

const IN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Delhi","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra",
  "Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu",
  "Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Jammu & Kashmir","Ladakh",
  "Puducherry","Chandigarh","Andaman & Nicobar","Dadra & Nagar Haveli and Daman & Diu","Lakshadweep",
];

export default function CheckoutClient({
  settings,
}: {
  settings: Record<string, string>;
}) {
  const params = useSearchParams();
  const buyCode = params.get("buy")?.toUpperCase() || "";
  const buyQty = Math.max(1, Math.min(99, parseInt(params.get("qty") || "1", 10) || 1));

  const { items: cartItems, clear } = useCart();
  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState<ProductInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({ name: "", mobile: "", address: "", city: "", state: "", pin: "" });
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);
  const [order, setOrder] = useState<PlacedOrder | null>(null);
  const [qr, setQr] = useState("");

  const orderItems = useMemo(
    () => (buyCode ? [{ code: buyCode, qty: buyQty }] : cartItems),
    [buyCode, buyQty, cartItems]
  );

  useEffect(() => setMounted(true), []);

  // Prefill mobile when logged in
  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.customer?.mobileNumber)
          setForm((f) => ({ ...f, mobile: d.customer.mobileNumber }));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const codes = orderItems.map((i) => i.code).join(",");
    if (!codes) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/products?codes=${encodeURIComponent(codes)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setProducts(d.products || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [mounted, orderItems]);

  const info = new Map(products.map((p) => [p.code, p]));
  const lines = orderItems
    .map((i) => ({ ...i, product: info.get(i.code) }))
    .filter((l) => l.product);
  const subtotal = lines.reduce((s, l) => s + l.product!.price * l.qty, 0);
  const shipping = 0; // flat shipping charge removed
  const total = subtotal + shipping;

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPlacing(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines.map((l) => ({ code: l.code, qty: l.qty })),
          customer: form,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Could not place the order. Please try again.");
        setPlacing(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (!buyCode) clear();
      setOrder(data.order);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Network error. Please try again.");
      setPlacing(false);
    }
  }

  // UPI QR + link
  const upiLink = order
    ? `upi://pay?pa=${encodeURIComponent(settings.upi_id)}&pn=${encodeURIComponent(
        settings.upi_name
      )}&am=${order.total}&cu=INR&tn=${encodeURIComponent(order.orderNumber)}`
    : "";
  useEffect(() => {
    if (order && settings.upi_id) {
      QRCode.toDataURL(upiLink, { width: 220, margin: 1, color: { dark: "#42262f" } })
        .then(setQr)
        .catch(() => setQr(""));
    }
  }, [order, upiLink, settings.upi_id]);

  const waMessage = order
    ? [
        `Namaste ${settings.store_name}! I would like to place an order.`,
        ``,
        `Order ID: ${order.orderNumber}`,
        `Name: ${order.customerName}`,
        `Mobile: +91 ${order.customerMobile}`,
        `Delivery Address: ${order.address}`,
        ``,
        `Items:`,
        ...order.items.map(
          (i) => `• ${i.name} (${i.code}) × ${i.qty} — ${formatINR(i.price * i.qty)}`
        ),
        ``,
        `Subtotal: ${formatINR(order.subtotal)}`,
        `Total: ${formatINR(order.total)}`,
      ].join("\n")
    : "";
  const waLink = settings.whatsapp_number
    ? `https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(waMessage)}`
    : "";

  /* ---------------- Confirmation screen ---------------- */
  if (order) {
    return (
      <div className="mx-auto max-w-2xl px-4 pt-10 pb-16">
        <div className="card overflow-hidden">
          <div className="bg-sage/15 px-6 py-8 text-center">
            <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-sage/20 text-sage">
              <BadgeCheck className="h-7 w-7" />
            </span>
            <h1 className="font-display text-2xl font-semibold text-plum">Order placed!</h1>
            <p className="mt-1 text-sm font-semibold text-plumsoft">
              Order ID: <span className="font-mono font-bold text-rosedeep">{order.orderNumber}</span>
            </p>
          </div>

          <div className="space-y-6 p-6">
            <div>
              <h2 className="label">Items</h2>
              <ul className="space-y-1.5 text-sm">
                {order.items.map((i) => (
                  <li key={i.code} className="flex justify-between gap-3">
                    <span className="text-plum/90">
                      {i.name} <span className="text-plumsoft">({i.code}) × {i.qty}</span>
                    </span>
                    <span className="font-bold whitespace-nowrap">{formatINR(i.price * i.qty)}</span>
                  </li>
                ))}
              </ul>
              <dl className="mt-3 space-y-1 border-t border-plum/10 pt-3 text-sm">
                <div className="flex justify-between text-plumsoft">
                  <dt>Subtotal</dt>
                  <dd>{formatINR(order.subtotal)}</dd>
                </div>
                <div className="flex justify-between text-base font-bold">
                  <dt>Total payable</dt>
                  <dd className="font-display text-rosedeep">{formatINR(order.total)}</dd>
                </div>
              </dl>
            </div>

            {settings.upi_id && (
              <div className="rounded-2xl border border-blushdeep bg-blush/50 p-5 text-center">
                <h2 className="mb-1 flex items-center justify-center gap-2 text-sm font-bold text-plum">
                  <Smartphone className="h-4 w-4" /> Pay {formatINR(order.total)} via UPI
                </h2>
                <p className="mb-4 text-xs text-plumsoft">
                  UPI ID: <span className="font-mono font-bold">{settings.upi_id}</span>
                </p>
                {qr && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qr} alt="UPI QR code" className="mx-auto mb-4 h-44 w-44 rounded-xl border border-plum/10 bg-white p-2" />
                )}
                <a href={upiLink} className="btn-rose w-full py-3 sm:w-auto">
                  Open UPI App to Pay {formatINR(order.total)}
                </a>
                <p className="mt-3 text-[11px] leading-relaxed font-semibold text-plumsoft">
                  Payment is confirmed only after we verify it — opening your UPI app does not
                  automatically mark the order as paid.
                </p>
              </div>
            )}

            {waLink && (
              <div className="text-center">
                <a href={waLink} target="_blank" rel="noreferrer" className="btn-dark w-full py-3 sm:w-auto">
                  <WhatsAppIcon className="h-4 w-4" /> Confirm Order on WhatsApp
                </a>
                <p className="mt-2 text-[11px] font-semibold text-plumsoft">
                  Sends your full order details to us on WhatsApp.
                </p>
              </div>
            )}

            <div className="flex flex-col items-center gap-2 border-t border-plum/10 pt-4 text-center">
              <p className="text-xs text-plumsoft">
                We&apos;ll contact you on +91 {order.customerMobile} to confirm your order.
              </p>
              <Link href="/products" className="btn-outline">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- Loading / empty ---------------- */
  if (!mounted || loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 pt-16 text-center text-sm font-semibold text-plumsoft">
        <Loader2 className="mx-auto h-5 w-5 animate-spin" />
      </div>
    );
  }
  if (lines.length === 0) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-20 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-blush text-rose">
          <ShoppingBag className="h-7 w-7" strokeWidth={1.6} />
        </span>
        <h1 className="font-display text-2xl font-semibold text-plum">Nothing to check out</h1>
        <p className="text-sm text-plumsoft">Add some handcrafted pieces to your cart first.</p>
        <Link href="/products" className="btn-rose px-7 py-3">Browse Products</Link>
      </div>
    );
  }

  /* ---------------- Checkout form ---------------- */
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="mx-auto max-w-6xl px-4 pt-8 pb-16">
      <h1 className="section-title mb-6">Checkout</h1>
      {error && (
        <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {error}
        </div>
      )}
      <form onSubmit={placeOrder} className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Customer information */}
        <div className="card h-fit p-5 sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-plum">
            <Truck className="h-5 w-5 text-rose" /> Delivery Details
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label" htmlFor="co-name">Full Name *</label>
              <input id="co-name" className="input" required minLength={3} value={form.name} onChange={set("name")} placeholder="Your full name" autoComplete="name" />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="co-mobile">Mobile Number *</label>
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-sm font-semibold text-plumsoft">+91</span>
                <input
                  id="co-mobile"
                  className="input pl-12 font-mono tracking-wider"
                  required
                  inputMode="numeric"
                  pattern="[6-9][0-9]{9}"
                  maxLength={10}
                  value={form.mobile}
                  onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                  placeholder="10-digit mobile number"
                  autoComplete="tel-national"
                />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="co-address">Complete Delivery Address *</label>
              <textarea
                id="co-address"
                className="input min-h-20 resize-y"
                required
                minLength={8}
                value={form.address}
                onChange={set("address")}
                placeholder="House no., street, area, landmark"
                autoComplete="street-address"
              />
            </div>
            <div>
              <label className="label" htmlFor="co-city">City *</label>
              <input id="co-city" className="input" required value={form.city} onChange={set("city")} placeholder="City" autoComplete="address-level2" />
            </div>
            <div>
              <label className="label" htmlFor="co-state">State *</label>
              <select id="co-state" className="input cursor-pointer" required value={form.state} onChange={set("state")}>
                <option value="">Select state</option>
                {IN_STATES.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="co-pin">PIN Code *</label>
              <input
                id="co-pin"
                className="input font-mono"
                required
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={form.pin}
                onChange={(e) => setForm((f) => ({ ...f, pin: e.target.value.replace(/\D/g, "").slice(0, 6) }))}
                placeholder="6-digit PIN"
                autoComplete="postal-code"
              />
            </div>
          </div>
          <p className="mt-4 flex items-center gap-1.5 text-[11px] font-semibold text-plumsoft">
            <Lock className="h-3.5 w-3.5" /> Your details are used only to deliver this order.
          </p>
        </div>

        {/* Order summary + payment */}
        <aside className="space-y-4 lg:sticky lg:top-28">
          <div className="card p-5">
            <h2 className="font-display text-lg font-semibold text-plum">Order Summary</h2>
            <ul className="mt-4 space-y-3">
              {lines.map((l) => (
                <li key={l.code} className="flex items-center gap-3">
                  <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                    <ProductImage src={l.product!.imageUrl} alt={l.product!.name} code={l.code} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-xs font-bold">{l.product!.name}</p>
                    <p className="text-[10px] font-semibold text-plumsoft">
                      {l.code} × {l.qty}
                    </p>
                  </div>
                  <span className="text-xs font-bold whitespace-nowrap">
                    {formatINR(l.product!.price * l.qty)}
                  </span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1.5 border-t border-plum/10 pt-3 text-sm">
              <div className="flex justify-between text-plumsoft">
                <dt>Subtotal</dt>
                <dd className="font-semibold">{formatINR(subtotal)}</dd>
              </div>
              <div className="flex justify-between border-t border-plum/10 pt-2 text-base font-bold">
                <dt>Total</dt>
                <dd className="font-display text-rosedeep">{formatINR(total)}</dd>
              </div>
            </dl>
          </div>

          <div className="card p-5">
            <h2 className="mb-2 text-sm font-bold text-plum">Payment</h2>
            <p className="text-xs leading-relaxed text-plumsoft">
              After placing your order you&apos;ll get a UPI payment link / QR for exactly{" "}
              <span className="font-bold text-plum">{formatINR(total)}</span>
              {settings.whatsapp_number ? " and a WhatsApp confirmation option." : "."}
            </p>
            <button type="submit" disabled={placing} className="btn-rose mt-4 w-full py-3 text-base">
              {placing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Placing order…
                </>
              ) : (
                <>Place Order · {formatINR(total)}</>
              )}
            </button>
            <p className="mt-2 text-center text-[11px] font-semibold text-plumsoft">
              Guest checkout — no account needed
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}
