import { revalidateTag } from "next/cache";

import { CACHE_TAGS } from "./tags";

/**
 * Cache invalidation, called from admin mutations.
 *
 * Next 16 offers two primitives and they are not interchangeable:
 *
 *  - `revalidateTag(tag, profile)` purges tagged entries and works anywhere —
 *    server actions, route handlers, webhooks — and works with the
 *    `unstable_cache` entries our store layer creates. This is what we use.
 *  - `updateTag(tag)` is single-argument and gives read-your-own-writes, but it
 *    belongs to the `"use cache"` system and is only valid inside a Server
 *    Action. If this project ever enables `cacheComponents`, switching to it is
 *    a change confined to this file.
 *
 * Each helper invalidates every tag a change could affect, not just the obvious
 * one. Editing a single product also busts the list tag, because the shop grid
 * shows that product's name and price too — invalidating only `product:<slug>`
 * would leave a corrected price right on the detail page and wrong on the grid,
 * which is worse than not caching at all.
 */

/** Expire immediately rather than serving stale content after an admin edit. */
const IMMEDIATELY = { expire: 0 } as const;

export function revalidateProduct(slug: string): void {
  revalidateTag(CACHE_TAGS.product(slug), IMMEDIATELY);
  revalidateTag(CACHE_TAGS.products, IMMEDIATELY);
}

/** For creates, deletes, reordering, or a bulk re-price across the catalogue. */
export function revalidateAllProducts(): void {
  revalidateTag(CACHE_TAGS.products, IMMEDIATELY);
}

export function revalidateCategories(): void {
  revalidateTag(CACHE_TAGS.categories, IMMEDIATELY);
  // Products carry a denormalised category name, so they go stale too.
  revalidateTag(CACHE_TAGS.products, IMMEDIATELY);
}

export function revalidateReviews(productSlug: string): void {
  revalidateTag(CACHE_TAGS.reviews(productSlug), IMMEDIATELY);
}

/**
 * Changing the pricing assumptions re-derives every stored price, so the whole
 * catalogue is stale — not just the config row.
 */
export function revalidatePricingConfig(): void {
  revalidateTag(CACHE_TAGS.pricingConfig, IMMEDIATELY);
  revalidateTag(CACHE_TAGS.products, IMMEDIATELY);
}
