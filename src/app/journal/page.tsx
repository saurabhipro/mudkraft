import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { ARTICLES } from "@/lib/articles";
import { breadcrumbs } from "@/lib/schema";
import { OG_IMAGE, SITE_URL } from "@/lib/seo";

const TITLE = "Journal: Clay Cooking Guides and Care Advice";
const DESCRIPTION =
  "Plain guides to cooking and storing water in clay: is it safe, clay vs steel, how to season a handi, and how to choose mitti ke bartan.";

export const metadata: Metadata = {
  title: { absolute: `${TITLE} | Mudkraft` },
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/journal` },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website", url: `${SITE_URL}/journal`, siteName: "Mudkraft", images: [OG_IMAGE] },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: [OG_IMAGE] },
};

export default function JournalPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "CollectionPage", name: "Mudkraft Journal", url: `${SITE_URL}/journal`, description: DESCRIPTION },
      breadcrumbs([
        { name: "Home", url: `${SITE_URL}/` },
        { name: "Journal", url: `${SITE_URL}/journal` },
      ]),
      {
        "@type": "ItemList",
        itemListElement: ARTICLES.map((a, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}${a.href}`, name: a.title })),
      },
    ],
  };
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 pb-16 pt-28 md:pt-32">
        <p className="text-xs uppercase tracking-[0.4em] text-clay">— journal</p>
        <h1 className="mt-5 font-display text-4xl leading-[1.05] text-earth text-balance md:text-6xl">
          Cooking in clay, <span className="italic">explained.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Straight answers about safety, care and choosing the right pot, from the studio that makes them.
        </p>
        <ul className="mt-12 divide-y divide-border border-y border-border">
          {ARTICLES.map((a) => (
            <li key={a.href}>
              <Link href={a.href} className="group block py-7">
                <h2 className="font-display text-2xl text-earth transition-colors group-hover:text-clay md:text-3xl">{a.title}</h2>
                <p className="mt-2 max-w-2xl leading-relaxed text-foreground/75">{a.description}</p>
                <span className="mt-3 inline-block text-xs uppercase tracking-[0.2em] text-clay-deep">Read →</span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter />
    </div>
  );
}
