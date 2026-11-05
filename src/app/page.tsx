import type { Metadata } from "next";

import { displayImage, toProductView } from "@/lib/product-view";
import { availability } from "@/lib/schema";
import { OG_IMAGE, SITE_URL } from "@/lib/seo";
import { getCategories } from "@/server/store/categories";
import { getActiveProducts } from "@/server/store/products";
import { imageBoxes } from "@/server/image-box";
import { getChannelVideos } from "@/server/youtube";
import { HomePage } from "./home-page";

const DESCRIPTION =
  "Buy handmade unglazed clay handi, kadai, dahi handi and matka from Khurja. Wood-fired, lab-tested with no lead, cadmium or arsenic. Free delivery across India.";

export const metadata: Metadata = {
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

  const productsJsonLd = {
    "@context": "https://schema.org",
    "@graph": views.map((p) => ({
      "@type": "Product",
      name: p.name,
      description: p.description || `${p.tag} — handcrafted river-clay piece by Mudkraft.`,
      image: displayImage(p) ?? undefined,
      brand: { "@type": "Brand", name: "Mudkraft" },
      offers: {
        "@type": "Offer",
        // Schema.org expects a plain decimal, so convert out of paise.
        price: (p.pricePaise / 100).toFixed(2),
        priceCurrency: "INR",
        availability: availability(p.stockQty),
        url: `${SITE_URL}/shop/${p.slug}`,
      },
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
