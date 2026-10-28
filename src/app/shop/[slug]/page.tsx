import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { displayImage, groupFamilies, toProductView } from "@/lib/product-view";
import { toReviewView } from "@/lib/review-view";
import { SITE_URL } from "@/lib/seo";
import { getActiveProducts, getProductBySlug } from "@/server/store/products";
import { getApprovedReviews, getReviewSummary } from "@/server/store/reviews";
import { ProductDetail } from "./product-detail";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const products = await getActiveProducts();
  return products.map((p) => ({ slug: p.slug }));
}

/**
 * A product published after the build should not 404 until the next deploy.
 * Rendering unknown slugs on demand lets the catalogue grow between builds;
 * getProductBySlug still returns null for draft or archived items.
 */
export const dynamicParams = true;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: "Piece not found — Mudkraft", robots: { index: false } };
  }

  const view = toProductView(product);
  const url = `${SITE_URL}/shop/${view.slug}`;
  // "Bhagona — Bhagona" read oddly where the type is the name itself.
  const title = `${view.name}${view.tag && view.tag !== view.name ? ` — ${view.tag}` : ""} · Mudkraft`;
  const description = (view.description || view.note).slice(0, 155);

  return {
    title,
    description,
    alternates: { canonical: url },
    // `og:type: product` is rendered as a hoisted meta tag below: Next's metadata
    // API only knows a fixed set of og types and silently drops unknown ones.
    // The share image is ./opengraph-image.tsx: the piece, its price and the Mudkraft seal.
    openGraph: { title, description, url, siteName: "Mudkraft" },
    twitter: { card: "summary_large_image" },
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const view = toProductView(product);
  const [allProducts, reviews, summary] = await Promise.all([
    getActiveProducts(),
    getApprovedReviews(slug),
    getReviewSummary(slug),
  ]);

  // Other variants of this product type (Handi 2.5 L, Dahi Handi 1.5 L) become the picker,
  // and are kept out of the recommendations below.
  const allViews = allProducts.map(toProductView);
  const sizes = groupFamilies(allViews).find((f) => f.sizes.some((s) => s.slug === view.slug))
    ?.sizes ?? [view];
  const sizeSlugs = new Set(sizes.map((s) => s.slug));

  // Same category first, then anything else, so the rail is never empty on a
  // catalogue where a category may hold a single product.
  const others = allViews.filter((p) => !sizeSlugs.has(p.slug));
  const sameCategory = others.filter((p) => p.category === view.category);
  const alsoLove = (sameCategory.length > 0 ? sameCategory : others).slice(0, 3);

  const url = `${SITE_URL}/shop/${view.slug}`;
  const image = displayImage(view);
  const reviewViews = reviews.map(toReviewView);

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: view.name,
    description: view.description || view.note,
    image: image ?? undefined,
    brand: { "@type": "Brand", name: "Mudkraft" },
    category: view.category ?? undefined,
    offers: {
      "@type": "Offer",
      price: (view.pricePaise / 100).toFixed(2),
      priceCurrency: "INR",
      availability:
        product.trackInventory && product.stockQty <= 0
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
      url,
    },
    aggregateRating:
      summary.count > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: summary.average.toFixed(1),
            reviewCount: summary.count,
            bestRating: "5",
            worstRating: "1",
          }
        : undefined,
    // Only approved reviews reach this array; the store filters in SQL.
    review: reviewViews.slice(0, 5).map((r) => ({
      "@type": "Review",
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.rating,
        bestRating: "5",
        worstRating: "1",
      },
      author: { "@type": "Person", name: r.name },
      datePublished: r.date,
      name: r.title,
      reviewBody: r.body,
    })),
  };

  return (
    <>
      {/* The page comes first: Next scrolls a new page to its first visible element, and a
          leading <meta> (hoisted into <head>) left a product opened from the collection
          sitting at the collection's scroll position. */}
      <ProductDetail
        product={view}
        sizes={sizes}
        alsoLove={alsoLove}
        reviews={reviewViews}
        reviewSummary={summary}
      />
      <meta property="og:type" content="product" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
    </>
  );
}
