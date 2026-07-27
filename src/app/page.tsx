import type { Metadata } from "next";

import { displayImage, toProductView } from "@/lib/product-view";
import { OG_IMAGE, SITE_URL } from "@/lib/seo";
import { getCategories } from "@/server/store/categories";
import { getActiveProducts } from "@/server/store/products";
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

export default async function Page() {
  // Both reads go through the cached store layer, so this page is served from
  // cache until an admin edit revalidates the `products` tag.
  const [products, categories] = await Promise.all([getActiveProducts(), getCategories()]);
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
      />
    </>
  );
}
