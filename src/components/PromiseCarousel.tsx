"use client";

import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { NCR_CITIES } from "@/lib/policy";
import type { ProductView } from "@/lib/product-view";
import { SALES_PHONE_DISPLAY } from "@/lib/catalogue";
import { whatsappLink } from "@/lib/whatsapp";

/**
 * The home page's promises, one slide each: 24-hour NCR delivery, breakage cover, help, the soil
 * report. Native scroll-snap does the sliding, so it swipes on a phone and works without script;
 * the arrows and dots only scroll the track.
 */

interface Slide {
  eyebrow: string;
  title: ReactNode;
  body: string;
  extra?: ReactNode;
  cta: { label: string; href: string; external?: boolean };
  pieces: ProductView[];
  /** Text side, then picture side. The picture side stays light so white-backed photos blend in. */
  tone: { text: string; eyebrow: string; muted: string; cta: string; panel: string };
}

const pick = (products: ProductView[], re: RegExp) =>
  products.find((p) => re.test(`${p.tag} ${p.name}`) && (p.cutout || p.img));

function Piece({ p, className }: { p: ProductView; className: string }) {
  const src = p.cutout ?? p.img!;
  return (
    <img
      src={src}
      alt={`${p.name} ${p.sizeLabel}`.trim()}
      loading="lazy"
      className={`object-contain object-bottom ${src === p.cutout ? "" : "mix-blend-multiply brightness-[1.06] contrast-[1.06]"} ${className}`}
    />
  );
}

export function PromiseCarousel({ products }: { products: ProductView[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const pieces = (...res: RegExp[]) =>
    res.map((re) => pick(products, re)).filter((p): p is ProductView => Boolean(p));

  const slides: Slide[] = [
    {
      eyebrow: "Delhi NCR delivery",
      title: (
        <>
          At your door in <em className="text-ember">24 hours.</em>
        </>
      ),
      body: "Order today, cook in clay tomorrow. Packed in recycled paper and a double-walled carton. Cash on delivery.",
      extra: (
        <ul className="flex flex-wrap gap-1.5">
          {NCR_CITIES.map((c) => (
            <li
              key={c}
              className="rounded-full border border-cream/25 px-3 py-1 text-xs text-cream/85"
            >
              {c}
            </li>
          ))}
        </ul>
      ),
      cta: { label: "Shop the collection", href: "/#collection" },
      pieces: pieces(/cooler|matka/i, /^(?!.*dahi).*handi/i, /kull?h?ad/i),
      tone: {
        text: "bg-kiln text-cream",
        eyebrow: "text-gold",
        muted: "text-cream/75",
        cta: "bg-gold text-kiln",
        panel: "bg-sand",
      },
    },
    {
      eyebrow: "Breakage cover",
      title: (
        <>
          Arrived cracked? <em className="text-clay">We replace it.</em>
        </>
      ),
      body: "Send an unboxing photo or video on WhatsApp within 48 hours. A free replacement or a full refund, your choice.",
      cta: { label: "How returns work", href: "/shipping-returns" },
      pieces: pieces(/kadh?ai/i),
      tone: {
        text: "bg-sand text-earth",
        eyebrow: "text-clay-deep",
        muted: "text-muted-foreground",
        cta: "bg-earth text-cream",
        panel: "bg-cream",
      },
    },
    {
      eyebrow: "Care & help",
      title: (
        <>
          Need help with <em>your clay?</em>
        </>
      ),
      body: "Seasoning, cleaning, which pot for which dish. A potter's family answers, not a bot.",
      extra: <p className="font-display text-2xl">{SALES_PHONE_DISPLAY}</p>,
      cta: {
        label: "Chat on WhatsApp",
        href: whatsappLink(["Namaste Mudkraft 🙏", "I have a question about clay cookware."]),
        external: true,
      },
      pieces: pieces(/dahi/i),
      tone: {
        text: "bg-clay text-cream",
        eyebrow: "text-cream/85",
        muted: "text-cream/90",
        cta: "bg-cream text-clay-deep",
        panel: "bg-cream",
      },
    },
    {
      eyebrow: "Soil report",
      title: (
        <>
          Lab-tested. <em className="text-gold">Lead-free.</em>
        </>
      ),
      body: "Unglazed Khurja clay, no paint, no chemical coat. Read the full lab report before you cook in it.",
      cta: { label: "Read the soil report", href: "/soil-report" },
      pieces: pieces(/bhagona|patila/i),
      tone: {
        text: "bg-earth text-cream",
        eyebrow: "text-gold",
        muted: "text-cream/75",
        cta: "bg-cream text-earth",
        panel: "bg-sand",
      },
    },
  ];

  const go = (i: number) => {
    const track = trackRef.current;
    const first = track?.children[0] as HTMLElement | undefined;
    const slide = track?.children[i] as HTMLElement | undefined;
    // Measured from the first slide, so the track's side padding cancels out.
    if (track && first && slide)
      track.scrollTo({ left: slide.offsetLeft - first.offsetLeft, behavior: "smooth" });
  };
  const onScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    const first = track.children[0] as HTMLElement | undefined;
    if (!first) return;
    // The last slide may never reach the left edge; at the end of the track it is the current one.
    if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 4) {
      setActive(slides.length - 1);
      return;
    }
    const step = first.offsetWidth + Number.parseFloat(getComputedStyle(track).columnGap || "0");
    setActive(Math.min(slides.length - 1, Math.round(track.scrollLeft / step)));
  };

  return (
    <section aria-roledescription="carousel" aria-label="Our promises" className="pb-24 md:pb-32">
      <div className="max-w-7xl mx-auto px-6 md:px-10 mb-8 md:mb-10 flex items-end justify-between gap-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-clay-deep">Our promise</p>
          <h2 className="mk-reveal mt-3 font-display font-normal text-[clamp(2.5rem,5vw,4.25rem)] leading-[0.95] text-earth">
            Small print, <em className="font-light text-clay">made large.</em>
          </h2>
        </div>
        <div className="hidden gap-3 sm:flex">
          <button
            type="button"
            onClick={() => go(Math.max(0, active - 1))}
            disabled={active === 0}
            aria-label="Previous promise"
            className="grid h-12 w-12 place-items-center rounded-full border border-border bg-[oklch(0.985_0.008_75)] text-earth transition-colors hover:bg-earth hover:text-cream disabled:opacity-40 disabled:hover:bg-[oklch(0.985_0.008_75)] disabled:hover:text-earth"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => go(Math.min(slides.length - 1, active + 1))}
            disabled={active === slides.length - 1}
            aria-label="Next promise"
            className="grid h-12 w-12 place-items-center rounded-full border border-border bg-[oklch(0.985_0.008_75)] text-earth transition-colors hover:bg-earth hover:text-cream disabled:opacity-40 disabled:hover:bg-[oklch(0.985_0.008_75)] disabled:hover:text-earth"
          >
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* The first slide lines up with the heading's container; scroll-padding keeps snapping there too. */}
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-6 scroll-px-6 md:gap-6 md:px-10 md:scroll-px-10 xl:px-[calc((100vw_-_80rem)/2_+_2.5rem)] xl:scroll-px-[calc((100vw_-_80rem)/2_+_2.5rem)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((s, i) => (
          <article
            key={s.eyebrow}
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${slides.length}: ${s.eyebrow}`}
            className={`grid w-[86%] shrink-0 snap-start overflow-hidden rounded-[2rem] transition-opacity duration-500 sm:w-[72%] md:grid-cols-2 lg:w-[min(880px,66%)] ${
              i === active ? "opacity-100" : "md:opacity-60"
            }`}
          >
            <div
              className={`order-2 flex flex-col justify-between gap-6 p-7 md:order-1 md:p-11 ${s.tone.text}`}
            >
              <p className={`text-[11px] uppercase tracking-[0.22em] ${s.tone.eyebrow}`}>
                {s.eyebrow}
              </p>
              <div className="flex flex-col gap-4">
                <h3 className="font-display font-normal text-[clamp(2.25rem,4vw,3.25rem)] leading-[0.98]">
                  {s.title}
                </h3>
                <p className={`text-[15px] leading-relaxed ${s.tone.muted}`}>{s.body}</p>
                {s.extra}
              </div>
              {s.cta.external ? (
                <a
                  href={s.cta.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex min-h-12 items-center self-start rounded-full px-6 text-xs font-medium uppercase tracking-[0.16em] ${s.tone.cta}`}
                >
                  {s.cta.label} →
                </a>
              ) : (
                <Link
                  href={s.cta.href}
                  className={`inline-flex min-h-12 items-center self-start rounded-full px-6 text-xs font-medium uppercase tracking-[0.16em] ${s.tone.cta}`}
                >
                  {s.cta.label} →
                </Link>
              )}
            </div>
            <div
              className={`relative order-1 h-56 md:order-2 md:h-auto md:min-h-[460px] ${s.tone.panel}`}
            >
              <span
                aria-hidden="true"
                className="absolute inset-x-[12%] bottom-[12%] h-[8%] rounded-[50%] bg-earth/15 blur-[2px]"
              />
              {s.pieces.length === 1 && (
                <Piece
                  p={s.pieces[0]}
                  className="absolute inset-x-[12%] bottom-[14%] h-[66%] w-[76%]"
                />
              )}
              {s.pieces.length > 1 && (
                <div className="absolute inset-x-[6%] bottom-[12%] flex h-[70%] items-end justify-center gap-1">
                  {s.pieces.map((p, k) => (
                    <Piece
                      key={p.slug}
                      p={p}
                      className={`min-w-0 ${k === 0 ? "h-full flex-[1.1]" : "h-[62%] flex-1"}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6 flex justify-center gap-1" role="group" aria-label="Choose a promise">
        {slides.map((s, i) => (
          <button
            key={s.eyebrow}
            type="button"
            onClick={() => go(i)}
            aria-label={`Show ${s.eyebrow}`}
            aria-current={i === active}
            className="grid h-8 place-items-center px-1"
          >
            <span
              className={`block h-2 rounded-full transition-[width,background-color] duration-500 ${i === active ? "w-7 bg-earth" : "w-2 bg-earth/25"}`}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
