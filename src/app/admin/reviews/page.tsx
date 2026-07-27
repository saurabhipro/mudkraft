import { RowMenu } from "@/components/admin/RowMenu";
import { Tabs } from "@/components/admin/Tabs";
import {
  EmptyState,
  PageHeader,
  Panel,
  StatusBadge,
  reviewStatusTone,
} from "@/components/admin/ui";
import { cloudinaryThumb } from "@/lib/cloudinary";
import { getAdminReviews } from "@/server/store/admin";

import { ReviewActions } from "./review-actions";

type ReviewStatus = "pending" | "approved" | "rejected";

function isStatus(value: string | undefined): value is ReviewStatus {
  return value === "pending" || value === "approved" || value === "rejected";
}

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter = isStatus(status) ? status : undefined;

  const [reviews, all] = await Promise.all([getAdminReviews(filter), getAdminReviews()]);
  const countOf = (value: ReviewStatus) => all.filter((r) => r.status === value).length;

  return (
    <div>
      <PageHeader
        breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Reviews" }]}
        title="Reviews"
        description="New reviews arrive as pending and stay hidden from the storefront until approved. Only approved reviews are ever served publicly."
      />

      <Tabs
        param="status"
        ariaLabel="Review status"
        items={[
          { value: "", label: "All", icon: "all", count: all.length },
          { value: "pending", label: "Pending", icon: "pending", count: countOf("pending") },
          { value: "approved", label: "Approved", icon: "live", count: countOf("approved") },
          { value: "rejected", label: "Rejected", icon: "rejected", count: countOf("rejected") },
        ]}
      />

      {reviews.length === 0 ? (
        <Panel className="mt-5">
          <EmptyState
            title={filter ? `No ${filter} reviews` : "No reviews yet"}
            description="Customer reviews will appear here for moderation before they reach the storefront."
          />
        </Panel>
      ) : (
        <ul className="mt-5 space-y-3">
          {reviews.map((review) => (
            <li key={review.id}>
              <Panel className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-xs tracking-wider uppercase text-clay">
                      {review.productName}
                      <span className="ml-2 text-gold" aria-label={`${review.rating} out of 5`}>
                        {"★".repeat(review.rating)}
                        <span className="text-earth/20">{"★".repeat(5 - review.rating)}</span>
                      </span>
                    </div>
                    <h2 className="mt-1 font-display text-xl text-earth">{review.title}</h2>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {review.authorName}
                      {review.authorCity ? `, ${review.authorCity}` : ""} ·{" "}
                      {review.createdAt.toLocaleDateString("en-IN")}
                      {review.verifiedPurchase && " · verified purchase"}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge tone={reviewStatusTone(review.status)}>{review.status}</StatusBadge>
                    <RowMenu
                      label={`Actions for review by ${review.authorName}`}
                      items={[
                        { label: "Open product", href: `/admin/products/${review.productSlug}` },
                        { label: "View on storefront", href: `/shop/${review.productSlug}#reviews` },
                      ]}
                    />
                  </div>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-foreground/85">{review.body}</p>

                {review.photoPublicId && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cloudinaryThumb(review.photoPublicId, 240)}
                    alt=""
                    className="mt-4 h-28 w-28 rounded-xl object-cover"
                  />
                )}

                <div className="mt-5">
                  <ReviewActions reviewId={review.id} status={review.status} />
                </div>
              </Panel>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
