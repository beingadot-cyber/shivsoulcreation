import type { Metadata } from "next";
import { and, desc, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { abandonedCheckouts } from "@/db/schema";
import { ensureDb } from "@/lib/db-setup";
import AbandonedTable from "@/components/admin/AbandonedTable";

export const metadata: Metadata = { title: "Abandoned Checkouts" };
export const dynamic = "force-dynamic";

export default async function AbandonedPage() {
  await ensureDb();
  const rows = await db
    .select()
    .from(abandonedCheckouts)
    .where(and(eq(abandonedCheckouts.status, "open"), gt(abandonedCheckouts.cartTotal, 0)))
    .orderBy(desc(abandonedCheckouts.updatedAt))
    .limit(200);
  return (
    <AbandonedTable
      rows={rows.map((r) => ({
        id: r.id,
        mobile: r.mobile,
        name: r.name,
        itemsText: r.itemsText,
        cartTotal: r.cartTotal,
        contacted: r.contacted,
        updatedAt: r.updatedAt.toISOString(),
      }))}
    />
  );
}
