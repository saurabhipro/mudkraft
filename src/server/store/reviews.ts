import { and, desc, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { cache } from "react";

import { db } from "../db";
import { product } from "../db/schema/catalog";
import { review } from "../db/schema/reviews";
import { CACHE_TAGS, CACHE_TTL_SECONDS } from "./tags";

export interface StoreReview {
  id: string;
  authorName: string;
  authorCity: string;
  rating: number;
  title: string;
  body: string;
  photoPublicId: string | null;
  verifiedPurchase: boolean;
  /** ISO date string, not a Date — cached values are serialised. */
  createdAt: string;
}

export interface ReviewSummary {
  average: number;
  count: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

/**
 * Only `approved` reviews are ever returned here. The status filter is applied
 * in the query rather than in the caller, so there is no code path where a
 * forgotten `.filter()` leaks unmoderated content onto a product page.
 */
async function queryApprovedReviews(productSlug: string): Promise<StoreReview[]> {
  const rows = await db
    .select({
      id: review.id,
      authorName: review.authorName,
      authorCity: review.authorCity,
      rating: review.rating,
      title: review.title,
      body: review.body,
      photoPublicId: review.photoPublicId,
      verifiedPurchase: review.verifiedPurchase,
      createdAt: review.createdAt,
    })
    .from(review)
    .innerJoin(product, eq(review.productId, product.id))
    .where(and(eq(product.slug, productSlug), eq(review.status, "approved")))
    .orderBy(desc(review.createdAt));

  return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
}

export const getApprovedReviews = cache(
  async (productSlug: string): Promise<StoreReview[]> =>
    unstable_cache(() => queryApprovedReviews(productSlug), ["approved-reviews", productSlug], {
      tags: [CACHE_TAGS.reviews(productSlug)],
      revalidate: CACHE_TTL_SECONDS.reviews,
    })(),
);

export async function getReviewSummary(productSlug: string): Promise<ReviewSummary> {
  const reviews = await getApprovedReviews(productSlug);
  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  let total = 0;
  for (const r of reviews) {
    const rating = Math.min(5, Math.max(1, r.rating)) as 1 | 2 | 3 | 4 | 5;
    distribution[rating] += 1;
    total += rating;
  }

  return {
    average: reviews.length ? total / reviews.length : 0,
    count: reviews.length,
    distribution,
  };
}
