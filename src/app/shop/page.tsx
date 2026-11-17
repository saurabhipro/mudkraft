import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { TrustStrip } from "@/components/TrustStrip";
import { CATEGORY_PAGES, DELIVERY_Q, FLAME_Q, SAFE_Q, SEASON_Q } from "@/lib/categories";
import { formatPaise } from "@/lib/money";
import { groupFamilies, toProductView } from "@/lib/product-view";
import { OG_IMAGE, SITE_URL } from "@/lib/seo";
import { getActiveProducts } from "@/server/store/products";

import { ShopGrid } from "./shop-grid";

/** Prices, stock and photos come from Bikriup, so the shelf is built on each visit like the home page. */
export const dynamic = "force-dynamic";

const URL = `${SITE_URL}/shop`;
const TITLE = "Shop All Clay Cookware & Serveware Online | Mudkraft";
const FAQS = [SAFE_Q, FLAME_Q, SEASON_Q, DELIVERY_Q];

/** Short buying guide: what to cook in, by dish. Names are matched to live products for the links. */
const GUIDE: Array<{ dish: string; text: string; picks: string[] }> = [
  {
    dish: "Dal, rice & biryani",
    text: "Deep walls hold heat gently, so slow dishes simmer evenly.",
    picks: ["Handi", "Bhagona"],
  },
  {
    dish: "Sabzi & curries",
    text: "Wide and shallow for stirring and finishing at the table.",
    picks: ["Kadhai"],
  },
  {
    dish: "Rotis & roasting",
    text: "For rotis, papad and bhutta with a kiln-warm edge.",
    picks: ["Roaster"],
  },
  {
    dish: "Curd & chai",
    text: "Thick home-set curd, and chai or lassi the old way.",
    picks: ["Dahi Handi", "Kullad"],
  },
  {
    dish: "Cool water",
    text: "Clay breathes, so water cools without electricity.",
    picks: ["Water Cooler", "Matka"],
  },
];

async function load() {
  const products = (await getActiveProducts()).map(toProductView);
  const cheapest = products.reduce<number | null>(
    (low, p) => (low === null || p.pricePaise < low ? p.pricePaise : low),
    null,
  );
  return { products, from: cheapest === null ? "" : formatPaise(cheapest) };
}

const describe = (from: string) =>
  `Shop every handmade unglazed clay piece from Mudkraft: handi, kadhai, dahi handi, kullads and water coolers.${from ? ` From ${from}.` : ""} Wood-fired in Khurja, lab-tested. Delivery across India.`;

export async function generateMetadata(): Promise<Metadata> {
  const { from } = await load();
  const description = describe(from);
  return {
    title: { absolute: TITLE },
    description,
    alternates: { canonical: URL },
    openGraph: {
      title: TITLE,
      description,
      type: "website",
      url: URL,
      siteName: "Mudkraft",
      images: [OG_IMAGE],
    },
    twitter: { card: "summary_large_image", title: TITLE, description, images: [OG_IMAGE] },
  };
}

export default async function ShopPage() {
  const { products, from } = await load();
  const families = groupFamilies(products);

  // Link a guide pick to the first live product whose name starts with it; picks not on sale are dropped.
  const linkFor = (pick: string) => {
    const p = products.find((x) => x.name.toLowerCase().startsWith(pick.toLowerCase()));
    return p ? { label: pick, href: `/shop/${p.slug}` } : null;
  };
  const guide = GUIDE.map((g) => ({
    ...g,
    links: g.picks.map(linkFor).filter((l) => l !== null),
  })).filter((g) => g.links.length > 0);
  const seeAlso = CATEGORY_PAGES.filter((c) => products.some(c.match));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: "Shop all",
        url: URL,
        description: describe(from),
        isPartOf: { "@type": "WebSite", name: "Mudkraft", url: SITE_URL },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "Shop", item: URL },
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
        mainEntity: FAQS.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-6 pb-16 pt-28 md:px-10">
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
          <Link href="/" className="hover:text-clay">
            Home
          </Link>
          <span aria-hidden="true"> / </span>
          <span className="text-earth">Shop</span>
        </nav>

        <h1 className="mt-5 max-w-4xl font-display text-4xl leading-[1.05] text-earth text-balance md:text-6xl">
          Shop All: Handmade Clay Cookware, Serveware &amp; Water Pots
        </h1>
        <div className="mt-6 max-w-2xl space-y-4 text-base leading-relaxed text-foreground/80 md:text-lg">
          <p>
            Every piece on this page is thrown by hand from river clay in Khurja, dried in the sun
            and fired in a wood kiln for 48 hours. There is no glaze and no paint, so your food and
            water only ever touch fired clay.
          </p>
          <p>
            Filter by what you need below: a handi or kadhai for the stove, a dahi handi or kullads
            for the table, or a water cooler for the summer. Our clay was lab-tested for lead,
            cadmium and arsenic, and none was found.
          </p>
        </div>

        {families.length > 0 ? (
          <>
            <ShopGrid families={families} />
            <TrustStrip className="mt-10" />
          </>
        ) : (
          <p className="mt-10 rounded-3xl border border-border bg-[oklch(0.985_0.008_75)] p-8 font-hand text-2xl text-clay-deep">
            The kiln is cooling. New pieces are on their way, please check back soon.
          </p>
        )}

        {guide.length > 0 && (
          <section className="mt-20 flex flex-wrap gap-10">
            <div className="min-w-0 flex-[1_1_320px]">
              <p className="text-xs uppercase tracking-[0.25em] text-clay">
                Not sure where to start?
              </p>
              <h2 className="mt-3 font-display text-4xl leading-[1.08] text-earth">
                Choose by what you cook
              </h2>
              <p className="mt-4 font-hand text-2xl text-clay-deep">
                shaped by hand, held by earth
              </p>
            </div>
            <dl className="min-w-0 flex-[2_1_560px] border-t border-border">
              {guide.map((g) => (
                <div
                  key={g.dish}
                  className="flex flex-wrap gap-x-6 gap-y-2 border-b border-border py-[18px]"
                >
                  <dt className="basis-[200px] font-display text-2xl text-earth">{g.dish}</dt>
                  <dd className="min-w-0 flex-[1_1_280px] leading-relaxed text-foreground/80">
                    {g.links.map((l, i) => (
                      <span key={l.href}>
                        {i > 0 && " or "}
                        <Link
                          href={l.href}
                          className="text-earth underline underline-offset-4 hover:text-clay-deep"
                        >
                          {l.label}
                        </Link>
                      </span>
                    ))}
                    {". "}
                    {g.text}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <section className="mt-20 max-w-3xl">
          <h2 className="font-display text-3xl text-earth md:text-4xl">Questions, answered</h2>
          <div className="mt-6 divide-y divide-border border-y border-border">
            {FAQS.map((f) => (
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
          {seeAlso.map((c) => (
            <Link
              key={c.slug}
              href={`/${c.slug}`}
              className="text-earth underline-offset-4 hover:text-clay hover:underline"
            >
              {c.label}
            </Link>
          ))}
          <Link
            href="/care/season-your-handi"
            className="text-earth underline-offset-4 hover:text-clay hover:underline"
          >
            Care guide
          </Link>
          <Link
            href="/soil-report"
            className="text-earth underline-offset-4 hover:text-clay hover:underline"
          >
            Lab report
          </Link>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
