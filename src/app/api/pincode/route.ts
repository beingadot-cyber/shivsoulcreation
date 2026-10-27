import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/auth";

/** Looks up city + state for a 6-digit PIN code so checkout can pre-fill them. */
export async function GET(req: Request) {
  const pin = new URL(req.url).searchParams.get("pin") || "";
  if (!/^[1-9]\d{5}$/.test(pin)) return NextResponse.json({});
  const ip = req.headers.get("x-forwarded-for") || "local";
  if (!rateLimit(`pin:${ip}`, 60, 10 * 60 * 1000)) return NextResponse.json({}, { status: 429 });

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`, {
      signal: ctrl.signal,
      next: { revalidate: 86400 },
    });
    clearTimeout(timer);
    const data = await res.json();
    const first = data?.[0];
    const office = first?.Status === "Success" ? first.PostOffice?.[0] : null;
    if (!office) return NextResponse.json({});
    return NextResponse.json(
      { city: String(office.District || office.Block || "").trim(), state: String(office.State || "").trim() },
      { headers: { "Cache-Control": "public, max-age=86400" } }
    );
  } catch {
    return NextResponse.json({});
  }
}
