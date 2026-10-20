/**
 * Meta (Facebook) Pixel helpers.
 * Dataset / Pixel ID can be overridden with NEXT_PUBLIC_META_PIXEL_ID in the
 * hosting environment variables.
 */
export const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "1824854142038683";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export type PixelContent = { id: string; quantity: number; item_price?: number };

/** Fire a standard Meta event. Safe to call anywhere (no-op on the server / if blocked). */
export function pixelTrack(
  event: "ViewContent" | "AddToCart" | "InitiateCheckout" | "Purchase",
  data?: Record<string, unknown>,
  eventID?: string
) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  try {
    if (eventID) window.fbq("track", event, data || {}, { eventID });
    else window.fbq("track", event, data || {});
  } catch {
    /* never break the shop because of tracking */
  }
}
