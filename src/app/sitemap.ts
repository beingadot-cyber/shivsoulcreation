import type { MetadataRoute } from "next";
import { getPublicProducts } from "@/lib/data";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const pages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/products`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/support`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    ...["shipping", "returns", "privacy", "terms"].map((slug) => ({
      url: `${SITE_URL}/policy/${slug}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];

  try {
    const products = await getPublicProducts();
    for (const p of products) {
      pages.push({
        url: `${SITE_URL}/products/${p.productCode.toLowerCase()}`,
        lastModified: p.updatedAt ?? now,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  } catch (e) {
    console.error("sitemap-products", e);
  }
  return pages;
}
