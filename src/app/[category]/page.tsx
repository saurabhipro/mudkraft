import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { FamilyCard } from "@/app/home-page";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { CATEGORY_PAGES, categoryBySlug } from "@/lib/categories";
import { formatPaise } from "@/lib/money";
import { groupFamilies, toProductView } from "@/lib/product-view";
import { OG_IMAGE, SITE_URL } from "@/lib/seo";
import { getActiveProducts } from "@/server/store/products";

/** Prices and stock come from Bikriup, so these pages are built on each visit like the home page. */
export const dynamic = "force-dynamic";

async function load(slug: string) {
  const page = categoryBySlug(slug);
  if (!page) return null;
  const products = (await getActiveProducts()).map(toProductView).filter(page.match);
  const cheapest = products.reduce<number | null>(
    (low, p) => (low === null || p.pricePaise < low ? p.pricePaise : low),
    null,
  );
  return { page, products, from: cheapest === null ? "" : formatPaise(cheapest) };
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const data = await load((await params).category);
  // Nothing to sell here yet: keep the page out of the index rather than list an empty shelf.
  if (!data || data.products.length === 0) return { title: "Not found — Mudkraft", robots: { index: false } };
  const url = `${SITE_URL}/${data.page.slug}`;
  const description = data.page.description(data.from);
  return {
    title: { absolute: data.page.title },
    description,
    alternates: { canonical: url },
    openGraph: { title: data.page.title, description, type: "website", url, siteName: "Mudkraft", images: [OG_IMAGE] },
    twitter: { card: "summary_large_image", title: data.page.title, description, images: [OG_IMAGE] },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const data = await load((await params).category);
  if (!data || data.products.length === 0) notFound();
  const { page, products } = data;
  const families = groupFamilies(products);
  const url = `${SITE_URL}/${page.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: page.h1,
        url,
        description: page.description(data.from),
        isPartOf: { "@type": "WebSite", name: "Mudkraft", url: SITE_URL },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: page.label, item: url },
        ],
      },
      {
        "@type": "ItemList",
        itemListElement: products.map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `${SITE_URL}/shop/${p.slug}`,
          name: `${p.name} ${p.sizeLabel}`.trim(),
        })),
      },
      {
        "@type": "FAQPage",
        mainEntity: page.faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  const others = CATEGORY_PAGES.filter((c) => c.slug !== page.slug);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-6 pb-16 pt-28 md:px-10">
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
          <Link href="/" className="hover:text-clay">Home</Link>
          <span aria-hidden="true"> / </span>
          <span className="text-earth">{page.label}</span>
        </nav>

        <h1 className="mt-5 max-w-4xl font-display text-4xl leading-[1.05] text-earth text-balance md:text-6xl">
          {page.h1}
        </h1>
        <div className="mt-6 max-w-2xl space-y-4 text-base leading-relaxed text-foreground/80 md:text-lg">
          {page.intro.map((para) => (
            <p key={para}>{para}</p>
          ))}
        </div>

        <section aria-label={page.label} className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {families.map((f) => (
            <FamilyCard key={f.key} family={f} />
          ))}
        </section>

        <section className="mt-20 max-w-3xl">
          <h2 className="font-display text-3xl text-earth md:text-4xl">Questions, answered</h2>
          <div className="mt-6 divide-y divide-border border-y border-border">
            {page.faqs.map((f) => (
              <details key={f.q} className="group py-4">
                <summary className="cursor-pointer list-none font-medium text-earth marker:hidden">
                  {f.q}
                </summary>
                <p className="mt-3 leading-relaxed text-foreground/80">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-16 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
          <span className="text-xs uppercase tracking-[0.25em] text-clay">Also see</span>
          {others.map((c) => (
            <Link key={c.slug} href={`/${c.slug}`} className="text-earth underline-offset-4 hover:text-clay hover:underline">
              {c.label}
            </Link>
          ))}
          <Link href="/care/season-your-handi" className="text-earth underline-offset-4 hover:text-clay hover:underline">
            How to season a clay handi
          </Link>
          <Link href="/soil-report" className="text-earth underline-offset-4 hover:text-clay hover:underline">
            Lab report
          </Link>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
