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

/**
 * Coupons ordered for the checkout dropdown: the ones this cart already
 * qualifies for come first (biggest discount at the top), then the ones still
 * locked (the nearest one to unlock first).
 */
export function sortedCoupons(subtotal: number): Coupon[] {
  return [...COUPONS].sort((a, b) => {
    const aOk = subtotal >= a.minOrder;
    const bOk = subtotal >= b.minOrder;
    if (aOk !== bOk) return aOk ? -1 : 1;
    return aOk ? b.discount - a.discount : a.minOrder - b.minOrder;
  });
}

/** The best coupon this cart qualifies for right now (biggest discount), if any. */
export function bestCoupon(subtotal: number): Coupon | undefined {
  return sortedCoupons(subtotal).find((c) => subtotal >= c.minOrder);
}
