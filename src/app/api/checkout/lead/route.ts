import { NextResponse } from "next/server";
import { inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { products, abandonedCheckouts } from "@/db/schema";
import { ensureDb } from "@/lib/db-setup";
import { isValidMobile, rateLimit } from "@/lib/auth";

/**
 * Saves a checkout "lead" as soon as a visitor types their mobile number on the
 * checkout page, so the owner can follow up if they never pay.
 * Prices and names always come from the database, never from the browser.
 */
export async function POST(req: Request) {
  try {
    await ensureDb();
    const body = await req.json().catch(() => ({}));
    const mobile = String(body.mobile || "").replace(/\D/g, "");
    if (!isValidMobile(mobile)) return NextResponse.json({ ok: false }, { status: 400 });

    const ip = req.headers.get("x-forwarded-for") || "local";
    if (!rateLimit(`lead-ip:${ip}`, 40, 10 * 60 * 1000) || !rateLimit(`lead-mobile:${mobile}`, 20, 10 * 60 * 1000)) {
      return NextResponse.json({ ok: false }, { status: 429 });
    }

    const raw: { code?: string; qty?: number }[] = Array.isArray(body.items) ? body.items.slice(0, 20) : [];
    const qtyBy = new Map<string, number>();
    for (const it of raw) {
      const code = String(it.code || "").toUpperCase();
      const qty = Math.max(1, Math.min(99, Math.floor(Number(it.qty) || 1)));
      if (code) qtyBy.set(code, qty);
    }
    if (qtyBy.size === 0) return NextResponse.json({ ok: false }, { status: 400 });

    const rows = await db.select().from(products).where(inArray(products.productCode, [...qtyBy.keys()]));
    let total = 0;
    const parts: string[] = [];
    for (const p of rows) {
      const q = qtyBy.get(p.productCode) || 1;
      total += p.price * q;
      parts.push(`${p.name} ×${q}`);
    }
    if (parts.length === 0) return NextResponse.json({ ok: false }, { status: 400 });

    const name = String(body.name || "").trim().slice(0, 120);
    const itemsText = parts.join(", ").slice(0, 800);

    await db
      .insert(abandonedCheckouts)
      .values({ mobile, name, itemsText, cartTotal: total })
      .onConflictDoUpdate({
        target: abandonedCheckouts.mobile,
        set: {
          name,
          itemsText,
          cartTotal: total,
          status: "open",
          contacted: sql`CASE WHEN abandoned_checkouts.status = 'ordered' THEN false ELSE abandoned_checkouts.contacted END`,
          updatedAt: new Date(),
        },
      });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("checkout-lead", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
