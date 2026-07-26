import type { Metadata } from "next";

import { products } from "@/lib/products";
import { OG_IMAGE, SITE_URL } from "@/lib/seo";
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

const productsJsonLd = {
  "@context": "https://schema.org",
  "@graph": products.map((p) => ({
    "@type": "Product",
    name: p.name,
    description: `${p.tag} — handcrafted river-clay piece by Mudkraft.`,
    image: p.img,
    brand: { "@type": "Brand", name: "Mudkraft" },
    offers: {
      "@type": "Offer",
      price: p.priceNum,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}/#collection`,
    },
  })),
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productsJsonLd) }}
      />
      <HomePage />
    </>
  );
}
