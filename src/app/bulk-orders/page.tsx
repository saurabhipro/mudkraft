import type { Metadata } from "next";

import { CATALOGUE_CODES, catalogueSlug } from "@/lib/catalogue";
import { displayImage, toProductView } from "@/lib/product-view";
import { OG_IMAGE, SITE_URL } from "@/lib/seo";
import { getActiveProducts } from "@/server/store/products";
import { BulkOrdersPage, type PickerItem } from "./bulk-orders-page";

const URL = `${SITE_URL}/bulk-orders`;
const TITLE = "Bulk & Custom Orders — Mudkraft";
const DESCRIPTION =
  "Order handmade clay cookware, teaware and serveware in bulk for cafés, hotels, gifting and resale, or ask for a custom piece made to your brief.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: {
    siteName: "Mudkraft",
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    url: URL,
    images: [OG_IMAGE],
  },
  twitter: { card: "summary_large_image", images: [OG_IMAGE] },
};

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  let items: PickerItem[] = [];
  try {
    items = (await getActiveProducts()).map((p) => {
      const view = toProductView(p);
      return {
        slug: view.slug,
        name: view.name,
        sizeLabel: view.sizeLabel,
        code: p.code || CATALOGUE_CODES[catalogueSlug(view) ?? ""] || "",
        category: view.category ?? "",
        img: displayImage(view),
      };
    });
  } catch (error) {
    // The form still works without the list: pieces can be typed by name or code.
    console.error("[bulk-orders] products not loaded:", error);
  }
  const kind = first(params.type) === "custom" ? "custom" : "bulk";
  const start = first(params.product).toLowerCase();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: TITLE,
    url: URL,
    description: DESCRIPTION,
    about: { "@type": "Organization", name: "Mudkraft", url: SITE_URL },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <BulkOrdersPage items={items} initialKind={kind} startSlug={start} />
    </>
  );
}
