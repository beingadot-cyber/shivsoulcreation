import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { ensureDb } from "@/lib/db-setup";
import { getOrderWithItems } from "@/lib/data";
import { getSettings } from "@/lib/settings";
import { buildOrderPdf } from "@/lib/order-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Admin-only: downloads one order as a PDF file. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminApi();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await ensureDb();
    const { id } = await ctx.params;
    const data = await getOrderWithItems(parseInt(id, 10));
    if (!data) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    const s = await getSettings();

    const bytes = await buildOrderPdf(
      data.order,
      data.items.map((i) => ({
        name: i.productNameSnapshot,
        code: i.productCodeSnapshot,
        qty: i.quantity,
        price: i.unitPriceSnapshot,
      })),
      { phone: s.contact_mobile, email: s.contact_email, address: s.business_address }
    );

    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${data.order.orderNumber}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("order-pdf", e);
    return NextResponse.json({ error: "Could not create the PDF." }, { status: 500 });
  }
}
