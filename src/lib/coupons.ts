/**
 * Discount coupons. To add / edit / remove a coupon, just change this list
 * and redeploy. Used by BOTH the checkout page (to show the discount) and the
 * orders API (which re-checks everything, so the discount can't be faked).
 */
export type Coupon = {
  code: string;
  minOrder: number; // minimum cart subtotal in ₹
  discount: number; // flat discount in ₹
};

export const COUPONS: Coupon[] = [
  { code: "DECOR40", minOrder: 500, discount: 40 },
  { code: "MAA100", minOrder: 800, discount: 100 },
  { code: "DECOR90", minOrder: 1000, discount: 90 },
  { code: "DECOR200", minOrder: 2000, discount: 200 },
  { code: "DECOR350", minOrder: 3000, discount: 350 },
];

export function findCoupon(code: string | null | undefined): Coupon | undefined {
  const c = String(code || "").trim().toUpperCase();
  return COUPONS.find((x) => x.code === c);
}

/** Returns the discount in ₹ (0 if the coupon is missing or the order is too small). */
export function couponDiscount(code: string | null | undefined, subtotal: number): number {
  const c = findCoupon(code);
  if (!c || subtotal < c.minOrder) return 0;
  return Math.min(c.discount, subtotal);
}
