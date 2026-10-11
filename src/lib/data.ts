import { db } from "@/db";
import {
  products,
  heroSlides,
  reels,
  testimonials,
  orders,
  orderItems,
  customers,
  type Product,
  type HeroSlide,
  type Reel,
  type Testimonial,
} from "@/db/schema";
import { and, asc, desc, eq, ne, sql } from "drizzle-orm";
import { ensureDb } from "./db-setup";

export async function getPublicProducts(): Promise<Product[]> {
  await ensureDb();
  return db
    .select()
    .from(products)
    .where(and(eq(products.isArchived, false), eq(products.isActive, true)))
    .orderBy(asc(products.productCode));
}

export async function getAllProductsAdmin(): Promise<Product[]> {
  await ensureDb();
  return db
    .select()
    .from(products)
    .where(eq(products.isArchived, false))
    .orderBy(asc(products.productCode));
}

export async function getProductByCode(code: string): Promise<Product | null> {
  await ensureDb();
  const rows = await db
    .select()
    .from(products)
    .where(eq(products.productCode, code.toUpperCase()))
    .limit(1);
  const p = rows[0];
  if (!p || p.isArchived || !p.isActive) return null;
  return p;
}

export async function getHomeData(): Promise<{
  hero: HeroSlide[];
  featured: Product[];
  bestsellers: Product[];
  products: Product[];
  reels: Reel[];
  testimonials: Testimonial[];
}> {
  await ensureDb();
  const [hero, featured, bestsellers, all, reelRows, testiRows] =
    await Promise.all([
      db
        .select()
        .from(heroSlides)
        .where(eq(heroSlides.isEnabled, true))
        .orderBy(asc(heroSlides.sortOrder), asc(heroSlides.id)),
      db
        .select()
        .from(products)
        .where(
          and(
            eq(products.isArchived, false),
            eq(products.isActive, true),
            eq(products.isFeatured, true)
          )
        )
        .orderBy(asc(products.productCode))
        .limit(4),
      db
        .select()
        .from(products)
        .where(
          and(
            eq(products.isArchived, false),
            eq(products.isActive, true),
            eq(products.isBestseller, true)
          )
        )
        .orderBy(asc(products.productCode))
        .limit(10),
      db
        .select()
        .from(products)
        .where(and(eq(products.isArchived, false), eq(products.isActive, true)))
        .orderBy(asc(products.productCode))
        .limit(8),
      db
        .select()
        .from(reels)
        .where(eq(reels.isEnabled, true))
        .orderBy(asc(reels.sortOrder), asc(reels.id)),
      db
        .select()
        .from(testimonials)
        .where(eq(testimonials.isPublished, true))
        .orderBy(desc(testimonials.id)),
    ]);
  return {
    hero,
    featured,
    bestsellers,
    products: all,
    reels: reelRows,
    testimonials: testiRows,
  };
}

export async function getAdminStats() {
  await ensureDb();
  const [p] = await db
    .select({
      total: sql<number>`count(*)::int`,
      active: sql<number>`count(*) filter (where ${products.isActive} and not ${products.isArchived})::int`,
      outOfStock: sql<number>`count(*) filter (where ${products.stockQuantity} <= 0 and not ${products.isArchived})::int`,
    })
    .from(products)
    .where(eq(products.isArchived, false));
  const [c] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(customers);
  const [o] = await db
    .select({
      total: sql<number>`count(*)::int`,
      pending: sql<number>`count(*) filter (where ${orders.orderStatus} = 'pending')::int`,
      confirmed: sql<number>`count(*) filter (where ${orders.orderStatus} = 'confirmed')::int`,
      delivered: sql<number>`count(*) filter (where ${orders.orderStatus} = 'delivered')::int`,
      revenue: sql<number>`coalesce(sum(${orders.orderTotal}) filter (where ${orders.orderStatus} != 'cancelled'), 0)::int`,
    })
    .from(orders);
  return {
    products: p,
    customers: c,
    orders: o,
  };
}

export async function getAdminOrders(statusFilter?: string) {
  await ensureDb();
  const base = db.select().from(orders).orderBy(desc(orders.id));
  const rows =
    statusFilter && statusFilter !== "all"
      ? await db
          .select()
          .from(orders)
          .where(eq(orders.orderStatus, statusFilter))
          .orderBy(desc(orders.id))
      : await base;
  return rows;
}

export async function getOrderWithItems(orderId: number) {
  await ensureDb();
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) return null;
  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));
  return { order, items };
}

export async function getCustomerStats() {
  await ensureDb();
  const rows = await db
    .select({
      id: customers.id,
      mobileNumber: customers.mobileNumber,
      countryCode: customers.countryCode,
      mobileVerified: customers.mobileVerified,
      accountStatus: customers.accountStatus,
      createdAt: customers.createdAt,
      lastLogin: customers.lastLogin,
      orderCount: sql<number>`(select count(*) from ${orders} where ${orders.customerId} = ${customers.id})::int`,
    })
    .from(customers)
    .orderBy(desc(customers.id));
  return rows;
}

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export const PAYMENT_STATUSES = [
  "pending",
  "awaiting_verification",
  "paid",
  "failed",
  "refunded",
] as const;

export function statusLabel(s: string) {
  return s
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
