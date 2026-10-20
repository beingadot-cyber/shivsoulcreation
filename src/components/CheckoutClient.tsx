"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Loader2,
  Lock,
  ShoppingBag,
  CreditCard,
  Truck,
  Tag,
  X,
} from "lucide-react";
import { useCart } from "@/store/cart";
import { formatINR } from "@/lib/format";
import ProductImage from "@/components/ProductImage";
import { sortedCoupons, bestCoupon, couponDiscount } from "@/lib/coupons";
import { shippingFor, FREE_DELIVERY_MIN } from "@/lib/shipping";
import { pixelTrack } from "@/lib/pixel";

type ProductInfo = {
  code: string;
  name: string;
  price: number;
  imageUrl: string | null;
  stockQuantity: number;
};

const IN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Delhi","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra",
  "Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu",
  "Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Jammu & Kashmir","Ladakh",
  "Puducherry","Chandigarh","Andaman & Nicobar","Dadra & Nagar Haveli and Daman & Diu","Lakshadweep",
];

export default function CheckoutClient() {
  const params = useSearchParams();
  const buyCode = params.get("buy")?.toUpperCase() || "";
  const buyQty = Math.max(1, Math.min(99, parseInt(params.get("qty") || "1", 10) || 1));

  const { items: cartItems } = useCart();
  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState<ProductInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({ name: "", mobile: "", address: "", city: "", state: "", pin: "" });
  const [error, setError] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [placing, setPlacing] = useState(false);

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
  const discount = couponDiscount(couponCode, subtotal);
  const best = bestCoupon(subtotal);
  const shipping = shippingFor(subtotal);
  const total = subtotal - discount + shipping;

  // Meta Pixel: checkout opened (once per visit to this page)
  const checkoutTracked = useRef(false);
  useEffect(() => {
    if (checkoutTracked.current || loading || lines.length === 0) return;
    checkoutTracked.current = true;
    pixelTrack("InitiateCheckout", {
      content_ids: lines.map((l) => l.code),
      content_type: "product",
      contents: lines.map((l) => ({ id: l.code, quantity: l.qty, item_price: l.product!.price })),
      num_items: lines.reduce((n, l) => n + l.qty, 0),
      value: subtotal,
      currency: "INR",
    });
  }, [loading, lines, subtotal]);

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
          couponCode: discount > 0 ? couponCode : "",
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Could not place the order. Please try again.");
        setPlacing(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      // Hand over to PhonePe's secure payment page. The cart is cleared only
      // after a successful payment (on the payment status page).
      window.location.assign(data.redirectUrl);
    } catch {
      setError("Network error. Please try again.");
      setPlacing(false);
    }
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
              {discount > 0 && (
                <div className="flex justify-between font-semibold text-sage">
                  <dt>Coupon ({couponCode})</dt>
                  <dd>− {formatINR(discount)}</dd>
                </div>
              )}
              <div className="flex justify-between text-plumsoft">
                <dt>Delivery</dt>
                <dd className={`font-semibold ${shipping === 0 ? "text-sage" : ""}`}>
                  {shipping === 0 ? "FREE" : formatINR(shipping)}
                </dd>
              </div>
              {shipping > 0 && (
                <div className="rounded-lg bg-blush px-3 py-2 text-[11px] font-semibold text-rosedeep">
                  Add {formatINR(FREE_DELIVERY_MIN - subtotal)} more for FREE delivery
                </div>
              )}
              <div className="flex justify-between border-t border-plum/10 pt-2 text-base font-bold">
                <dt>Total</dt>
                <dd className="font-display text-rosedeep">{formatINR(total)}</dd>
              </div>
            </dl>
          </div>

          <div className="card p-5">
            <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-plum">
              <Tag className="h-4 w-4 text-rose" /> Coupon Code
            </h2>
            <select
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              className="input"
              aria-label="Select a coupon"
            >
              <option value="">Select a coupon</option>
              {sortedCoupons(subtotal).map((c) => {
                const ok = subtotal >= c.minOrder;
                const isBest = best?.code === c.code;
                const label = `${isBest ? "✨ " : ""}${c.code} — ₹${c.discount} OFF on ₹${c.minOrder}+${
                  isBest ? " (Best offer)" : ""
                }${ok ? "" : ` (add ₹${c.minOrder - subtotal} more)`}`;
                return (
                  <option
                    key={c.code}
                    value={c.code}
                    disabled={!ok}
                    style={isBest ? { backgroundColor: "#f9e8ee", color: "#9e3b60", fontWeight: 700 } : undefined}
                  >
                    {label}
                  </option>
                );
              })}
            </select>
            {best && couponCode !== best.code && (
              <button
                type="button"
                onClick={() => setCouponCode(best.code)}
                className="mt-2 flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-rose/30 bg-blush px-3 py-2 text-left text-xs font-bold text-rosedeep transition hover:bg-blushdeep"
              >
                <span>
                  ✨ Best offer for you: {best.code} — save {formatINR(best.discount)}
                </span>
                <span className="shrink-0 rounded-full bg-rose px-3 py-1 text-[11px] text-white">Apply</span>
              </button>
            )}
            {couponCode && discount > 0 && (
              <p className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-sage/15 px-3 py-2 text-xs font-bold text-sage">
                <span>
                  {couponCode} applied — you save {formatINR(discount)}!
                </span>
                <button
                  type="button"
                  onClick={() => setCouponCode("")}
                  aria-label="Remove coupon"
                  className="cursor-pointer rounded-full p-0.5 hover:bg-sage/20"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </p>
            )}
          </div>

          <div className="card p-5">
            <h2 className="mb-2 text-sm font-bold text-plum">Payment</h2>
            <p className="text-xs leading-relaxed text-plumsoft">
              You&apos;ll be taken to PhonePe&apos;s secure page to pay{" "}
              <span className="font-bold text-plum">{formatINR(total)}</span> using UPI,
              cards or net banking.
            </p>
            <button type="submit" disabled={placing} className="btn-rose mt-4 w-full py-3 text-base">
              {placing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Redirecting to PhonePe…
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" /> Pay with PhonePe · {formatINR(total)}
                </>
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
