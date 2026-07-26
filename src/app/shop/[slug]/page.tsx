import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getProductBySlug, products } from "@/lib/products";
import { getReviewsForProduct, getReviewSummary } from "@/lib/reviews";
import { SITE_URL } from "@/lib/seo";
import { ProductDetail } from "./product-detail";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const p = getProductBySlug(slug);

  if (!p) {
    return {
      title: "Piece not found — Mudkraft",
      robots: { index: false },
    };
  }

  const url = `${SITE_URL}/shop/${p.slug}`;
  const title = `${p.name} — ${p.tag} · Mudkraft`;
  const description = p.description.slice(0, 155);

  return {
    title,
    description,
    alternates: { canonical: url },
    // `og:type: product` is rendered as a hoisted meta tag below: Next's metadata
    // API only knows a fixed set of og types and silently drops unknown ones.
    openGraph: {
      title,
      description,
      url,
      images: [p.img],
    },
    twitter: { card: "summary_large_image", images: [p.img] },
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const url = `${SITE_URL}/shop/${product.slug}`;
  const summary = getReviewSummary(product.slug);

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.img,
    brand: { "@type": "Brand", name: "Mudkraft" },
    category: product.category,
    offers: {
      "@type": "Offer",
      price: product.priceNum,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
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
    review: getReviewsForProduct(product.slug)
      .slice(0, 5)
      .map((r) => ({
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
      <meta property="og:type" content="product" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <ProductDetail product={product} />
    </>
  );
}
