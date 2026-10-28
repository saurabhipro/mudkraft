import type { Metadata } from "next";

import { displayImage, toProductView } from "@/lib/product-view";
import { OG_IMAGE, SITE_URL } from "@/lib/seo";
import { getCategories } from "@/server/store/categories";
import { getActiveProducts } from "@/server/store/products";
import { getChannelVideos } from "@/server/youtube";
import { HomePage } from "./home-page";

const DESCRIPTION =
  "Mudkraft is a slow craft studio shaping pots, kulhads, planters and diyas from river clay — made by hand, fired with fire, rooted in earth.";

export const metadata: Metadata = {
  title: "Mudkraft — Soulful Handcrafted Clay Pots, Kulhads & Matkas",
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/` },
  openGraph: {
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
    getCategories(),
    getChannelVideos(),
  ]);
  const views = products.map(toProductView);

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
        availability: "https://schema.org/InStock",
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
      <HomePage
        products={views}
        categories={categories.map((c) => c.name)}
        videos={videos}
      />
    </>
  );
}
