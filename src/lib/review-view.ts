import { cloudinaryUrl } from "./cloudinary";

/**
 * Client-safe review shape. Built on the server from an approved `StoreReview`
 * — the store layer filters to `status = 'approved'` in SQL, so nothing
 * unmoderated can reach this type in the first place.
 */
export interface ReviewView {
  id: string;
  name: string;
  city: string;
  rating: number;
  /** ISO date string. */
  date: string;
  title: string;
  body: string;
  photo: string | null;
  verified: boolean;
}

export interface ReviewSummaryView {
  average: number;
  count: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

interface SourceReview {
  id: string;
  authorName: string;
  authorCity: string;
  rating: number;
  title: string;
  body: string;
  photoPublicId: string | null;
  verifiedPurchase: boolean;
  createdAt: string;
}

export function toReviewView(review: SourceReview): ReviewView {
  return {
    id: review.id,
    name: review.authorName,
    city: review.authorCity,
    rating: review.rating,
    date: review.createdAt,
    title: review.title,
    body: review.body,
    photo: review.photoPublicId
      ? /^https?:\/\//.test(review.photoPublicId)
        ? review.photoPublicId
        : cloudinaryUrl({ publicId: review.photoPublicId, transforms: ["w_800"] })
      : null,
    verified: review.verifiedPurchase,
  };
}
