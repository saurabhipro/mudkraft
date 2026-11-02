import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CATEGORY_PAGES, productSeo } from "@/lib/categories";
import { CATALOGUE_CODES, catalogueSlug } from "@/lib/catalogue";
import { displayImage, groupFamilies, toProductView } from "@/lib/product-view";
import { toReviewView } from "@/lib/review-view";
import { breadcrumbs, priceValidUntil, availability, returnPolicy, shippingDetails } from "@/lib/schema";
import { SITE_URL } from "@/lib/seo";
import { getActiveProducts, getProductBySlug } from "@/server/store/products";
import { getApprovedReviews, getReviewSummary } from "@/server/store/reviews";
import { ProductDetail } from "./product-detail";

type PageProps = { params: Promise<{ slug: string }> };

/**
 * Rendered on every visit (from the store cache, which Bikriup's webhook clears), so a
 * change made in the admin shows on the next click — a static page lingered in the
 * browser's router cache and needed a reload. New products need no rebuild either.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: "Piece not found — Mudkraft", robots: { index: false } };
  }

  const view = toProductView(product);
  const url = `${SITE_URL}/shop/${view.slug}`;
  // Built from the product's data so every size has its own title that says what people search for.
  const { title, description } = productSeo(view);

  return {
    title: { absolute: title },
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
  const families = groupFamilies(allProducts.map(toProductView));
  const own = families.find((f) => f.sizes.some((s) => s.slug === view.slug));
  const sizes = own?.sizes ?? [view];

  // Other product types, same category first, then anything else, so the grid
  // is never empty on a catalogue where a category may hold a single type.
  const others = families.filter((f) => f !== own);
  const sameCategory = others.filter((f) => view.category && f.categories.includes(view.category));
  const alsoLove = [...sameCategory, ...others.filter((f) => !sameCategory.includes(f))].slice(0, 4);

  const url = `${SITE_URL}/shop/${view.slug}`;
  const image = displayImage(view);
  const reviewViews = reviews.map(toReviewView);

  const seo = productSeo(view);
  const photos = [...new Set([image, ...view.gallery].filter((x): x is string => Boolean(x)))].slice(0, 6);
  const landing = CATEGORY_PAGES.find((c) => c.slug !== "clay-cookware" && c.match(view));

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: seo.label,
    description: view.description || view.note || seo.description,
    image: photos.length ? photos : undefined,
    sku: CATALOGUE_CODES[catalogueSlug(view) ?? ""] ?? view.slug,
    brand: { "@type": "Brand", name: "Mudkraft" },
    category: view.category ?? undefined,
    material: "Unglazed river clay",
    size: view.sizeLabel || undefined,
    // Sizes of one piece are variants of one product family, not competing duplicates.
    isVariantOf:
      sizes.length > 1
        ? {
            "@type": "ProductGroup",
            name: own?.name ?? view.name,
            productGroupID: `mudkraft-${(own?.name ?? view.name).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
            variesBy: "https://schema.org/size",
          }
        : undefined,
    offers: {
      "@type": "Offer",
      price: (view.pricePaise / 100).toFixed(2),
      priceCurrency: "INR",
      priceValidUntil: priceValidUntil(),
      itemCondition: "https://schema.org/NewCondition",
      // Mirrors the page's own "sold out" rule: a stock of 0 means unavailable.
      availability: availability(product.trackInventory === false ? 1 : view.stockQty),
      url,
      seller: { "@type": "Organization", name: "Mudkraft" },
      shippingDetails,
      hasMerchantReturnPolicy: returnPolicy,
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
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            ...breadcrumbs([
              { name: "Home", url: `${SITE_URL}/` },
              ...(landing ? [{ name: landing.label, url: `${SITE_URL}/${landing.slug}` }] : []),
              { name: seo.label, url },
            ]),
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
    </>
  );
}
