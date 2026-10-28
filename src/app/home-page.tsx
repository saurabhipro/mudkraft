"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";

import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { HeroPieces } from "@/components/HeroPieces";
import handsClay from "@/assets/hands-clay.jpg";
import potsDrying from "@/assets/pots-drying.jpg";
import benefitCooling from "@/assets/benefit-cooling.jpg";
import benefitMinerals from "@/assets/benefit-minerals.jpg";
import benefitNutrients from "@/assets/benefit-nutrients.jpg";
import studentPottery from "@/assets/student-pottery.jpg";
import { formatPaise } from "@/lib/money";
import {
  displayImage,
  groupFamilies,
  variantLabel,
  type ProductFamily,
  type ProductView,
} from "@/lib/product-view";
import {
  useCart,
  addToCart as addToCartStore,
  updateQty as updateQtyStore,
  removeItem as removeItemStore,
} from "@/lib/cart";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { whatsappLink } from "@/lib/whatsapp";
import { VideoCard } from "@/components/VideoCard";
import { type YouTubeVideo } from "@/lib/youtube";

const TAPE_FRONT = ["River clay", "Wood fired", "Hand thrown", "Slow made"];
const TAPE_BACK = ["earth born", "seven generations", "no moulds", "no machines"];

const ELEMENTS = [
  {
    n: "01",
    title: "Earth",
    body: "River clay, cleaned and kneaded until it is soft and even.",
    accent: "text-sage",
    dot: "bg-sage",
  },
  {
    n: "02",
    title: "Water",
    body: "Thrown on the wheel by wet hands — no moulds, no machines.",
    accent: "text-clay",
    dot: "bg-clay",
  },
  {
    n: "03",
    title: "Fire",
    body: "Forty-eight hours in a slow wood kiln.",
    accent: "text-ember",
    dot: "bg-ember",
    dark: true,
  },
  {
    n: "04",
    title: "Time",
    body: "Dried under sky, then checked and packed by hand for its journey to you.",
    accent: "text-[oklch(0.55_0.1_75)]",
    dot: "bg-gold",
  },
];

// From the printed catalogue (page 2).
const STORY_NUMBERS = [
  { value: "7", label: "Generations" },
  { value: "180+", label: "Years at the wheel" },
  { value: "12", label: "Master potters" },
  { value: "48 h", label: "Slow firing" },
];

const RIVER_TO_TABLE = [
  {
    title: "Source",
    body: "Unglazed river clay from a Ganges tributary, dug 1.8–2.4 m below the topsoil and prepared by hand.",
  },
  {
    title: "Throw",
    body: "Shaped on the wheel by one of twelve master potters. No moulds, no machines.",
  },
  {
    title: "Finish",
    body: "Lids and rims fitted and refined by hand, so every handi closes snugly.",
  },
  {
    title: "Fire",
    body: "48 hours in a wood kiln at 920–1040 °C. Slow heat makes a stronger pot.",
  },
];

function Eyebrow({ children, tone = "light" }: { children: string; tone?: "light" | "dark" }) {
  return (
    <div className="flex items-center gap-3.5">
      <span className={`mk-grow block h-px w-12 ${tone === "dark" ? "bg-gold" : "bg-clay-deep"}`} />
      <span
        className={`text-[11px] tracking-[0.32em] uppercase font-medium ${
          tone === "dark" ? "text-gold" : "text-clay-deep"
        }`}
      >
        {children}
      </span>
    </div>
  );
}

function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
      className={`w-4 h-4 ${className}`}
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function HomePage({
  products,
  categories,
  videos,
}: {
  products: ProductView[];
  categories: string[];
  videos: YouTubeVideo[];
}) {
  const cart = useCart();
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [bump, setBump] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  // Every variant of one product type (Handi, Dahi Handi 1.5 L, …) shares a card with a picker.
  const families = groupFamilies(products);
  // Categories come from the database, so a category added in the admin panel
  // appears here without a code change. Empty ones are hidden, and with only one
  // category left there is nothing to filter, so the row disappears.
  const liveCategories = categories.filter((c) => families.some((f) => f.categories.includes(c)));
  const filterOptions = liveCategories.length > 1 ? ["All", ...liveCategories] : [];
  const visibleFamilies =
    activeCategory === "All" ? families : families.filter((f) => f.categories.includes(activeCategory));

  // Adding from the grid confirms with a toast and a bounce on the basket count
  // rather than throwing the drawer open, so browsing isn't interrupted.
  const addToCart = (p: ProductView) => {
    addToCartStore(p);
    timers.current.forEach(clearTimeout);
    setBump(true);
    setToast(`${p.name} ${p.sizeLabel}`.trim());
    timers.current = [
      setTimeout(() => setBump(false), 320),
      setTimeout(() => setToast(null), 2800),
    ];
  };
  const updateQty = (slug: string, delta: number) => updateQtyStore(slug, delta);
  const removeItem = (slug: string) => removeItemStore(slug);

  const totalPaise = cart.reduce((s, x) => s + x.pricePaise * x.qty, 0);
  const count = cart.reduce((s, x) => s + x.qty, 0);
  const whatsappEnquiry = () =>
    whatsappLink(["Namaste Mudkraft 🙏 I'd love to know more about your clay pieces."]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SiteHeader
        cartCount={count}
        onCartOpen={() => setOpen(true)}
        rightSlot={
          <>
            <a
              href={whatsappEnquiry()}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Enquire on WhatsApp"
              className="hidden xl:inline-flex items-center gap-2 text-xs tracking-widest uppercase border border-earth/25 px-4 min-h-[44px] rounded-full text-earth hover:bg-earth hover:text-cream transition-colors duration-500"
            >
              <WhatsAppIcon className="w-4 h-4" />
              Enquire
            </a>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="relative inline-flex items-center gap-2.5 text-xs tracking-widest uppercase bg-earth text-cream pl-5 pr-2 min-h-[44px] rounded-full hover:bg-ink transition-colors"
            >
              Basket
              <span
                className={`inline-flex items-center justify-center min-w-[30px] h-[30px] px-1.5 rounded-full bg-clay text-cream text-[12px] font-medium tracking-normal transition-transform duration-500 ease-[var(--ease-spring)] ${
                  bump ? "scale-[1.35]" : "scale-100"
                }`}
              >
                {count}
              </span>
            </button>
          </>
        }
      />

      {/* HERO — pick a piece on the wheel */}
      <HeroPieces products={products} />

      {/* CROSSED TAPES */}
      <section aria-label="How we make" className="relative h-[170px] md:h-[210px] overflow-hidden">
        <div className="absolute -left-[5%] -right-[5%] top-9 md:top-12 rotate-[2.5deg] bg-earth py-4 md:py-5 overflow-hidden">
          <div className="flex w-max animate-marquee-rev whitespace-nowrap font-display italic text-2xl md:text-3xl text-cream/55">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-12 pr-12" aria-hidden={i > 0}>
                {TAPE_BACK.map((w) => (
                  <span key={w} className="flex gap-12">
                    <span>{w}</span>
                    <span>✦</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="absolute -left-[5%] -right-[5%] top-14 md:top-[70px] -rotate-2 bg-clay py-4 md:py-[22px] overflow-hidden shadow-[0_20px_40px_-20px_oklch(0.42_0.11_38/0.6)]">
          <div className="flex w-max animate-marquee whitespace-nowrap font-display text-[1.75rem] md:text-[2.15rem] text-cream">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-12 pr-12" aria-hidden={i > 0}>
                {TAPE_FRONT.map((w) => (
                  <span key={w} className="flex gap-12">
                    <span>{w}</span>
                    <span className="text-gold">●</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MANIFESTO — lines fill with ink as they scroll past */}
      <section className="px-6 md:px-10 pt-14 md:pt-20">
        <div className="max-w-7xl mx-auto">
          <Eyebrow>Our belief</Eyebrow>
          {/* Two lines on desktop, so the collection follows close behind. */}
          <p className="mt-6 font-display text-[clamp(1.6rem,2.75vw,2.6rem)] leading-[1.18] text-balance lg:text-wrap">
            <span className="mk-ink-fill lg:block">
              Every pot begins as river clay in a potter&rsquo;s hands — and ends as{" "}
            </span>
            <span className="mk-ink-fill lg:block">
              a <em>quiet object</em> that keeps your water cool and your food honest.
            </span>
          </p>
        </div>
      </section>

      {/* COLLECTION */}
      <section id="collection" className="px-6 md:px-10 pt-10 md:pt-12 pb-24 md:pb-32">
        <div className="max-w-7xl mx-auto">
          <h2 className="sr-only">The collection</h2>
          <div className="flex flex-wrap-reverse items-center justify-between gap-x-8 gap-y-4 mb-10 md:mb-12">
            <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-2">
              {filterOptions.map((c) => {
                const n =
                  c === "All" ? families.length : families.filter((f) => f.categories.includes(c)).length;
                const isActive = activeCategory === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setActiveCategory(c)}
                    aria-pressed={isActive}
                    className={`min-h-[44px] px-5 rounded-full border text-[13px] font-medium transition-all duration-400 ease-[var(--ease-clay)] hover:-translate-y-0.5 ${
                      isActive
                        ? "bg-earth text-cream border-earth"
                        : "bg-transparent text-earth border-earth/25 hover:border-clay"
                    }`}
                  >
                    {c} <span className="ml-0.5 text-[11px] opacity-60">{n}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground">
              Prices incl. taxes &amp; delivery
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {visibleFamilies.map((f) => (
              <FamilyCard key={f.key} family={f} onAdd={addToCart} />
            ))}
          </div>
        </div>
      </section>

      {/* CRAFT */}
      <section
        id="craft"
        className="relative overflow-hidden bg-earth text-cream px-6 md:px-10 py-24 md:py-36 grain"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 900 900"
          fill="none"
          className="absolute -right-[300px] -top-[200px] w-[900px] opacity-50 animate-spin-slow"
        >
          <circle
            cx="450"
            cy="450"
            r="440"
            stroke="oklch(0.72 0.11 75 / 0.25)"
            strokeDasharray="1 14"
            strokeWidth="2"
          />
          <circle cx="450" cy="450" r="360" stroke="oklch(0.72 0.11 75 / 0.12)" />
          <circle
            cx="450"
            cy="450"
            r="280"
            stroke="oklch(0.72 0.11 75 / 0.18)"
            strokeDasharray="40 20"
          />
        </svg>
        <div className="relative max-w-7xl mx-auto grid md:grid-cols-2 gap-14 md:gap-20 items-center">
          <div className="mk-reveal relative rounded-[2rem] overflow-hidden aspect-[4/5]">
            <img
              src={handsClay.src}
              alt="Potter's hands shaping clay on the wheel"
              width={1408}
              height={1600}
              loading="lazy"
              className="mk-parallax w-full h-full object-cover"
            />
            <blockquote className="absolute left-5 right-5 bottom-5 sm:left-6 sm:right-6 sm:bottom-6 px-6 py-5 rounded-[1.4rem] bg-kiln/55 backdrop-blur-md font-display italic text-xl sm:text-[1.6rem] leading-snug">
              &ldquo;The wheel remembers what the hand forgets.&rdquo;
            </blockquote>
          </div>

          <div>
            <p className="text-[11px] tracking-[0.4em] uppercase text-gold mb-6">— the craft</p>
            <h2 className="mk-reveal font-display font-normal text-[clamp(2.75rem,5vw,5rem)] leading-none text-balance">
              Seven generations, <em className="font-light text-gold">one wheel.</em>
            </h2>
            <p className="mk-reveal mt-8 max-w-md text-base md:text-lg leading-relaxed text-cream/72">
              We work with a single family of potters in Khurja, whose ancestors have thrown pots on
              the same wheel for over 180 years. No moulds. No machines. Only clay, water, fire, and
              time.
            </p>

            <div className="mt-12 md:mt-14 pt-8 border-t border-cream/20 grid grid-cols-3 gap-4 sm:gap-6">
              <div>
                <div className="font-display text-[clamp(2.5rem,5vw,4.25rem)] leading-none text-gold">
                  <span
                    className="mk-count"
                    style={{ "--num": 180 } as CSSProperties}
                    aria-hidden="true"
                  />
                  <span className="sr-only">180</span>+
                </div>
                <div className="mt-2.5 text-[10px] sm:text-[11px] tracking-[0.2em] uppercase text-cream/70">
                  years of craft
                </div>
              </div>
              <div>
                <div className="font-display text-[clamp(2.5rem,5vw,4.25rem)] leading-none text-gold">
                  <span
                    className="mk-count"
                    style={{ "--num": 12 } as CSSProperties}
                    aria-hidden="true"
                  />
                  <span className="sr-only">12</span>
                </div>
                <div className="mt-2.5 text-[10px] sm:text-[11px] tracking-[0.2em] uppercase text-cream/70">
                  master potters
                </div>
              </div>
              <div>
                <div className="font-display text-[clamp(2.5rem,5vw,4.25rem)] leading-none text-gold">
                  <span
                    className="mk-count"
                    style={{ "--num": 48 } as CSSProperties}
                    aria-hidden="true"
                  />
                  <span className="sr-only">48</span>h
                </div>
                <div className="mt-2.5 text-[10px] sm:text-[11px] tracking-[0.2em] uppercase text-cream/70">
                  of slow firing
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOUR ELEMENTS */}
      <section className="px-6 md:px-10 py-24 md:py-36">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-end justify-between gap-6 mb-12 md:mb-16">
            <h2 className="mk-reveal font-display font-normal text-[clamp(2.5rem,5vw,4.5rem)] leading-none text-earth">
              Four elements, <em className="font-light text-clay">one vessel.</em>
            </h2>
            <p className="font-hand text-2xl md:text-[1.65rem] text-clay-deep">
              from riverbank to your kitchen
            </p>
          </div>
          <div className="relative h-0.5 rounded-full bg-sand mb-10">
            <span className="mk-grow absolute inset-0 rounded-full bg-[linear-gradient(90deg,var(--sage),var(--clay),var(--ember),var(--gold))]" />
          </div>
          <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
            {ELEMENTS.map((el) => (
              <li
                key={el.n}
                className={`mk-reveal rounded-3xl px-7 py-8 ${el.dark ? "bg-earth text-cream" : "bg-sand text-earth"}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-display text-[3.5rem] leading-none ${el.accent}`}>
                    {el.n}
                  </span>
                  <span className={`relative w-3 h-3 rounded-full ${el.dot}`}>
                    {el.dark && (
                      <span
                        className={`absolute inset-0 rounded-full ${el.dot} animate-ring-pulse`}
                      />
                    )}
                  </span>
                </div>
                <h3 className="mt-7 mb-2 font-display text-3xl">{el.title}</h3>
                <p
                  className={`text-[15px] leading-relaxed ${el.dark ? "text-cream/75" : "text-muted-foreground"}`}
                >
                  {el.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* BENEFITS BENTO */}
      <section id="benefits" className="px-6 md:px-10 pb-24 md:pb-36">
        <div className="max-w-7xl mx-auto">
          <Eyebrow>Why clay</Eyebrow>
          <h2 className="mk-reveal mt-6 mb-12 md:mb-14 font-display font-normal text-[clamp(2.5rem,5vw,4.5rem)] leading-none max-w-3xl text-earth">
            What your grandmother <em className="font-light text-clay">already knew.</em>
          </h2>
          <div className="grid md:grid-cols-3 auto-rows-[240px] md:auto-rows-[280px] gap-5">
            <Link
              href="/benefits"
              className="mk-reveal group relative md:row-span-2 rounded-[1.75rem] overflow-hidden text-cream"
            >
              <img
                src={benefitCooling.src}
                alt="Water poured from a clay bottle into a kulhad"
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1800ms] ease-[var(--ease-clay)] group-hover:scale-[1.07]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-kiln/85 to-transparent to-55%" />
              <div className="absolute left-7 right-7 bottom-7">
                <h3 className="font-display text-4xl">Naturally cool</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-cream/85">
                  Porous walls breathe, so water cools as it evaporates — no fridge needed.
                </p>
              </div>
            </Link>
            <Link
              href="/benefits"
              className="mk-reveal group relative rounded-[1.75rem] overflow-hidden text-cream"
            >
              <img
                src={benefitMinerals.src}
                alt="Close-up of raw red clay"
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1800ms] ease-[var(--ease-clay)] group-hover:scale-[1.07]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-kiln/80 to-transparent to-60%" />
              <h3 className="absolute left-7 bottom-6 font-display text-[2.1rem]">
                Rich in minerals
              </h3>
            </Link>
            <Link
              href="/benefits"
              className="mk-reveal group rounded-[1.75rem] bg-sage text-cream p-8 flex flex-col justify-between"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                aria-hidden="true"
                className="w-10 h-10 animate-float"
              >
                <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" />
                <path d="M9 15a3 3 0 0 0 3 3" />
              </svg>
              <div>
                <h3 className="font-display text-[2.1rem]">Gently alkaline</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-cream/90">
                  Clay balances acidic water and food, the slow way.
                </p>
              </div>
            </Link>
            <Link
              href="/benefits"
              className="mk-reveal group relative md:col-span-2 rounded-[1.75rem] overflow-hidden text-cream"
            >
              <img
                src={benefitNutrients.src}
                alt="A meal cooked in clay"
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1800ms] ease-[var(--ease-clay)] group-hover:scale-[1.07]"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-kiln/80 to-transparent to-65%" />
              <div className="absolute left-8 top-1/2 -translate-y-1/2 max-w-xs">
                <h3 className="font-display text-[2.35rem] leading-tight">
                  Food that keeps its nutrients
                </h3>
                <span className="mt-4 inline-flex items-center gap-2 pb-1 border-b border-gold text-xs tracking-[0.18em] uppercase">
                  Read all benefits{" "}
                  <Arrow className="transition-transform duration-500 group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* WORKSHOPS */}
      <section id="workshops" className="px-6 md:px-10 pb-24 md:pb-36">
        <div className="mk-reveal max-w-7xl mx-auto rounded-[2.5rem] bg-sand overflow-hidden grid md:grid-cols-2">
          <div className="p-9 sm:p-14 lg:p-20 flex flex-col justify-center">
            <p className="font-hand text-[1.65rem] text-clay-deep mb-3">get your hands muddy</p>
            <h2 className="font-display font-normal text-[clamp(2.5rem,4.5vw,4.25rem)] leading-none text-earth">
              Sit at <em className="font-light text-clay">the wheel.</em>
            </h2>
            <p className="mt-6 max-w-md text-[17px] leading-relaxed text-muted-foreground">
              Pottery workshops at the studio. Centre the clay, pull your first wall, and take home
              a piece you made.
            </p>
            <div className="mt-9">
              <Link
                href="/workshops"
                className="mk-btn-fill inline-flex items-center gap-3 min-h-[54px] px-7 rounded-full bg-earth text-cream text-xs tracking-[0.16em] uppercase"
              >
                See workshops
                <Arrow className="mk-arrow" />
              </Link>
            </div>
          </div>
          <div className="group relative min-h-[360px] md:min-h-[480px] overflow-hidden">
            <img
              src={studentPottery.src}
              alt="A student shaping a small bowl on the wheel"
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1800ms] ease-[var(--ease-clay)] group-hover:scale-[1.06]"
            />
          </div>
        </div>
      </section>

      {/* STORY — the potter family, in numbers, and how a pot is made */}
      <section id="story" className="px-6 md:px-10 pb-16 md:pb-24">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-14 lg:gap-20 items-center">
          <div>
            <Eyebrow>Our story</Eyebrow>
            <h2 className="mk-reveal mt-6 font-display font-normal text-[clamp(2.75rem,5.6vw,5.25rem)] leading-[0.98] text-earth">
              Seven generations,
              <br />
              <em className="font-light text-clay">one wheel.</em>
            </h2>
            <p className="mk-reveal mt-8 max-w-xl font-display text-[clamp(1.4rem,2.2vw,1.75rem)] leading-[1.35] text-earth">
              We work with a single family of potters in Khurja, who have thrown clay on one wheel
              for over 180 years.
            </p>
            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-muted-foreground">
              Every Mudkraft piece begins as unglazed river clay and is shaped entirely by hand: no
              moulds, no machines. Each handi, kadhai and bhagona carries the marks of the potter
              who made it.
            </p>
            <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-muted-foreground">
              Then it is fired slowly, over 48 hours, so it is ready for years of everyday cooking.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/soil-report"
                className="mk-btn-fill inline-flex items-center gap-3 min-h-[52px] px-7 rounded-full bg-earth text-cream text-xs tracking-[0.16em] uppercase"
              >
                Read the soil report
                <Arrow className="mk-arrow" />
              </Link>
              <a
                href="/brochure/Mudkraft-Catalogue-2026.pdf"
                download
                className="inline-flex items-center gap-2.5 min-h-[52px] px-6 rounded-full border border-earth/25 text-earth text-xs tracking-[0.16em] uppercase hover:border-clay transition-colors"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                  className="w-4 h-4"
                >
                  <path d="M12 4v11m0 0l-4.5-4.5M12 15l4.5-4.5M5 19h14" />
                </svg>
                Download catalogue
              </a>
            </div>
          </div>
          <figure className="mk-reveal justify-self-center w-full max-w-[460px]">
            <div className="aspect-[3/4] rounded-t-full rounded-b-lg border border-border p-2.5">
              <img
                src={potsDrying.src}
                alt="Rows of freshly thrown clay pots drying on the studio floor"
                loading="lazy"
                className="w-full h-full object-cover rounded-t-full rounded-b"
              />
            </div>
            <figcaption className="mt-3 text-[13px] text-muted-foreground">
              Freshly thrown pots drying before firing.
            </figcaption>
          </figure>
        </div>
      </section>

      <section aria-label="Mudkraft in numbers" className="px-6 md:px-10 pb-20 md:pb-28">
        <dl className="mk-reveal max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-6 rounded-[1.75rem] bg-kiln text-cream px-6 py-12 md:py-14 text-center">
          {STORY_NUMBERS.map((n) => (
            <div key={n.label} className="flex flex-col-reverse">
              <dt className="mt-2.5 text-[11px] sm:text-xs tracking-[0.24em] uppercase text-cream/80">
                {n.label}
              </dt>
              <dd className="font-display text-[clamp(3rem,6vw,4.5rem)] leading-none text-gold">
                {n.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="px-6 md:px-10 pb-24 md:pb-32">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center gap-7">
            <h2 className="mk-reveal font-display font-normal text-[clamp(2.25rem,4vw,3.5rem)] text-earth">
              From river to table
            </h2>
            <span aria-hidden="true" className="h-px flex-[1_1_200px] bg-border" />
          </div>
          <ol className="mt-10 md:mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {RIVER_TO_TABLE.map((step, i) => (
              <li
                key={step.title}
                className="mk-reveal rounded-[1.25rem] border border-border bg-cream p-7"
              >
                <div className="font-display italic text-[2.5rem] leading-none text-clay">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="mt-4 mb-2 font-sans text-lg font-medium text-earth">{step.title}</h3>
                <p className="text-[15px] leading-relaxed text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="px-6 md:px-10 pb-24 md:pb-36 text-center">
        <div className="max-w-4xl mx-auto">
          <svg
            viewBox="0 0 64 64"
            fill="none"
            aria-hidden="true"
            className="mx-auto mb-8 w-16 h-16 animate-spin-mid"
          >
            <circle cx="32" cy="32" r="30" stroke="var(--clay)" strokeDasharray="4 6" />
            <circle cx="32" cy="32" r="6" fill="var(--clay)" />
          </svg>
          <p className="mk-reveal font-display italic text-[clamp(1.75rem,3.8vw,3.4rem)] leading-[1.2] text-earth text-balance">
            &ldquo;<span className="not-italic">Mudkraft</span> is the craft of earth in your hands.
            We think of every home that keeps our clay as another quiet birth — of stillness, of
            ritual, of a slower way to hold what matters.&rdquo;
          </p>
          <div className="mt-8 font-hand text-[1.75rem] text-clay-deep">— Ananya, founder</div>
          <p className="mt-6 text-[11px] tracking-[0.24em] uppercase text-muted-foreground">
            Handmade in Khurja, India · A slow craft studio from the banks of the Ganges
          </p>
        </div>
      </section>

      {/* VIDEOS — hidden entirely when the feed is unreachable, never broken */}
      {videos.length > 0 && (
        <section id="videos" className="px-6 md:px-10 pb-24 md:pb-36">
          <div className="max-w-7xl mx-auto">
            <Eyebrow>From the studio</Eyebrow>
            <h2 className="mk-reveal mt-6 font-display font-normal text-[clamp(2.5rem,6vw,5.25rem)] leading-none text-earth">
              Watch the <em className="font-light text-clay">wheel turn.</em>
            </h2>
            <div className="mt-10 md:mt-14 grid sm:grid-cols-2 gap-8">
              {videos.slice(0, 2).map((video) => (
                <div key={video.id} className="mk-reveal">
                  <VideoCard video={video} />
                </div>
              ))}
            </div>
            <div className="mt-10 md:mt-14 text-center">
              <Link
                href="/videos"
                className="mk-btn-fill inline-flex items-center gap-3 min-h-[54px] px-8 rounded-full border border-earth/25 text-earth text-xs tracking-[0.16em] uppercase"
              >
                View all videos
                <Arrow className="mk-arrow" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* NEWSLETTER */}
      <section id="journal" className="px-4 sm:px-6 md:px-10 pb-16">
        <div className="relative max-w-[87rem] mx-auto rounded-[2.5rem] bg-clay-deep text-cream px-6 py-16 sm:py-24 md:py-28 text-center overflow-hidden grain">
          <svg
            aria-hidden="true"
            viewBox="0 0 700 700"
            fill="none"
            className="absolute left-1/2 top-1/2 w-[700px] -translate-x-1/2 -translate-y-1/2 opacity-60 animate-spin-slow"
          >
            <circle
              cx="350"
              cy="350"
              r="340"
              stroke="oklch(0.955 0.018 75 / 0.15)"
              strokeDasharray="1 12"
              strokeWidth="2"
            />
            <circle
              cx="350"
              cy="350"
              r="250"
              stroke="oklch(0.72 0.11 75 / 0.25)"
              strokeDasharray="30 18"
            />
          </svg>
          <div className="relative max-w-2xl mx-auto">
            <h2 className="font-display font-normal text-[clamp(2.75rem,6vw,5.75rem)] leading-[0.95]">
              Letters from <em className="font-light text-[oklch(0.9_0.07_85)]">the kiln.</em>
            </h2>
            <p className="mt-6 max-w-md mx-auto text-[17px] leading-relaxed text-cream/82">
              A quiet note once a month — new pieces, small essays on craft, and the occasional
              invitation to the studio.
            </p>
            <form
              className="mt-10 mx-auto max-w-lg flex flex-col sm:flex-row gap-2 p-2 rounded-[2rem] sm:rounded-full bg-cream/10 border border-cream/30"
              onSubmit={(e) => e.preventDefault()}
            >
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <input
                id="newsletter-email"
                name="email"
                type="email"
                placeholder="your@email"
                className="flex-1 min-w-0 min-h-[52px] px-5 bg-transparent text-cream placeholder:text-cream/70 focus:outline-none"
              />
              <button className="mk-btn-fill min-h-[52px] px-7 rounded-full bg-cream text-ink text-xs tracking-[0.16em] uppercase font-medium">
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>

      <SiteFooter />

      {/* ADDED TOAST */}
      {toast && (
        <div
          role="status"
          className="fixed left-4 right-4 sm:left-auto sm:right-24 bottom-24 sm:bottom-6 z-[90] flex items-center gap-3.5 pl-3.5 pr-3 py-3 rounded-[1.25rem] bg-ink text-cream shadow-[0_30px_60px_-20px_rgba(0,0,0,0.5)] animate-fade-up"
        >
          <span className="grid place-items-center w-10 h-10 rounded-xl bg-sage shrink-0">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              aria-hidden="true"
              className="w-[18px] h-[18px]"
            >
              <path d="M5 12l5 5L20 7" className="animate-check-draw" />
            </svg>
          </span>
          <span className="text-sm flex-1">{toast} added to your basket</span>
          <button
            type="button"
            onClick={() => {
              setToast(null);
              setOpen(true);
            }}
            className="min-h-[40px] px-4 rounded-full bg-cream/10 text-[11px] tracking-[0.16em] uppercase hover:bg-cream/20 transition-colors"
          >
            View
          </button>
        </div>
      )}

      {/* CART DRAWER */}
      {open && (
        <div className="fixed inset-0 z-[100]">
          <div
            className="absolute inset-0 bg-ink/60 backdrop-blur-sm animate-in fade-in duration-500"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute right-0 top-0 h-full w-full max-w-md bg-cream text-earth shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 ease-[var(--ease-clay)]">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <div>
                <div className="text-xs tracking-[0.3em] uppercase text-clay-deep">Your basket</div>
                <div className="font-display text-2xl">
                  {count} {count === 1 ? "piece" : "pieces"}
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-11 h-11 rounded-full border border-border hover:bg-earth hover:text-cream hover:rotate-90 transition-all duration-500"
                aria-label="Close cart"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {cart.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <div className="font-hand text-3xl text-clay-deep">the basket waits, quietly</div>
                  <p className="mt-3 text-sm">Tap any piece to add it here.</p>
                </div>
              )}
              {cart.map((x, i) => (
                <div
                  key={x.slug}
                  className="flex gap-4 py-3 border-b border-border/60 animate-fade-up"
                  style={{ animationDelay: `${0.15 + i * 0.06}s` }}
                >
                  {x.img ? (
                    <img
                      src={x.img}
                      alt={x.name}
                      className="w-20 h-24 object-contain rounded-xl bg-sand p-1"
                    />
                  ) : (
                    <div className="w-20 h-24 rounded-xl bg-sand" aria-hidden="true" />
                  )}
                  <div className="flex-1">
                    <div className="font-display text-lg">{x.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {x.tag}
                      {x.max === 0 && <span className="ml-2 text-red-800">Sold out — remove</span>}
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <button
                        onClick={() => updateQty(x.slug, -1)}
                        aria-label={`Remove one ${x.name}`}
                        className="w-8 h-8 rounded-full border border-border hover:bg-earth hover:text-cream transition-colors"
                      >
                        −
                      </button>
                      <span className="text-sm">{x.qty}</span>
                      <button
                        onClick={() => updateQty(x.slug, 1)}
                        aria-label={`Add one ${x.name}`}
                        disabled={x.max !== undefined && x.qty >= x.max}
                        className="w-8 h-8 rounded-full border border-border hover:bg-earth hover:text-cream transition-colors disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-current"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeItem(x.slug)}
                        className="ml-auto text-xs text-muted-foreground hover:text-clay-deep"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="font-display text-lg">{formatPaise(x.pricePaise * x.qty)}</div>
                </div>
              ))}
            </div>
            <div className="px-6 py-5 border-t border-border space-y-4 bg-cream">
              <div className="flex items-baseline justify-between">
                <span className="text-xs tracking-[0.3em] uppercase text-muted-foreground">
                  Total
                </span>
                <span className="font-display text-3xl">{formatPaise(totalPaise)}</span>
              </div>
              <Link
                href="/checkout"
                onClick={() => setOpen(false)}
                aria-disabled={cart.length === 0}
                className={`w-full inline-flex items-center justify-center gap-2 min-h-[56px] rounded-full text-sm tracking-widest uppercase transition ${
                  cart.length > 0
                    ? "mk-btn-fill bg-earth text-cream"
                    : "bg-muted text-muted-foreground pointer-events-none"
                }`}
              >
                Checkout
                {cart.length > 0 && <Arrow className="mk-arrow" />}
              </Link>
              <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                {cart.length === 0
                  ? "Add a piece to begin."
                  : "Shipping is already included in every price. You can pay online or confirm with us on WhatsApp."}
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

/** A product card. Sizes are chips on the card: the price follows the chip, one button adds that size. */
function FamilyCard({ family, onAdd }: { family: ProductFamily; onAdd: (p: ProductView) => void }) {
  // Start on the largest size that is in stock, the one the catalogue and photos lead with.
  const [slug, setSlug] = useState(() => {
    const sizes = [...family.sizes].reverse();
    return (sizes.find((size) => size.stockQty > 0) ?? sizes[0]).slug;
  });
  const p = family.sizes.find((size) => size.slug === slug) ?? family.sizes[0];
  const soldOut = p.stockQty <= 0;
  const few = !soldOut && p.stockQty <= 5;
  const off = p.discountPct;
  const image = displayImage(p);

  return (
    <article className="mk-reveal group relative flex flex-col rounded-[1.25rem] bg-sand p-2.5 pb-4 transition-[transform,box-shadow] duration-500 ease-[var(--ease-clay)] hover:-translate-y-1 hover:shadow-[0_36px_60px_-36px_rgba(59,42,34,0.5)]">
      <Link
        href={`/shop/${p.slug}`}
        aria-label={`View ${p.name}`}
        className="relative block aspect-[4/3] overflow-hidden rounded-xl bg-[oklch(0.93_0.025_75)]"
      >
        {image ? (
          <img
            src={image}
            alt={`Handcrafted ${p.name} — ${p.tag} from Mudkraft`}
            width={900}
            height={675}
            loading="lazy"
            className={`absolute inset-0 m-auto w-[86%] h-[86%] object-contain mix-blend-multiply drop-shadow-[0_16px_16px_rgba(80,40,20,0.2)] transition-transform duration-[1200ms] ease-[var(--ease-clay)] group-hover:scale-[1.05] ${
              soldOut ? "opacity-60" : ""
            }`}
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-earth/40 font-hand text-2xl">
            photograph coming soon
          </div>
        )}
        {off > 0 && !soldOut && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-clay-deep px-2.5 py-1 text-[11px] font-semibold text-cream">
            −{off}%
          </span>
        )}
      </Link>

      <div className="flex flex-col gap-2.5 px-2 pt-3.5">
        <div className="flex items-baseline justify-between gap-3">
          <Link href={`/shop/${p.slug}`} className="min-w-0 hover:text-clay-deep transition-colors">
            <h3 className="font-display text-[1.7rem] leading-tight text-earth truncate">
              {family.name}
            </h3>
          </Link>
          <div className="shrink-0 flex items-baseline gap-2">
            <span className="font-display text-[1.45rem] text-earth">{p.price}</span>
            {p.compareAt && (
              <span className="text-[13px] text-muted-foreground line-through">{p.compareAt}</span>
            )}
          </div>
        </div>

        <div role="group" aria-label={`${family.name} variant`} className="flex flex-wrap gap-2">
          {family.sizes.map((size) => (
            <button
              key={size.slug}
              type="button"
              onClick={() => setSlug(size.slug)}
              aria-pressed={size.slug === p.slug}
              className={`min-h-9 px-3.5 rounded-full border text-[12.5px] font-medium transition-colors ${
                size.slug === p.slug
                  ? "bg-earth text-cream border-earth"
                  : "bg-cream border-border text-earth hover:border-clay"
              } ${size.stockQty <= 0 ? "opacity-45 line-through" : ""}`}
            >
              {variantLabel(size, family.sizes)}
            </button>
          ))}
        </div>

        <p className={`text-xs ${few ? "text-clay-deep" : "text-muted-foreground"}`}>
          {soldOut ? "Sold out" : few ? `Only ${p.stockQty} left` : "In stock"}
        </p>

        <button
          type="button"
          disabled={soldOut}
          onClick={() => onAdd(p)}
          aria-label={
            soldOut
              ? `${p.name} ${p.sizeLabel} is sold out`
              : `Add ${p.name} ${p.sizeLabel} to basket`
          }
          className={`flex min-h-12 items-center justify-between rounded-full pl-5 pr-1.5 text-[11.5px] uppercase tracking-[0.16em] transition-colors duration-300 ${
            soldOut
              ? "border border-border text-muted-foreground cursor-not-allowed"
              : "bg-earth text-cream hover:bg-clay-deep active:scale-[0.99]"
          }`}
        >
          <span className="truncate">{soldOut ? "Sold out" : `Add ${variantLabel(p, family.sizes)}`}</span>
          <span
            aria-hidden="true"
            className={`grid h-9 w-9 place-items-center rounded-full text-xl tracking-normal ${soldOut ? "opacity-0" : "bg-cream text-earth"}`}
          >
            +
          </span>
        </button>
      </div>
    </article>
  );
}
