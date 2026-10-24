"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";

import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import handsClay from "@/assets/hands-clay.jpg";
import heroBanner from "@/assets/hero-pot.jpg";
import benefitCooling from "@/assets/benefit-cooling.jpg";
import benefitMinerals from "@/assets/benefit-minerals.jpg";
import benefitNutrients from "@/assets/benefit-nutrients.jpg";
import studentPottery from "@/assets/student-pottery.jpg";
import { formatPaise } from "@/lib/money";
import { displayImage, type ProductView } from "@/lib/product-view";
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

// Horizontal positions and start offsets for the kiln sparks in the hero. Fixed
// rather than random so server and client render the same markup.
const EMBERS = [
  { left: "8%", delay: "0s", size: 6 },
  { left: "22%", delay: "2.4s", size: 4 },
  { left: "37%", delay: "5s", size: 6 },
  { left: "54%", delay: "1.2s", size: 3 },
  { left: "66%", delay: "3.6s", size: 6 },
  { left: "79%", delay: "6.4s", size: 4 },
  { left: "91%", delay: "4.2s", size: 6 },
];

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

  // Categories come from the database, so a category added in the admin panel
  // appears here without a code change.
  const filterOptions = ["All", ...categories];
  const visibleProducts =
    activeCategory === "All" ? products : products.filter((p) => p.category === activeCategory);

  // Adding from the grid confirms with a toast and a bounce on the basket count
  // rather than throwing the drawer open, so browsing isn't interrupted.
  const addToCart = (p: ProductView) => {
    addToCartStore(p);
    timers.current.forEach(clearTimeout);
    setBump(true);
    setToast(p.name);
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
              className="hidden lg:inline-flex items-center gap-2 text-xs tracking-widest uppercase border border-earth/25 px-4 min-h-[44px] rounded-full text-earth hover:bg-earth hover:text-cream transition-colors duration-500"
            >
              <WhatsAppIcon className="w-4 h-4" />
              Enquire
            </a>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="relative hidden md:inline-flex items-center gap-2.5 text-xs tracking-widest uppercase bg-earth text-cream pl-5 pr-2 min-h-[44px] rounded-full hover:bg-ink transition-colors"
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

      {/* HERO — the kiln at night */}
      <section className="relative isolate overflow-hidden bg-kiln text-cream pt-32 md:pt-44 pb-28 md:pb-32 px-6 md:px-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        >
          {EMBERS.map((e) => (
            <span
              key={e.left}
              className="mk-ember"
              style={{ left: e.left, animationDelay: e.delay, width: e.size, height: e.size }}
            />
          ))}
          <div className="absolute left-1/2 -bottom-[380px] w-[1100px] h-[700px] -translate-x-[30%] rounded-full bg-[radial-gradient(closest-side,oklch(0.58_0.14_42/0.45),transparent)]" />
        </div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-14 lg:gap-16 items-center">
          <div>
            <p className="font-hand text-gold text-2xl sm:text-[1.75rem] mb-5 animate-fade-up [animation-delay:0.15s]">
              — shaped by hand, held by earth
            </p>
            <h1 className="font-display font-normal text-[clamp(3.25rem,8vw,7.75rem)] leading-[0.92] tracking-[-0.02em]">
              <span className="mk-line">
                <span style={{ animationDelay: "0.15s" }}>The soul of</span>
              </span>
              <span className="mk-line">
                <span style={{ animationDelay: "0.3s" }}>
                  <em className="mk-shimmer font-light">soil</em>, spun
                </span>
              </span>
              <span className="mk-line">
                <span style={{ animationDelay: "0.45s" }}>
                  into <em className="font-light">stillness.</em>
                </span>
              </span>
            </h1>
            <p className="mt-8 max-w-md text-base sm:text-lg leading-relaxed text-cream/75 animate-fade-up [animation-delay:0.6s]">
              Mudkraft is a slow craft studio. Every pot begins as river clay in the hands of a
              potter, and ends as a quiet object in your home.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row sm:items-center gap-5 animate-fade-up [animation-delay:0.8s]">
              <a
                href="#collection"
                className="mk-btn-fill inline-flex items-center justify-center gap-3.5 min-h-[58px] px-8 rounded-full bg-cream text-ink text-[13px] tracking-[0.16em] uppercase font-medium"
              >
                Explore the collection
                <Arrow className="mk-arrow" />
              </a>
              <a
                href="#videos"
                className="group inline-flex items-center gap-3.5 text-cream text-[15px]"
              >
                <span className="relative inline-grid place-items-center w-14 h-14 rounded-full border border-gold/60">
                  <span className="absolute inset-0 rounded-full border border-gold animate-ring-pulse" />
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                    className="w-4 h-4 text-gold"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
                <span className="mk-link">Watch the wheel turn</span>
              </a>
            </div>
          </div>

          {/* The pot, unveiled inside a kiln arch */}
          <div className="relative grid place-items-center min-h-[480px] sm:min-h-[620px]">
            <svg
              aria-hidden="true"
              viewBox="0 0 620 620"
              fill="none"
              className="absolute w-[min(620px,100%)] animate-spin-slower"
            >
              <circle
                cx="310"
                cy="310"
                r="300"
                stroke="oklch(0.72 0.11 75 / 0.28)"
                strokeDasharray="2 10"
              />
              <circle cx="310" cy="310" r="250" stroke="oklch(0.955 0.018 75 / 0.08)" />
            </svg>
            <div className="relative w-[min(440px,82%)] aspect-[44/58] rounded-t-full rounded-b-[2.5rem] overflow-hidden shadow-[0_60px_120px_-40px_rgba(0,0,0,0.8)] animate-arch-in">
              <img
                src={heroBanner.src}
                alt="Hand-carved terracotta pot resting on a wooden stool"
                fetchPriority="high"
                decoding="async"
                className="w-full h-full object-cover object-[50%_40%] animate-ken-burns"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-kiln/55 to-transparent to-45%" />
            </div>

            {/* Rotating seal */}
            <div className="absolute left-0 sm:left-2 bottom-4 sm:bottom-10 w-28 h-28 sm:w-[150px] sm:h-[150px] grid place-items-center rounded-full bg-clay shadow-[0_20px_50px_-10px_oklch(0.58_0.14_42/0.6)]">
              <svg
                viewBox="0 0 150 150"
                aria-hidden="true"
                className="absolute inset-0 w-full h-full animate-spin-slow"
              >
                <defs>
                  <path id="hero-seal" d="M75,75 m-56,0 a56,56 0 1,1 112,0 a56,56 0 1,1 -112,0" />
                </defs>
                <text
                  fill="var(--cream)"
                  className="font-sans uppercase"
                  style={{ fontSize: 11, fontWeight: 500 }}
                  // Stretch the lettering to exactly one lap of the circle so the ends meet.
                  textLength={350}
                  lengthAdjust="spacing"
                >
                  <textPath href="#hero-seal">Hand thrown · wood fired · slow made · </textPath>
                </text>
              </svg>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--cream)"
                strokeWidth="1.4"
                aria-hidden="true"
                className="w-7 h-7 sm:w-9 sm:h-9"
              >
                <path d="M7 20h10M8 20c-2-3-2-7 0-10h8c2 3 2 7 0 10M9 10V7h6v3" />
              </svg>
            </div>

            <div className="absolute right-0 top-6 sm:top-20 px-5 py-4 rounded-[1.4rem] bg-cream/10 backdrop-blur-md border border-cream/20 animate-float">
              <div className="font-display text-4xl sm:text-5xl leading-none text-gold">48h</div>
              <div className="mt-1.5 text-[11px] tracking-[0.2em] uppercase text-cream/75">
                of slow firing
              </div>
            </div>

            <div className="hidden sm:flex absolute right-6 bottom-28 items-center gap-2.5 pl-3 pr-4 py-3 rounded-full bg-cream text-ink shadow-[0_20px_40px_-20px_rgba(0,0,0,0.6)] animate-float [animation-delay:1.5s]">
              <span className="grid place-items-center w-9 h-9 rounded-full bg-sage">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--cream)"
                  strokeWidth="2"
                  aria-hidden="true"
                  className="w-4 h-4"
                >
                  <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" />
                </svg>
              </span>
              <span className="text-[13px] font-medium">Naturally cools water</span>
            </div>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="hidden md:flex absolute left-1/2 bottom-7 -translate-x-1/2 flex-col items-center gap-3 text-[10px] tracking-[0.4em] uppercase text-cream/60"
        >
          scroll
          <span className="relative block w-px h-14 overflow-hidden bg-cream/15">
            <span className="absolute inset-0 bg-gold animate-scroll-cue" />
          </span>
        </div>
      </section>

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
      <section className="px-6 md:px-10 pt-20 md:pt-28 pb-12 md:pb-20">
        <div className="max-w-5xl mx-auto">
          <Eyebrow>Our belief</Eyebrow>
          <p className="mt-9 font-display text-[clamp(2.1rem,4.4vw,4rem)] leading-[1.12]">
            <span className="mk-ink-fill block">Every pot begins as river clay</span>
            <span className="mk-ink-fill block">in a potter&rsquo;s hands — and ends as</span>
            <span className="mk-ink-fill block">
              a <em>quiet object</em> that keeps your
            </span>
            <span className="mk-ink-fill block">water cool and your food honest.</span>
          </p>
        </div>
      </section>

      {/* COLLECTION */}
      <section id="collection" className="px-6 md:px-10 pt-12 md:pt-16 pb-24 md:pb-32">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-end justify-between gap-8 mb-10 md:mb-12">
            <h2 className="mk-reveal font-display font-normal text-[clamp(2.75rem,6vw,5.75rem)] leading-[0.95] tracking-[-0.02em] max-w-3xl text-earth text-balance">
              Objects that <em className="font-light text-clay">breathe</em>, made to be lived with.
            </h2>
            <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-2">
              {filterOptions.map((c) => {
                const n =
                  c === "All" ? products.length : products.filter((p) => p.category === c).length;
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
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {visibleProducts.map((p) => (
              <article
                key={p.slug}
                className="mk-reveal group relative flex flex-col rounded-[1.75rem] overflow-hidden bg-sand transition-[transform,box-shadow] duration-800 ease-[var(--ease-clay)] hover:-translate-y-2.5 hover:shadow-[0_50px_80px_-40px_rgba(59,42,34,0.55)]"
              >
                <Link
                  href={`/shop/${p.slug}`}
                  aria-label={`View ${p.name}`}
                  className="relative block aspect-[4/5] overflow-hidden"
                >
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,oklch(0.97_0.015_75)_0%,transparent_65%)]" />
                  {displayImage(p) ? (
                    <img
                      src={displayImage(p)!}
                      alt={`Handcrafted ${p.name} — ${p.tag} from Mudkraft`}
                      width={900}
                      height={1125}
                      loading="lazy"
                      className="relative w-full h-full object-contain p-3 scale-[1.18] transition-transform duration-[1600ms] ease-[var(--ease-clay)] group-hover:scale-[1.28] group-hover:-rotate-1 drop-shadow-[0_30px_35px_rgba(80,40,20,0.35)]"
                    />
                  ) : (
                    <div className="relative w-full h-full grid place-items-center text-earth/40 font-hand text-2xl">
                      photograph coming soon
                    </div>
                  )}
                  <span className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-ink/80 backdrop-blur text-cream text-[10px] tracking-[0.2em] uppercase">
                    {p.tag}
                  </span>
                  <span className="absolute left-4 right-4 bottom-4 flex items-center justify-center min-h-[48px] rounded-full bg-cream/90 backdrop-blur text-ink text-xs tracking-[0.16em] uppercase opacity-0 translate-y-4 transition-all duration-600 ease-[var(--ease-clay)] group-hover:opacity-100 group-hover:translate-y-0">
                    View piece
                  </span>
                </Link>

                <div className="flex items-end justify-between gap-3 px-5 pt-4 pb-5">
                  <div className="min-w-0">
                    <Link
                      href={`/shop/${p.slug}`}
                      className="hover:text-clay-deep transition-colors"
                    >
                      <h3 className="font-display text-[1.75rem] leading-tight text-earth truncate">
                        {p.name}
                      </h3>
                    </Link>
                    <p className="font-hand text-xl text-clay-deep truncate">{p.note}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-display text-xl text-earth">{p.price}</div>
                    <button
                      type="button"
                      onClick={() => addToCart(p)}
                      aria-label={`Add ${p.name} to basket`}
                      className="mt-1.5 inline-grid place-items-center w-11 h-11 rounded-full bg-earth text-cream hover:bg-clay hover:rotate-90 active:scale-90 transition-all duration-500 ease-[var(--ease-clay)]"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                        className="w-4 h-4"
                      >
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </button>
                  </div>
                </div>
              </article>
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

      {/* STORY */}
      <section id="story" className="px-6 md:px-10 pb-24 md:pb-36 text-center">
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
                    <div className="text-xs text-muted-foreground">{x.tag}</div>
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
                        className="w-8 h-8 rounded-full border border-border hover:bg-earth hover:text-cream transition-colors"
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
