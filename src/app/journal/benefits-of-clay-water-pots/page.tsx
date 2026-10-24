import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/SiteFooter";
import { OG_IMAGE, SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/journal/benefits-of-clay-water-pots`;
const TITLE = "Benefits of Matka Water & How to Season a Clay Pot — Mudkraft";
const DESCRIPTION =
  "A slow guide to drinking water from an earthen pot — the natural cooling, mineral alkalinity, and gut-friendly benefits of matka water, plus how to season and clean a new clay pot without soap.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "article",
    url: URL,
    images: [OG_IMAGE],
  },
  twitter: { card: "summary_large_image", images: [OG_IMAGE] },
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Benefits of Matka Water & How to Season a Clay Pot",
  description: DESCRIPTION,
  author: { "@type": "Organization", name: "Mudkraft" },
  publisher: {
    "@type": "Organization",
    name: "Mudkraft",
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/favicon.ico`,
    },
  },
  mainEntityOfPage: URL,
};

export default function ArticlePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <header className="border-b border-border/40">
        <nav className="max-w-3xl mx-auto flex items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-3">
            <span className="text-3xl sm:text-4xl md:text-6xl font-display text-earth leading-none tracking-tight"><span className="italic">Mudkraft</span></span>
          </Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-clay">← Back</Link>
        </nav>
      </header>

      <article className="max-w-3xl mx-auto px-6 py-20">
        <p className="text-xs tracking-[0.4em] uppercase text-clay mb-6">— journal</p>
        <h1 className="text-4xl md:text-6xl font-display text-earth leading-[1.05] text-balance">
          The quiet benefits of <span className="italic">matka water</span>, and how to season a new clay pot.
        </h1>
        <p className="mt-6 text-lg text-muted-foreground">
          For centuries, Indian households have kept their drinking water in earthen pots — matkas and surahis
          thrown from river clay. Modern labs are only now catching up with what our grandmothers already knew.
        </p>

        <section className="prose prose-lg mt-14 max-w-none text-foreground space-y-6">
          <h2 className="text-3xl font-display text-earth mt-12">Why water tastes different from a matka</h2>
          <p>
            Unglazed terracotta is <em>micro-porous</em>. Thousands of tiny channels let water seep
            slowly through the wall, evaporate on the outside, and cool the vessel from within — a natural,
            electricity-free refrigeration. Water inside a matka typically sits 8–12 °C below room temperature,
            without the harsh chill of a fridge that can shock the throat and slow digestion.
          </p>

          <h2 className="text-3xl font-display text-earth mt-12">The health benefits of drinking earthen-pot water</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Naturally alkaline.</strong> Clay is slightly alkaline; it gently raises the pH of the water,
              which helps balance acidity and soothe the gut.
            </li>
            <li>
              <strong>Trace minerals.</strong> As water passes through the pot&apos;s walls, it picks up small amounts
              of iron, magnesium and calcium from the clay — a mild, natural mineralisation.
            </li>
            <li>
              <strong>Gentle on the throat.</strong> Cool but never icy — matka water is often recommended
              in Ayurveda for people with sensitive throats, asthma, or a slow metabolism.
            </li>
            <li>
              <strong>No plastic leaching.</strong> Unlike plastic bottles left in the sun, an earthen pot
              adds nothing chemical to the water.
            </li>
            <li>
              <strong>Better for the planet.</strong> No refrigeration, no plastic, and at the end of its life,
              a clay pot simply returns to the earth.
            </li>
          </ul>

          <h2 className="text-3xl font-display text-earth mt-12">How to season a new clay pot</h2>
          <p>
            A brand new matka carries the scent of the kiln. Season it once, and it will serve you for years.
          </p>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Rinse the pot inside and out with plain water — no soap, ever.</li>
            <li>Fill it fully with clean water and let it stand for 24 hours. Some water will seep out; that is the pot breathing awake.</li>
            <li>Discard this first water. Refill, and let it stand another 12 hours. Discard again.</li>
            <li>From the third fill onwards, the water is ready to drink — cool, sweet, faintly earthy.</li>
          </ol>

          <h2 className="text-3xl font-display text-earth mt-12">Daily care — cleaning a clay pot without soap</h2>
          <p>
            Detergents seep into the pores of terracotta and taint every future fill. Clean it the old way:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Empty the pot every 2–3 days.</li>
            <li>Scrub the inside with a soft brush or a lemon half dipped in coarse salt.</li>
            <li>Rinse well with plain water and let it sun-dry for an hour before refilling.</li>
            <li>Once a month, rinse with warm water and a spoonful of baking soda; rinse again with plain water.</li>
          </ul>

          <h2 className="text-3xl font-display text-earth mt-12">Where to keep your matka</h2>
          <p>
            Set the pot on a small stand, off the floor, in a cool corner with some airflow. The evaporation
            that keeps the water cool needs breath around the pot. Avoid direct sunlight — a shaded
            kitchen shelf or a corner of the balcony is ideal.
          </p>

          <p className="mt-12 font-hand text-2xl text-clay">
            One good matka, one small ritual — and your water tastes like the river again.
          </p>
        </section>

        <div className="mt-16 border-t border-border pt-10 text-center">
          <Link
            href="/#collection"
            className="inline-block bg-earth text-cream px-8 py-4 rounded-full text-sm tracking-widest uppercase hover:bg-clay transition-colors"
          >
            Shop the matka collection
          </Link>
        </div>
      </article>
      <SiteFooter />
    </div>
  );
}
