/** Builds a wa.me chat link. Accepts a 10-digit Indian number or one with country code. */
export function waLink(number: string | null | undefined, text?: string): string | null {
  const d = String(number || "").replace(/\D/g, "");
  if (!d) return null;
  const n = d.length === 10 ? `91${d}` : d;
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
