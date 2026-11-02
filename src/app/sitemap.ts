import type { MetadataRoute } from "next";

import { SITE_URL as BASE_URL } from "@/lib/seo";
import { ARTICLES } from "@/lib/articles";
import { CATEGORY_PAGES } from "@/lib/categories";
import { toProductView } from "@/lib/product-view";
import { getActiveProducts } from "@/server/store/products";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/benefits`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/workshops`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/soil-report`, changeFrequency: "yearly", priority: 0.7 },
    { url: `${BASE_URL}/videos`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE_URL}/journal`, changeFrequency: "weekly", priority: 0.7 },
    ...ARTICLES.map((a) => ({
      url: `${BASE_URL}${a.href}`,
      lastModified: new Date(a.date),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    { url: `${BASE_URL}/faq`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/shipping-returns`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${BASE_URL}/trust`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${BASE_URL}/terms`, changeFrequency: "yearly", priority: 0.4 },
  ];

  // Only active products are returned, so drafts never leak into the sitemap.
  const products = await getActiveProducts();

  // A category page is only listed while it has products on it.
  const views = products.map(toProductView);
  const categoryEntries: MetadataRoute.Sitemap = CATEGORY_PAGES.filter((c) => views.some(c.match)).map((c) => ({
    url: `${BASE_URL}/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.9,
  }));
  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${BASE_URL}/shop/${product.slug}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticEntries, ...categoryEntries, ...productEntries];
}
