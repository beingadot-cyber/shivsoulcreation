import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { admins } from "@/db/schema";
import { requireAdminApi, isStrongPassword } from "@/lib/auth";
import { putSettings } from "@/lib/settings";
import { hashPassword, verifyPassword } from "@/lib/crypto";
import { ensureDb } from "@/lib/db-setup";

const ALLOWED_KEYS = new Set([
  "store_name",
  "tagline",
  "about",
  "whatsapp_number",
  "contact_mobile",
  "contact_email",
  "instagram_url",
  "facebook_url",
  "youtube_url",
  "business_address",
  "announcement",
  "shipping_policy",
  "return_policy",
  "privacy_policy",
  "terms",
]);

export async function PUT(req: Request) {
  const admin = await requireAdminApi();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await ensureDb();
    const b = await req.json();

    if (b.action === "change-password") {
      const rows = await db.select().from(admins).where(eq(admins.id, admin.userId)).limit(1);
      if (!rows[0]) return NextResponse.json({ error: "Admin not found." }, { status: 404 });
      if (!verifyPassword(String(b.currentPassword || ""), rows[0].passwordHash))
        return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
      if (!isStrongPassword(String(b.newPassword || "")))
        return NextResponse.json(
          { error: "New password must be at least 8 characters with letters and numbers." },
          { status: 400 }
        );
      await db
        .update(admins)
        .set({ passwordHash: hashPassword(String(b.newPassword)) })
        .where(eq(admins.id, admin.userId));
      return NextResponse.json({ ok: true });
    }

    const entries: Record<string, string> = {};
    for (const [k, v] of Object.entries(b.entries || {})) {
      if (ALLOWED_KEYS.has(k)) entries[k] = String(v ?? "");
    }
    if (entries.whatsapp_number !== undefined)
      entries.whatsapp_number = entries.whatsapp_number.replace(/[^\d]/g, "");
    if (entries.contact_mobile !== undefined)
      entries.contact_mobile = entries.contact_mobile.replace(/[^\d]/g, "");
    await putSettings(entries);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("admin-settings", e);
    return NextResponse.json({ error: "Could not save settings." }, { status: 500 });
  }
}
