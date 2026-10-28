"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { ArrowRight, Check, ChevronLeft, ChevronRight, Droplet } from "lucide-react";

import { displayImage, groupFamilies, type ProductView } from "@/lib/product-view";

/** How long each piece is shown before the next one comes round. */
const PIECE_MS = 5000;

const POINTS: Record<string, [string, string]> = {
  Cookware: ["Even, gentle heat on a low flame", "Season once before the first cook"],
  Serveware: [
    "Breathes, so curd sets and water stays cool",
    "Unglazed river clay, no chemical glaze",
  ],
};

type Tab = "All" | "Cookware" | "Serveware";

const COUNT_WORDS = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];

export function HeroPieces({ products }: { products: ProductView[] }) {
  // One entry per product, not per size: each family is shown through its first size that has a
  // photograph, so only our own products with a picture are listed.
  const pieces = groupFamilies(products)
    .map((f) => f.sizes.find((s) => displayImage(s)))
    .filter((p): p is ProductView => Boolean(p));

  const [tab, setTab] = useState<Tab>("All");
  const [index, setIndex] = useState(0);
  const [hovering, setHovering] = useState(false);

  const visible = tab === "All" ? pieces : pieces.filter((p) => p.category === tab);
  if (visible.length === 0) return null;

  const i = Math.min(index, visible.length - 1);
  const cur = visible[i];
  const points = POINTS[cur.category ?? ""] ?? POINTS.Cookware;
  const go = (n: number) => setIndex((n + visible.length) % visible.length);
  const pad = (n: number) => String(n).padStart(2, "0");
  const tabs: Array<{ id: Tab; n: number }> = [
    { id: "All", n: pieces.length },
    { id: "Cookware", n: pieces.filter((p) => p.category === "Cookware").length },
    { id: "Serveware", n: pieces.filter((p) => p.category === "Serveware").length },
  ];
  // With a single category the tabs would only repeat "All", so they go.
  const showTabs = tabs.filter((t) => t.id !== "All" && t.n > 0).length > 1;
  const count = COUNT_WORDS[pieces.length] ?? String(pieces.length);

  const tabList = (
    <div role="tablist" aria-label="Category" className="inline-flex p-1 rounded-full bg-black/30">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={t.id === tab}
          onClick={() => {
            setTab(t.id);
            setIndex(0);
          }}
          className={`h-10 px-4 rounded-full text-[13px] transition-colors ${
            t.id === tab ? "bg-cream text-ink" : "text-cream/80 hover:text-cream"
          }`}
        >
          {t.id} <span className="text-[11px] opacity-60">{t.n}</span>
        </button>
      ))}
    </div>
  );

  return (
    <section
      aria-label="Our pieces"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocus={() => setHovering(true)}
      onBlur={() => setHovering(false)}
      className="relative isolate overflow-hidden bg-[#1c110c] text-cream px-5 sm:px-6 md:px-10 pt-28 pb-10 md:pt-32 lg:pt-36 lg:pb-10"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[45%] -z-10 w-[980px] h-[980px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(180,90,53,0.34),transparent)]"
      />

      <div className="max-w-7xl mx-auto grid gap-y-10 lg:grid-cols-[minmax(0,25rem)_minmax(0,1fr)_minmax(0,19rem)] lg:gap-x-14 xl:gap-x-20 items-center">
        {/* Copy */}
        <div className="text-center lg:text-left">
          <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/[0.06] border border-white/[0.12] text-xs tracking-[0.08em] text-[#e0b08a]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#e0b08a]" /> Handmade in Khurja
          </span>
          <h2 className="mt-5 font-display font-normal text-[clamp(2.75rem,6vw,4.75rem)] leading-[0.96]">
            {count} pieces.
            <br className="hidden lg:block" />{" "}
            <em className="font-light text-[#e0b08a]">One wheel.</em>
          </h2>
          <p className="mt-5 mx-auto lg:mx-0 max-w-md text-[17px] leading-relaxed text-cream/75">
            Pick a piece to see it up close. Each one is thrown by hand from lab-tested river clay
            and fired for 48 hours.
          </p>
          <div className="mt-7 flex flex-wrap justify-center lg:justify-start gap-3">
            <a
              href="#collection"
              className="inline-flex items-center h-[52px] px-6 rounded-full bg-[#a8442a] text-white text-xs tracking-[0.16em] uppercase font-medium hover:bg-clay-deep transition-colors"
            >
              Shop the collection
            </a>
            <Link
              href="/soil-report"
              className="inline-flex items-center h-[52px] px-5 rounded-full border border-cream/30 text-xs tracking-[0.16em] uppercase hover:border-[#e0b08a] transition-colors"
            >
              Soil report
            </Link>
          </div>
          <ul className="mt-8 hidden sm:flex flex-wrap justify-center lg:justify-start gap-2 text-[13px] text-cream/85">
            {["Food-safe clay", "No chemical glaze", "Delivery included"].map((t) => (
              <li
                key={t}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5"
              >
                <Check className="w-3.5 h-3.5 text-[#e0b08a]" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* Phones: category tabs sit above the wheel */}
        {showTabs && <div className="lg:hidden flex justify-center -mb-4">{tabList}</div>}

        {/* The wheel */}
        <div className="relative mx-auto w-full max-w-[min(100%,34rem)] aspect-square grid place-items-center">
          <TextRing
            className="absolute inset-0 w-full h-full animate-spin-slower"
            text="HAND THROWN · SLOW FIRED 48 HOURS · UNGLAZED RIVER CLAY · KHURJA, INDIA ·"
            radius={282}
            fontSize={13}
          />
          {/* Product photos come on a white ground, so the disc is lit like a studio sweep
              (near-white centre, warm rim) and the photo is multiplied onto it: the white
              melts into the disc and only the pot remains, standing on a soft ground shadow. */}
          <div className="relative isolate w-[80%] aspect-square rounded-full overflow-hidden bg-[radial-gradient(circle_at_50%_42%,#fffdf9_0%,#f6ece0_46%,#e3cfb9_100%)] shadow-[0_50px_100px_-30px_rgba(0,0,0,0.85),0_0_0_1px_rgba(224,176,138,0.25),inset_0_-30px_60px_-20px_rgba(120,70,40,0.25)]">
            <span
              aria-hidden="true"
              className="absolute left-1/2 bottom-[17%] w-[58%] h-[9%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgba(70,35,15,0.45),transparent)] blur-[6px]"
            />
            <div className="absolute inset-0 mix-blend-multiply animate-float">
              <img
                key={cur.slug}
                src={displayImage(cur)!}
                alt={cur.name}
                className="w-full h-full object-contain p-[12%] animate-in fade-in-0 zoom-in-95 duration-700"
              />
            </div>
          </div>
          <span className="absolute right-[6%] top-[6%] px-3.5 py-2 rounded-full bg-[#1c110c]/70 border border-white/[0.12] backdrop-blur text-xs tracking-[0.14em] tabular-nums">
            {pad(i + 1)} / {pad(visible.length)}
          </span>
          <button
            type="button"
            onClick={() => go(i - 1)}
            aria-label="Previous piece"
            className="lg:hidden absolute left-0 top-1/2 -translate-y-1/2 grid place-items-center w-11 h-11 rounded-full border border-cream/25 bg-[#1c110c]/75"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => go(i + 1)}
            aria-label="Next piece"
            className="lg:hidden absolute right-0 top-1/2 -translate-y-1/2 grid place-items-center w-11 h-11 rounded-full bg-cream text-ink"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Piece card */}
        <div
          aria-live="polite"
          className="w-full max-w-md mx-auto lg:max-w-none p-6 lg:p-7 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md"
        >
          <span className="inline-block px-3 py-1.5 rounded-full bg-[#e0b08a]/15 text-[#e0b08a] text-[11px] tracking-[0.18em] uppercase">
            {cur.category}
          </span>
          <h3 className="mt-4 font-display font-normal text-[2.6rem] lg:text-[3.25rem] leading-none">
            {cur.name}
          </h3>
          <p className="mt-2 font-display italic text-xl text-cream/80">{cur.note}</p>
          <div className="my-5 h-px bg-white/10" />
          <ul className="flex flex-col gap-2.5 text-sm text-cream/80">
            <li className="flex gap-2.5">
              <Droplet className="w-4 h-4 mt-0.5 shrink-0 text-[#e0b08a]" />
              {points[0]}
            </li>
            <li className="flex gap-2.5">
              <Check className="w-4 h-4 mt-0.5 shrink-0 text-[#e0b08a]" />
              {points[1]}
            </li>
          </ul>
          <Link
            href={`/shop/${cur.slug}`}
            className="mt-6 flex items-center justify-between gap-3 h-[54px] pl-5 pr-2 rounded-full bg-cream text-ink text-[15px] font-medium hover:bg-sand transition-colors"
          >
            Explore the {cur.name.split(" ·")[0]}
            <span className="grid place-items-center w-10 h-10 rounded-full bg-ink text-cream">
              <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>
      </div>

      {/* Dock: tabs, piece picker, arrows. The active piece's progress line is the timer. */}
      <div className="max-w-7xl mx-auto mt-10 lg:mt-12 flex items-center gap-5 lg:h-[84px] lg:px-3 lg:rounded-[22px] lg:bg-white/[0.04] lg:border lg:border-white/[0.09] lg:backdrop-blur-md">
        {showTabs && <div className="hidden lg:block shrink-0">{tabList}</div>}
        <div
          role="group"
          aria-label="Choose a piece"
          className="flex-1 min-w-0 overflow-x-auto -mx-5 px-5 sm:mx-0 sm:px-0 [scrollbar-width:none]"
        >
          {/* w-max + mx-auto centres the row when it fits and lets it scroll from the
              first piece when it doesn't (justify-center would clip the start). */}
          <div className="flex gap-2 w-max mx-auto">
            {visible.map((p, j) => {
              const on = j === i;
              return (
                <button
                  key={p.slug}
                  type="button"
                  onClick={() => setIndex(j)}
                  aria-pressed={on}
                  className={`relative shrink-0 inline-flex items-center gap-2 h-12 pl-1.5 pr-3.5 rounded-full border overflow-hidden whitespace-nowrap text-[13px] transition-colors ${
                    on
                      ? "bg-cream/[0.12] border-[#e0b08a]/60 text-cream"
                      : "border-white/[0.08] text-cream/70 hover:text-cream"
                  }`}
                >
                  <span className="isolate shrink-0 w-9 h-9 rounded-full overflow-hidden bg-[radial-gradient(circle,#fffdf9,#ead9c6)]">
                    <img
                      src={displayImage(p)!}
                      alt=""
                      className="w-full h-full object-contain p-1 mix-blend-multiply"
                    />
                  </span>
                  {p.name}
                  {on && (
                    <span
                      key={`${tab}-${j}`}
                      className="absolute left-0 right-0 bottom-0 h-0.5 bg-[#a8442a] animate-progress-fill"
                      style={{
                        animationDuration: `${PIECE_MS}ms`,
                        animationPlayState: hovering ? "paused" : "running",
                      }}
                      onAnimationEnd={() => go(j + 1)}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
        <div className="hidden lg:flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => go(i - 1)}
            aria-label="Previous piece"
            className="grid place-items-center w-11 h-11 rounded-full border border-cream/25 hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => go(i + 1)}
            aria-label="Next piece"
            className="grid place-items-center w-11 h-11 rounded-full bg-cream text-ink"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

/** Words set around a circle, for the slowly turning rings. */
function TextRing({
  text,
  radius,
  fontSize,
  className = "",
  style,
}: {
  text: string;
  radius: number;
  fontSize: number;
  className?: string;
  style?: CSSProperties;
}) {
  const id = `ring-${radius}-${fontSize}`;
  return (
    <svg aria-hidden="true" viewBox="0 0 600 600" className={className} style={style}>
      <defs>
        <path
          id={id}
          d={`M300,300 m-${radius},0 a${radius},${radius} 0 1,1 ${radius * 2},0 a${radius},${radius} 0 1,1 -${radius * 2},0`}
        />
      </defs>
      <text fill="rgba(224,176,138,0.55)" fontSize={fontSize} letterSpacing={fontSize / 2.2}>
        <textPath href={`#${id}`}>{text}</textPath>
      </text>
    </svg>
  );
}
