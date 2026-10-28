import type { Metadata } from "next";
import Link from "next/link";

import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { OG_IMAGE, SITE_URL } from "@/lib/seo";
import alkalineImg from "@/assets/benefit-alkaline.jpg";
import mineralsImg from "@/assets/benefit-minerals.jpg";
import coolingImg from "@/assets/benefit-cooling.jpg";
import nutrientsImg from "@/assets/benefit-nutrients.jpg";

const URL = `${SITE_URL}/benefits`;
const TITLE = "Benefits of Earthen Clay Pots — Alkaline Water, Nutrients & Natural Cooling | Mudkraft";
const DESCRIPTION =
  "Discover the health benefits of drinking and cooking in unglazed clay pots — naturally alkaline water, preserved nutrients, gentle mineral enrichment, and electricity-free cooling. A slow guide from Mudkraft.";

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

const COMPARE_COLUMNS = ["Taste", "Minerals", "Temperature", "Footprint"];

const COMPARE_ROWS = [
  {
    name: "Clay matka",
    ours: true,
    cells: ["Alkaline, gentle", "Natural iron, Mg, Ca", "Naturally cool", "Zero plastic, zero power"],
  },
  {
    name: "Plastic bottle",
    ours: false,
    cells: ["Acidic", "None", "Warms in the sun", "Can leach microplastics"],
  },
  {
    name: "Steel, from fridge",
    ours: false,
    cells: ["Ice-cold", "None", "Harsh on the throat", "Needs electricity"],
  },
];

type Benefit = {
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
  image: string;
  alt: string;
};

const BENEFITS: Benefit[] = [
  {
    eyebrow: "01 — Water",
    title: "Naturally alkaline water",
    body:
      "Clay is faintly alkaline. As water rests inside an unglazed matka, its pH lifts gently — softening the sharp acidity of tap water and calming the gut. What you sip in the morning is water the way rivers meant it to be.",
    points: [
      "Balances the body's pH after sleep and meals",
      "Eases acidity, heartburn and bloating",
      "Tastes rounder, sweeter — never metallic",
    ],
    image: alkalineImg.src,
    alt: "Overhead view of clear water resting inside a terracotta matka in warm morning light",
  },
  {
    eyebrow: "02 — Minerals",
    title: "Trace minerals from the earth",
    body:
      "As water seeps slowly through the pot's micro-porous walls, it picks up small, natural amounts of iron, magnesium and calcium from the river clay. A soft mineralisation — nothing added, nothing stripped.",
    points: [
      "Iron & magnesium from Ganges-plain silt",
      "No chlorine aftertaste, no plastic leaching",
      "The pot literally gives back to the water",
    ],
    image: mineralsImg.src,
    alt: "Macro close-up of porous terracotta wall showing tiny channels in warm red-brown clay",
  },
  {
    eyebrow: "03 — Cooling",
    title: "Cool water without electricity",
    body:
      "Thousands of tiny pores let a whisper of water evaporate through the pot's skin. That evaporation cools the vessel from within — 8 to 12 °C below room temperature, without the harsh chill of a fridge that shocks the throat.",
    points: [
      "Ayurveda-friendly — kind to throat, lungs, teeth",
      "No refrigerator, no power, no plastic bottle",
      "Perfect for Indian summers — the old way",
    ],
    image: coolingImg.src,
    alt: "Hands pouring cool water from a clay bottle into a small clay cup in a warm Indian kitchen",
  },
  {
    eyebrow: "04 — Nutrients",
    title: "Nutrients preserved in slow cooking",
    body:
      "A handi cooks the way grandmothers cook — low, slow, and even. Clay holds heat gently and lets steam breathe through its walls, so vitamins, minerals and delicate flavours stay in the food, not lost to a hot metal pan.",
    points: [
      "Retains B-vitamins, iron and moisture in dals & rice",
      "Needs 30–40% less oil than metal cookware",
      "Alkaline clay balances the acidity of tomato & tamarind curries",
    ],
    image: nutrientsImg.src,
    alt: "A terracotta handi cooking dal on a low blue flame, gentle steam rising",
  },
];

export default function BenefitsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main className="pt-28">
        {/* Hero */}
        <section className="max-w-5xl mx-auto px-6 md:px-10 pt-10 md:pt-16 pb-16 text-center">
          <p className="text-xs tracking-[0.4em] uppercase text-clay mb-6">— why clay</p>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-display text-earth leading-[1.05] text-balance">
            The quiet gifts of an <span className="italic">earthen pot</span>.
          </h1>
          <p className="mt-8 max-w-2xl mx-auto text-base md:text-lg text-muted-foreground leading-relaxed">
            For two thousand summers, Indian kitchens have kept their water and cooked their meals in
            unglazed clay. Modern labs are only now catching up with what our grandmothers already knew —
            that the pot itself is part of the recipe.
          </p>
        </section>

        {/* Alternating benefit sections */}
        <section className="pb-24">
          <div className="max-w-6xl mx-auto px-6 md:px-10 space-y-24 md:space-y-32">
            {BENEFITS.map((b, i) => (
              <article
                key={b.title}
                className={`grid md:grid-cols-2 gap-10 md:gap-16 items-center ${
                  i % 2 === 1 ? "md:[&>div:first-child]:order-2" : ""
                }`}
              >
                <div className="relative">
                  <div
                    className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl"
                    style={{ boxShadow: "0 30px 60px -20px rgba(107, 60, 35, 0.35)" }}
                  >
                    <img
                      src={b.image}
                      alt={b.alt}
                      loading="lazy"
                      width={1024}
                      height={1280}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 ring-1 ring-inset ring-earth/10 rounded-2xl pointer-events-none" />
                  </div>
                  <div className="absolute -top-4 -left-4 w-16 h-16 rounded-full bg-gold/20 blur-2xl -z-10" />
                </div>

                <div>
                  <p className="text-xs tracking-[0.4em] uppercase text-clay mb-5">{b.eyebrow}</p>
                  <h2 className="text-3xl md:text-5xl font-display text-earth leading-tight text-balance">
                    {b.title}
                  </h2>
                  <p className="mt-6 text-muted-foreground text-lg leading-relaxed">{b.body}</p>
                  <ul className="mt-8 space-y-3">
                    {b.points.map((p) => (
                      <li key={p} className="flex gap-3 text-foreground/90">
                        <span
                          className="mt-2.5 h-1.5 w-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: "var(--clay)" }}
                        />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Comparison table, as on page 3 of the catalogue */}
        <section className="bg-earth text-cream py-20 md:py-24 px-6 md:px-10">
          <div className="max-w-6xl mx-auto">
            <p className="text-[11px] tracking-[0.32em] uppercase text-gold">At a glance</p>
            <h2 className="mt-3 font-display font-normal text-[clamp(2.25rem,4.6vw,3.75rem)]">
              Earthen clay <em className="text-gold">vs. the rest</em>
            </h2>
            <div className="mt-10 overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-[15px]">
                <thead>
                  <tr className="border-b border-gold/60">
                    <th scope="col" className="w-[22%]">
                      <span className="sr-only">Vessel</span>
                    </th>
                    {COMPARE_COLUMNS.map((c) => (
                      <th
                        key={c}
                        scope="col"
                        className="px-4 py-3.5 text-left text-[11px] font-medium tracking-[0.24em] uppercase text-cream/70"
                      >
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMPARE_ROWS.map((r) => (
                    <tr key={r.name} className={`border-b border-cream/15 ${r.ours ? "bg-gold/[0.08]" : ""}`}>
                      <th
                        scope="row"
                        className={`py-5 pl-3 pr-4 text-left font-display font-normal text-[1.65rem] ${r.ours ? "text-gold" : "text-cream/75"}`}
                      >
                        {r.name}
                      </th>
                      {r.cells.map((cell, i) => (
                        <td key={i} className={`px-4 py-5 ${r.ours ? "text-cream" : "text-cream/70"}`}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-6 md:px-10 text-center">
          <p className="font-hand text-2xl md:text-3xl text-clay mb-8">
            One good matka, one small ritual — and your water tastes like the river again.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/#collection"
              className="inline-block bg-earth text-cream px-8 py-4 rounded-full text-sm tracking-widest uppercase hover:bg-clay transition-colors"
            >
              Shop the collection
            </Link>
            <Link
              href="/journal/benefits-of-clay-water-pots"
              className="inline-block border border-earth/30 text-earth px-8 py-4 rounded-full text-sm tracking-widest uppercase hover:bg-earth hover:text-cream transition-colors"
            >
              Read the full journal
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
