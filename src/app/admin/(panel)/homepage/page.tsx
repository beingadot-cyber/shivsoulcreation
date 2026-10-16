import type { Metadata } from "next";
import { asc, desc } from "drizzle-orm";
import { db } from "@/db";
import { heroSlides, reels, testimonials, products } from "@/db/schema";
import { ensureDb } from "@/lib/db-setup";
import HomepageManager from "@/components/admin/HomepageManager";

export const metadata: Metadata = { title: "Homepage Manager" };

export default async function AdminHomepagePage() {
  await ensureDb();
  const [hero, reelRows, testiRows, productRows] = await Promise.all([
    db.select().from(heroSlides).orderBy(asc(heroSlides.sortOrder), asc(heroSlides.id)),
    db.select().from(reels).orderBy(asc(reels.sortOrder), asc(reels.id)),
    db.select().from(testimonials).orderBy(desc(testimonials.id)),
    db
      .select({
        id: products.id,
        productCode: products.productCode,
        name: products.name,
        imageUrl: products.imageUrl,
        isFeatured: products.isFeatured,
        isBestseller: products.isBestseller,
      })
      .from(products)
      .orderBy(asc(products.productCode)),
  ]);

  return (
    <HomepageManager
      hero={hero.map((h) => ({ id: h.id, mediaUrl: h.mediaUrl, mediaType: h.mediaType, isEnabled: h.isEnabled }))}
      reels={reelRows.map((r) => ({ id: r.id, videoUrl: r.videoUrl, caption: r.caption, isEnabled: r.isEnabled }))}
      testimonials={testiRows.map((t) => ({
        id: t.id,
        customerName: t.customerName,
        message: t.message,
        rating: t.rating,
        isPublished: t.isPublished,
      }))}
      products={productRows.filter((p) => true)}
    />
  );
}
