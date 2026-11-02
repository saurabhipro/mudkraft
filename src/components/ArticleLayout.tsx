import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { ARTICLES } from "@/lib/articles";
import { breadcrumbs } from "@/lib/schema";
import { OG_IMAGE, SITE_URL } from "@/lib/seo";

export interface ArticleFaq {
  q: string;
  a: string;
}

/** Page metadata for a guide: the title and description double as the search snippet. */
export function articleMetadata(href: string, title: string, description: string): Metadata {
  const url = `${SITE_URL}${href}`;
  return {
    title: { absolute: `${title} | Mudkraft` },
    description,
    alternates: { canonical: url },
    openGraph: { title, description, type: "article", url, siteName: "Mudkraft", images: [OG_IMAGE] },
    twitter: { card: "summary_large_image", title, description, images: [OG_IMAGE] },
  };
}

export const H2 = ({ children }: { children: ReactNode }) => (
  <h2 className="mt-12 font-display text-3xl text-earth md:text-4xl">{children}</h2>
);
export const P = ({ children }: { children: ReactNode }) => (
  <p className="mt-4 text-[1.0625rem] leading-relaxed text-foreground/85">{children}</p>
);
export const UL = ({ children }: { children: ReactNode }) => (
  <ul className="mt-4 list-disc space-y-2 pl-6 text-[1.0625rem] leading-relaxed text-foreground/85">{children}</ul>
);
export const A = ({ href, children }: { href: string; children: ReactNode }) => (
  <Link href={href} className="text-clay-deep underline underline-offset-2 hover:text-earth">
    {children}
  </Link>
);

export function ArticleLayout({
  href,
  title,
  description,
  date,
  intro,
  faqs = [],
  shop,
  children,
}: {
  href: string;
  title: string;
  description: string;
  date: string;
  intro: string;
  faqs?: ArticleFaq[];
  /** The category page this guide leads to. */
  shop: { href: string; label: string };
  children: ReactNode;
}) {
  const url = `${SITE_URL}${href}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: title,
        description,
        datePublished: date,
        dateModified: date,
        mainEntityOfPage: url,
        image: OG_IMAGE,
        author: { "@type": "Organization", name: "Mudkraft" },
        publisher: {
          "@type": "Organization",
          name: "Mudkraft",
          logo: { "@type": "ImageObject", url: `${SITE_URL}/mudkraft-logo.png` },
        },
      },
      breadcrumbs([
        { name: "Home", url: `${SITE_URL}/` },
        { name: "Journal", url: `${SITE_URL}/journal` },
        { name: title, url },
      ]),
      ...(faqs.length
        ? [
            {
              "@type": "FAQPage",
              mainEntity: faqs.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            },
          ]
        : []),
    ],
  };
  const more = ARTICLES.filter((a) => a.href !== href).slice(0, 3);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />
      <article className="mx-auto max-w-3xl px-6 pb-16 pt-28 md:pt-32">
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
          <Link href="/" className="hover:text-clay">Home</Link>
          <span aria-hidden="true"> / </span>
          <Link href="/journal" className="hover:text-clay">Journal</Link>
        </nav>
        <h1 className="mt-5 font-display text-4xl leading-[1.05] text-earth text-balance md:text-6xl">{title}</h1>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{intro}</p>
        <p className="mt-3 text-xs uppercase tracking-[0.2em] text-clay-deep">
          By Mudkraft · <time dateTime={date}>{new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</time>
        </p>

        {children}

        {faqs.length > 0 && (
          <section className="mt-14">
            <H2>Quick answers</H2>
            <div className="mt-6 divide-y divide-border border-y border-border">
              {faqs.map((f) => (
                <details key={f.q} className="py-4">
                  <summary className="cursor-pointer list-none font-medium text-earth marker:hidden">{f.q}</summary>
                  <p className="mt-3 leading-relaxed text-foreground/80">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        <div className="mt-14 rounded-3xl bg-sand p-8 text-center">
          <p className="font-display text-2xl text-earth">Ready to cook in clay?</p>
          <Link
            href={shop.href}
            className="mt-5 inline-block rounded-full bg-earth px-8 py-4 text-sm uppercase tracking-widest text-cream transition-colors hover:bg-clay"
          >
            Shop {shop.label.toLowerCase()}
          </Link>
        </div>

        <section className="mt-14">
          <p className="text-xs uppercase tracking-[0.25em] text-clay">Keep reading</p>
          <ul className="mt-4 space-y-3">
            {more.map((a) => (
              <li key={a.href}>
                <Link href={a.href} className="font-display text-xl text-earth underline-offset-4 hover:text-clay hover:underline">
                  {a.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </article>
      <SiteFooter />
    </div>
  );
}
