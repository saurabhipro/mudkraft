import { asc, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { cache } from "react";

import { BikriupError, bikriup, bikriupEnabled, toStoreProductShape, type BkProduct } from "../bikriup";
import { db } from "../db";
import { category, product, productImage } from "../db/schema/catalog";
import { CACHE_TAGS, CACHE_TTL_SECONDS } from "./tags";

/**
 * Two caching tiers, doing different jobs:
 *
 *  - `unstable_cache` caches across requests and users, keyed by tag. This is
 *    what stops every visitor's product page from hitting Neon.
 *  - React `cache()` dedupes within a single render pass, so a page that reads
 *    the same product from three components issues one lookup, not three.
 *
 * Admin reads deliberately bypass both (see `admin.ts`): an editor must see the
 * row they just saved, not a cached copy of the row they replaced.
 */

export interface StoreProductImage {
  publicId: string;
  version: string | null;
  resourceType: "image" | "video";
  alt: string;
  width: number | null;
  height: number | null;
  isPrimary: boolean;
}

export interface StoreProduct {
  id: string;
  slug: string;
  name: string;
  tag: string;
  note: string;
  description: string;
  story: string;
  sizeLabel: string;
  pricePaise: number;
  compareAtPaise: number | null;
  status: "draft" | "active" | "archived";
  fulfilmentMode: "ship_nationwide" | "local_delivery_only" | "pickup_only";
  stockQty: number;
  trackInventory: boolean;
  categorySlug: string | null;
  categoryName: string | null;
  specs: Array<{ label: string; value: string }>;
  care: string[];
  images: StoreProductImage[];
}

function toStoreProduct(row: {
  product: typeof product.$inferSelect;
  category: typeof category.$inferSelect | null;
  images: (typeof productImage.$inferSelect)[];
}): StoreProduct {
  const p = row.product;
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    tag: p.tag,
    note: p.note,
    description: p.description,
    story: p.story,
    sizeLabel: p.sizeLabel,
    pricePaise: p.pricePaise,
    compareAtPaise: p.compareAtPaise,
    status: p.status,
    fulfilmentMode: p.fulfilmentMode,
    stockQty: p.stockQty,
    trackInventory: p.trackInventory,
    categorySlug: row.category?.slug ?? null,
    categoryName: row.category?.name ?? null,
    specs: p.specs,
    care: p.care,
    images: row.images
      .slice()
      .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.sortOrder - b.sortOrder)
      .map((img) => ({
        publicId: img.publicId,
        version: img.version,
        resourceType: img.resourceType,
        alt: img.alt,
        width: img.width,
        height: img.height,
        isPrimary: img.isPrimary,
      })),
  };
}

async function queryActiveProducts(): Promise<StoreProduct[]> {
  // Bikriup runs the catalogue once it is switched on; every listed size comes back as its own row.
  if (bikriupEnabled()) {
    const data = await bikriup<{ products: BkProduct[] }>("/products?group=0&limit=300");
    return data.products.map(toStoreProductShape);
  }

  const rows = await db.query.product.findMany({
    where: eq(product.status, "active"),
    orderBy: [asc(product.sortOrder), asc(product.name)],
    with: { category: true, images: true },
  });

  return rows.map((row) =>
    toStoreProduct({
      product: row,
      category: row.category ?? null,
      images: row.images,
    }),
  );
}

async function queryProductBySlug(slug: string): Promise<StoreProduct | null> {
  if (bikriupEnabled()) {
    try {
      const data = await bikriup<{ product: BkProduct }>(`/products/${encodeURIComponent(slug)}`);
      return toStoreProductShape(data.product);
    } catch (error) {
      // Unlisted and missing items look the same to the shop's pages: not found.
      if (error instanceof BikriupError && error.status === 404) return null;
      throw error;
    }
  }

  const row = await db.query.product.findFirst({
    where: eq(product.slug, slug),
    with: { category: true, images: true },
  });

  if (!row || row.status !== "active") return null;

  return toStoreProduct({ product: row, category: row.category ?? null, images: row.images });
}

/** Every active product, for the shop listing and sitemap. */
export const getActiveProducts = cache(
  unstable_cache(queryActiveProducts, ["active-products"], {
    tags: [CACHE_TAGS.products],
    revalidate: CACHE_TTL_SECONDS.catalog,
  }),
);

/**
 * One active product by its public slug. Returns null for draft, archived or
 * missing products so callers hit the same not-found path for all three —
 * a draft product should be indistinguishable from one that never existed.
 */
export const getProductBySlug = cache(async (slug: string): Promise<StoreProduct | null> =>
  unstable_cache(() => queryProductBySlug(slug), ["product-by-slug", slug], {
    tags: [CACHE_TAGS.products, CACHE_TAGS.product(slug)],
    revalidate: CACHE_TTL_SECONDS.catalog,
  })(),
);
