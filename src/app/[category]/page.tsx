import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SortableFamilyGrid } from "@/app/home-page";
import { TrustStrip } from "@/components/TrustStrip";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { ARTICLES } from "@/lib/articles";
import { CATEGORY_PAGES, categoryBySlug } from "@/lib/categories";
import { withDelivery } from "@/lib/delivery";
import { keywordsFor } from "@/lib/keywords";
import { formatPaise } from "@/lib/money";
import { groupFamilies, toProductView } from "@/lib/product-view";
import { OG_IMAGE, SITE_URL } from "@/lib/seo";
import { getDeliveryTerms } from "@/server/store/delivery";
import { getActiveProducts } from "@/server/store/products";

/** Prices and stock come from Bikriup, so these pages are built on each visit like the home page. */
export const dynamic = "force-dynamic";

async function load(slug: string) {
  const page = categoryBySlug(slug);
  if (!page) return null;
  const [allProducts, delivery] = await Promise.all([getActiveProducts(), getDeliveryTerms()]);
  const all = allProducts.map(toProductView);
  const products = all.filter(page.match);
  const cheapest = products.reduce<number | null>(
    (low, p) => (low === null || p.pricePaise < low ? p.pricePaise : low),
    null,
  );
  // One tile per category that has something on its shelf, pictured by its first piece.
  const tiles = CATEGORY_PAGES.map((c) => {
    const shelf = all.filter(c.match);
    const cover = shelf.find((p) => p.cutout || p.img);
    return { slug: c.slug, label: c.label, count: groupFamilies(shelf).length, cover };
  }).filter((t) => t.count > 0);
  // The delivery answer follows Bikriup's delivery setting; the rest of the copy is as written.
  const faqs = page.faqs.map((f) => ({ q: f.q, a: withDelivery(f.a, delivery) }));
  return { page, products, tiles, faqs, from: cheapest === null ? "" : formatPaise(cheapest) };
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
    keywords: keywordsFor(`/${data.page.slug}`),
    alternates: { canonical: url },
    openGraph: { title: data.page.title, description, type: "website", url, siteName: "Mudkraft", images: [OG_IMAGE] },
    twitter: { card: "summary_large_image", title: data.page.title, description, images: [OG_IMAGE] },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const data = await load((await params).category);
  if (!data || data.products.length === 0) notFound();
  const { page, products, faqs } = data;
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
        mainEntity: faqs.map((f) => ({
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

        {data.tiles.length > 1 && (
          <nav aria-label="Shop by category" className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {data.tiles.map((t) => {
              const on = t.slug === page.slug;
              const src = t.cover ? (t.cover.cutout ?? t.cover.img) : null;
              return (
                <Link
                  key={t.slug}
                  href={`/${t.slug}`}
                  aria-current={on ? "page" : undefined}
                  className={`flex items-center gap-4 rounded-3xl border p-2.5 pr-5 transition-colors ${
                    on ? "border-earth bg-earth text-cream" : "border-border bg-[oklch(0.985_0.008_75)] text-earth hover:border-clay"
                  }`}
                >
                  <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-sand">
                    {src && (
                      <img
                        src={src}
                        alt={`${t.label}: handmade clay by Mudkraft`}
                        loading="lazy"
                        className={`h-12 w-12 object-contain ${src === t.cover?.cutout ? "" : "mix-blend-multiply brightness-[1.06]"}`}
                      />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-display text-2xl leading-none">{t.label}</span>
                    <span className={`text-xs ${on ? "text-cream/70" : "text-muted-foreground"}`}>
                      {t.count} {t.count === 1 ? "piece" : "pieces"}
                    </span>
                  </span>
                </Link>
              );
            })}
          </nav>
        )}

        <section aria-label={page.label} className="mt-10">
          <SortableFamilyGrid families={families} />
          <TrustStrip className="mt-10" />
        </section>

        <section className="mt-20 max-w-3xl">
          <h2 className="font-display text-3xl text-earth md:text-4xl">Questions, answered</h2>
          <div className="mt-6 divide-y divide-border border-y border-border">
            {faqs.map((f) => (
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
          {ARTICLES.slice(0, 4).map((a) => (
            <Link key={a.href} href={a.href} className="text-earth underline-offset-4 hover:text-clay hover:underline">
              {a.title}
            </Link>
          ))}
          <Link href="/soil-report" className="text-earth underline-offset-4 hover:text-clay hover:underline">
            Lab report
          </Link>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
