/**
 * Cache tags.
 *
 * Every cached read declares the tags it depends on; every admin write
 * invalidates the tags it affects. Keeping both sides in this one file is
 * deliberate — a tag string typed by hand in two places is how stale data
 * survives a deploy and nobody notices for a week.
 */

export const CACHE_TAGS = {
  /** Any change to the product list: create, delete, status, price, ordering. */
  products: "products",
  /** One product's own detail. */
  product: (slug: string) => `product:${slug}`,
  categories: "categories",
  /** Approved reviews for one product. */
  reviews: (productSlug: string) => `reviews:${productSlug}`,
  /** The active pricing assumptions. */
  pricingConfig: "pricing-config",
} as const;

/**
 * How long a cached read survives without an explicit invalidation.
 *
 * This is a backstop, not the primary mechanism: admin writes revalidate tags
 * immediately, so a correct edit is visible at once. The TTL only bounds how
 * long a *missed* invalidation could go unnoticed.
 */
export const CACHE_TTL_SECONDS = {
  catalog: 60 * 60, // 1 hour
  reviews: 60 * 10, // 10 minutes — moderation should surface quickly
} as const;
