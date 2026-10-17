/** Delivery charge rule: ₹49 on orders below ₹399, free from ₹399 and above. */
export const FREE_DELIVERY_MIN = 399;
export const DELIVERY_CHARGE = 49;

/** `subtotal` is the cart total BEFORE any coupon discount. */
export function shippingFor(subtotal: number): number {
  return subtotal >= FREE_DELIVERY_MIN ? 0 : DELIVERY_CHARGE;
}
