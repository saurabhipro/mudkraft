import type { Metadata } from "next";

import { displayImage, toProductView } from "@/lib/product-view";
import { OG_IMAGE, SITE_URL } from "@/lib/seo";
import { getCategories } from "@/server/store/categories";
import { getActiveProducts } from "@/server/store/products";
import { imageBoxes } from "@/server/image-box";
import { getChannelVideos } from "@/server/youtube";
import { HomePage } from "./home-page";
import { keywordsFor } from "@/lib/keywords";

const DESCRIPTION =
  "Buy handmade unglazed clay handi, kadai, dahi handi and matka from Khurja. Wood-fired, lab-tested with no lead, cadmium or arsenic. Doorstep delivery across India.";

export const metadata: Metadata = {
  keywords: keywordsFor("/"),
  title: "Mudkraft – Handmade Clay Cookware & Mitti Ke Bartan Online | Unglazed",
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/` },
  openGraph: {
    siteName: "Mudkraft",
    title: "Mudkraft — Soulful Handcrafted Clay",
    description: DESCRIPTION,
    type: "website",
    url: `${SITE_URL}/`,
    images: [OG_IMAGE],
  },
  twitter: { card: "summary_large_image", images: [OG_IMAGE] },
};

/**
 * Rendered on every visit, never kept as a static page: the browser holds static pages it
 * has seen for minutes, so a price or stock change in Bikriup showed only after a reload.
 * The reads below still come from the store cache, which Bikriup's webhook clears.
 */
export const dynamic = "force-dynamic";

export default async function Page() {
  const [products, categories, videos] = await Promise.all([
    getActiveProducts(),
    // The filter chips are a nicety: a failed lookup must never turn the home page into a 500.
    getCategories().catch((error) => {
      console.error("[home] categories lookup failed; using the products' own", error);
      return null;
    }),
    getChannelVideos(),
  ]);
  const views = products.map(toProductView);
  const boxes = await imageBoxes(views.map(displayImage));
  const categoryNames =
    categories?.map((c) => c.name) ??
    [...new Set(views.map((v) => v.category).filter((c): c is string => Boolean(c)))];

  // A list of links, not full Product entities: Google wants Product markup on each piece's own
  // page, where it carries shipping and returns. Copies here only drew "missing field" warnings.
  const productsJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Mudkraft handmade clay pieces",
    itemListElement: views.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/shop/${p.slug}`,
      name: `${p.name} ${p.sizeLabel}`.trim(),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productsJsonLd) }}
      />
      <HomePage products={views} categories={categoryNames} videos={videos} boxes={boxes} />
    </>
  );
}
