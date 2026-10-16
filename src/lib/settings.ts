import { db } from "@/db";
import { settings } from "@/db/schema";
import { ensureDb } from "./db-setup";

export type Settings = Record<string, string>;

export async function getSettings(): Promise<Settings> {
  await ensureDb();
  const rows = await db.select().from(settings);
  const map: Settings = {};
  for (const r of rows) map[r.key] = r.value;
  return map;
}

export async function putSettings(entries: Record<string, string>) {
  await ensureDb();
  for (const [key, value] of Object.entries(entries)) {
    await db
      .insert(settings)
      .values({ key, value: String(value ?? "") })
      .onConflictDoUpdate({ target: settings.key, set: { value: String(value ?? "") } });
  }
}

export function formatINR(amount: number): string {
  return "₹" + amount.toLocaleString("en-IN");
}
