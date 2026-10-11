import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { ensureDb } from "@/lib/db-setup";
import { requireAdminApi } from "@/lib/auth";
import { issueOtp } from "@/lib/otp";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdminApi();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureDb();
  const { id } = await ctx.params;
  const customerId = parseInt(id, 10);
  const b = await req.json();
  const rows = await db
    .select()
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1);
  const customer = rows[0];
  if (!customer) return NextResponse.json({ error: "Customer not found." }, { status: 404 });

  if (b.action === "enable") {
    await db.update(customers).set({ accountStatus: "active" }).where(eq(customers.id, customerId));
    return NextResponse.json({ ok: true });
  }
  if (b.action === "disable") {
    await db.update(customers).set({ accountStatus: "disabled" }).where(eq(customers.id, customerId));
    return NextResponse.json({ ok: true });
  }
  if (b.action === "reset") {
    // Generates a reset OTP for the customer (admin shares it with them; the
    // customer then uses Forgot Password). The existing password is never
    // exposed or sent anywhere.
    const issued = await issueOtp(customer.mobileNumber, "reset");
    if (!issued.ok) return NextResponse.json({ error: issued.error }, { status: 429 });
    return NextResponse.json({ ok: true, devOtp: issued.devOtp, mobile: customer.mobileNumber });
  }
  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
