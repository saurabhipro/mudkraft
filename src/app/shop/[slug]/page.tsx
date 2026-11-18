import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CATEGORY_PAGES, productDescription, productSeo } from "@/lib/categories";
import { CATALOGUE_CODES, catalogueSlug } from "@/lib/catalogue";
import { productKeywords } from "@/lib/keywords";
import { displayImage, groupFamilies, toProductView } from "@/lib/product-view";
import { toReviewView } from "@/lib/review-view";
import { breadcrumbs, priceValidUntil, availability, returnPolicy, shippingDetails, variantGroupId } from "@/lib/schema";
import { ORG_ID, SITE_URL } from "@/lib/seo";
import { getActiveProducts, getProductBySlug } from "@/server/store/products";
import { getDeliveryTerms } from "@/server/store/delivery";
import { getApprovedReviews, getReviewSummary } from "@/server/store/reviews";
import { ProductDetail } from "./product-detail";

type PageProps = { params: Promise<{ slug: string }> };

/** A measurement in centimetres, as schema.org wants it (CMT is the UN/CEFACT code). */
const cm = (value: number | null) =>
  value ? { "@type": "QuantitativeValue", value, unitCode: "CMT" } : undefined;

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
  // The shop's own search & sharing from Bikriup wins; each empty part is built from the
  // product's data so every size still has its own title that says what people search for.
  const auto = productSeo(view);
  const seo = product.seo ?? {};
  const title = seo.title || auto.title;
  const description = seo.description || auto.description;
  const keywords = seo.keywords?.length ? seo.keywords : productKeywords(view);

  return {
    title: { absolute: title },
    description,
    keywords,
    alternates: { canonical: url },
    ...(seo.noindex ? { robots: { index: false, follow: true } } : {}),
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
  const [allProducts, reviews, summary, delivery] = await Promise.all([
    getActiveProducts(),
    getApprovedReviews(slug),
    getReviewSummary(slug),
    getDeliveryTerms(),
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

  const groupId = variantGroupId(view, sizes);

  const reviewsLd = reviewViews.slice(0, 5).map((r) => ({
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
  }));

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: seo.label,
    url,
    description: productDescription(view),
    image: photos.length ? photos : undefined,
    sku: CATALOGUE_CODES[catalogueSlug(view) ?? ""] ?? view.slug,
    brand: { "@type": "Brand", name: "Mudkraft" },
    category: view.category ?? undefined,
    material: "Unglazed river clay",
    size: view.sizeLabel || undefined,
    width: cm(view.widthCm),
    height: cm(view.heightCm),
    countryOfOrigin: { "@type": "Country", name: "India" },
    manufacturer: { "@id": ORG_ID },
    // Sizes of one piece are variants of one product family, not competing duplicates.
    isVariantOf: groupId
      ? {
          "@type": "ProductGroup",
          name: view.name.split("·")[0].trim(),
          productGroupID: groupId,
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
      seller: { "@id": ORG_ID },
      shippingDetails: shippingDetails(delivery),
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
    // Left out when there are none: an empty array reads as a broken field to validators.
    review: reviewsLd.length > 0 ? reviewsLd : undefined,
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
