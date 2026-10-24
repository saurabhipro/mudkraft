"use client";

import Link from "next/link";
import { useState, type CSSProperties, type ReactNode } from "react";
import { Pause, Play } from "lucide-react";

import type { ProductView } from "@/lib/product-view";

/** Rail speed. One full loop of all banners takes this long per banner. */
const SECONDS_PER_BANNER = 14;

const DARK = "#2d1912";
const PEACH = "#e0b08a";
const CLAY = "#a8442a";
const INK = "#3a2018";

type Price = { price: string; compareAt: string | null; off: number | null };

function priceOf(products: ProductView[], slug: string): Price | null {
  const p = products.find((x) => x.slug === slug);
  if (!p) return null;
  const off =
    p.compareAtPaise && p.compareAtPaise > p.pricePaise
      ? Math.round((1 - p.pricePaise / p.compareAtPaise) * 100)
      : null;
  return { price: p.price, compareAt: p.compareAt, off };
}

interface Slide {
  id: string;
  label: string;
  bg: string;
  desktop: ReactNode;
  phone: {
    tone: "dark" | "light";
    eyebrow: string;
    title: string;
    titleEm: string;
    line: string;
    cta: { label: string; href: string; className: string };
    img: string;
    alt: string;
    imgClass: string;
    disc?: string;
  };
}

// ---------------------------------------------------------------- pieces

function Eyebrow({ children, color, code }: { children: ReactNode; color: string; code?: string }) {
  return (
    <p className="text-[13px] tracking-[0.3em] uppercase font-medium" style={{ color }}>
      {children}
      {code && <span className="ml-2.5 tracking-[0.12em] font-normal opacity-70">{code}</span>}
    </p>
  );
}

function Title({ children, em, emColor }: { children: ReactNode; em: string; emColor: string }) {
  return (
    <h2 className="mt-4 font-display font-normal text-[68px] leading-[1.02]">
      {children}
      <br />
      <em style={{ color: emColor }}>{em}</em>
    </h2>
  );
}

function PriceRow({
  price,
  accent,
  muted,
}: {
  price: Price | null;
  accent: string;
  muted: string;
}) {
  if (!price) return null;
  return (
    <p className="mt-5 flex items-baseline gap-3.5">
      <span className="text-[34px] font-medium">{price.price}</span>
      {price.compareAt && (
        <s className="text-[17px]" style={{ color: muted }}>
          {price.compareAt}
        </s>
      )}
      {price.off && (
        <span className="text-xs tracking-[0.16em] font-medium" style={{ color: accent }}>
          {price.off}% OFF
        </span>
      )}
    </p>
  );
}

const ctaBase =
  "inline-flex items-center h-12 px-7 text-[13px] tracking-[0.16em] uppercase font-medium transition-opacity hover:opacity-90";

function Shadow({ style }: { style: CSSProperties }) {
  return (
    <div
      aria-hidden="true"
      className="absolute rounded-[50%] blur-[6px] bg-[rgba(120,90,60,0.24)]"
      style={style}
    />
  );
}

// Every banner part is placed absolutely on the 1440 × 540 artboard.
const textMotion = "absolute";
const imgMotion = "absolute";

// ---------------------------------------------------------------- slides

function buildSlides(products: ProductView[]): Slide[] {
  const handi = priceOf(products, "handi-2-5l");
  const kadhai = priceOf(products, "kadhai-3l");
  const bhagona = priceOf(products, "bhagona-4l");
  const withPrice = (label: string, p: Price | null) => (p ? `${label} · ${p.price}` : label);

  return [
    {
      id: "brand",
      label: "The soul of soil",
      bg: DARK,
      desktop: (
        <>
          <div className={textMotion} style={{ left: 112, top: 96, width: 560 }}>
            <Eyebrow color={PEACH}>Handmade in Khurja · Unglazed river clay</Eyebrow>
            <h2 className="mt-[18px] font-display font-normal text-[72px] leading-[1.02] text-cream">
              The soul of soil,
              <br />
              <em style={{ color: PEACH }}>spun into stillness.</em>
            </h2>
            <p className="mt-[18px] max-w-[470px] text-[17px] leading-relaxed text-cream/85">
              Every pot begins as river clay in the hands of a potter, and ends as a quiet object in
              your home.
            </p>
            <div className="mt-7 flex gap-3.5">
              <a
                href="#collection"
                className={`${ctaBase} text-white`}
                style={{ background: CLAY }}
              >
                Shop the collection
              </a>
              <Link
                href="/soil-report"
                className={`${ctaBase} border text-cream`}
                style={{ borderColor: "rgba(224,176,138,0.6)" }}
              >
                Read the soil report
              </Link>
            </div>
            <p className="mt-[22px] text-xs text-cream/70">
              Prices incl. taxes &amp; delivery · Lab-tested, food-safe clay · No chemical glaze
            </p>
          </div>
          <div
            aria-hidden="true"
            className="absolute rounded-full"
            style={{
              left: 870,
              top: 30,
              width: 560,
              height: 560,
              background: "#3b2219",
              boxShadow: `0 0 0 16px ${DARK}, 0 0 0 17px rgba(224,176,138,0.25)`,
            }}
          />
          <img
            src="/banners/trio.webp"
            alt="Bhagona, kadhai and handi with their lids"
            className={imgMotion}
            style={{ left: 760, bottom: -6, width: 720 }}
          />
        </>
      ),
      phone: {
        tone: "dark",
        eyebrow: "Handmade in Khurja",
        title: "The soul of soil,",
        titleEm: "spun into stillness.",
        line: "Unglazed river clay, thrown by hand and slow-fired for 48 hours.",
        cta: {
          label: "Shop the collection",
          href: "#collection",
          className: "bg-[#a8442a] text-white",
        },
        img: "/banners/trio.webp",
        alt: "Bhagona, kadhai and handi with their lids",
        imgClass: "w-[340px] -bottom-2",
        disc: "#3b2219",
      },
    },
    {
      id: "handi",
      label: "Handi",
      bg: "#e9dfd3",
      desktop: (
        <>
          <Shadow style={{ left: 130, top: 440, width: 660, height: 50 }} />
          <img
            src="/banners/handi-open.webp"
            alt="Clay handi with its lid tilted open"
            className={imgMotion}
            style={{ left: 100, top: 70, width: 700 }}
          />
          <div className={textMotion} style={{ left: 880, top: 100, width: 480, color: INK }}>
            <Eyebrow color={CLAY} code="MUD001">
              Handi · 2.5 L
            </Eyebrow>
            <Title em="of the earth." emColor={CLAY}>
              Dal that tastes
            </Title>
            <p className="mt-4 text-base leading-relaxed text-[#4a3428]">
              Thrown by hand on the wheel and slow-fired for 48 hours. Clay&apos;s gentle, even heat
              keeps every flavour in.
            </p>
            <PriceRow price={handi} accent={CLAY} muted="#7a6a5e" />
            <div className="mt-[18px] flex items-center gap-[18px]">
              <Link
                href="/shop/handi-2-5l"
                className={`${ctaBase} text-cream`}
                style={{ background: INK }}
              >
                Shop the handi
              </Link>
              <span className="text-xs text-[#6a5548]">Incl. taxes &amp; delivery</span>
            </div>
          </div>
        </>
      ),
      phone: {
        tone: "light",
        eyebrow: withPrice("Handi · 2.5 L", handi),
        title: "Dal that tastes",
        titleEm: "of the earth.",
        line: "Slow-fired for 48 hours. Even heat keeps every flavour in.",
        cta: {
          label: "Shop the handi",
          href: "/shop/handi-2-5l",
          className: "bg-[#3a2018] text-cream",
        },
        img: "/banners/handi-open.webp",
        alt: "Clay handi with its lid tilted open",
        imgClass: "w-[330px] bottom-6",
      },
    },
    {
      id: "kadhai",
      label: "Kadhai",
      bg: "#f4ede3",
      desktop: (
        <>
          <div className={textMotion} style={{ left: 112, top: 100, width: 520, color: INK }}>
            <Eyebrow color={CLAY} code="MUD002">
              Kadhai · 3 L
            </Eyebrow>
            <Title em="patient." emColor={CLAY}>
              Wide, shallow,
            </Title>
            <p className="mt-4 text-base leading-relaxed text-[#4a3428]">
              Made for sabzi that cooks slowly and evenly. Unglazed river clay, food-safe and
              lab-tested.
            </p>
            <PriceRow price={kadhai} accent={CLAY} muted="#7a6a5e" />
            <div className="mt-[18px] flex items-center gap-[18px]">
              <Link
                href="/shop/kadhai-3l"
                className={`${ctaBase} text-white`}
                style={{ background: CLAY }}
              >
                Shop the kadhai
              </Link>
              <span className="text-xs text-[#6a5548]">26 × 26 × 10 cm · incl. delivery</span>
            </div>
          </div>
          <div
            aria-hidden="true"
            className="absolute"
            style={{
              left: 760,
              top: 52,
              width: 610,
              height: 560,
              borderRadius: "305px 305px 0 0",
              background: "#ddcdb7",
            }}
          />
          <Shadow style={{ left: 790, top: 440, width: 600, height: 44 }} />
          <img
            src="/banners/kadhai-open.webp"
            alt="Clay kadhai with its lid tilted open"
            className={imgMotion}
            style={{ left: 770, top: 128, width: 640 }}
          />
        </>
      ),
      phone: {
        tone: "light",
        eyebrow: withPrice("Kadhai · 3 L", kadhai),
        title: "Wide, shallow,",
        titleEm: "patient.",
        line: "Made for sabzi that cooks slowly and evenly.",
        cta: {
          label: "Shop the kadhai",
          href: "/shop/kadhai-3l",
          className: "bg-[#a8442a] text-white",
        },
        img: "/banners/kadhai-open.webp",
        alt: "Clay kadhai with its lid tilted open",
        imgClass: "w-[320px] bottom-8",
        disc: "#e3d5c2",
      },
    },
    {
      id: "bhagona",
      label: "Bhagona",
      bg: DARK,
      desktop: (
        <>
          <div
            aria-hidden="true"
            className="absolute rounded-full"
            style={{ left: 175, top: 38, width: 470, height: 470, background: "#e8dfd2" }}
          />
          <img
            src="/banners/bhagona-top.webp"
            alt="Clay bhagona seen from above, lid beside it"
            className={imgMotion}
            style={{ left: 80, top: 110, width: 620 }}
          />
          <div className={`${textMotion} text-cream`} style={{ left: 864, top: 130, width: 520 }}>
            <Eyebrow color={PEACH} code="MUD003">
              Bhagona · 4 L
            </Eyebrow>
            <h2 className="mt-4 font-display font-normal text-[68px] leading-[1.02]">
              Slow food, <em style={{ color: PEACH }}>slower fire.</em>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-cream/85">
              A deep, lidded pot for the whole family&apos;s dal, rice and curries, cooked low and
              even.
            </p>
            <PriceRow price={bhagona} accent={PEACH} muted="rgba(244,237,227,0.6)" />
            <div className="mt-[18px] flex items-center gap-[18px]">
              <Link
                href="/shop/bhagona-4l"
                className={ctaBase}
                style={{ background: "#e8dfd2", color: DARK }}
              >
                Shop the bhagona
              </Link>
              <span className="text-xs text-cream/70">24 × 24 × 18 cm · incl. delivery</span>
            </div>
          </div>
        </>
      ),
      phone: {
        tone: "dark",
        eyebrow: withPrice("Bhagona · 4 L", bhagona),
        title: "Slow food,",
        titleEm: "slower fire.",
        line: "A deep, lidded pot for the whole family's dal and rice.",
        cta: {
          label: "Shop the bhagona",
          href: "/shop/bhagona-4l",
          className: "bg-[#e8dfd2] text-[#2d1912]",
        },
        img: "/banners/bhagona-top.webp",
        alt: "Clay bhagona seen from above",
        imgClass: "w-[300px] bottom-3",
        disc: "#e8dfd2",
      },
    },
    {
      id: "shelf",
      label: "The full shelf",
      bg: "linear-gradient(180deg, #efe4d4 0%, #e6d8c4 100%)",
      desktop: (
        <>
          <div className={textMotion} style={{ left: 112, top: 120, width: 400, color: INK }}>
            <Eyebrow color={CLAY}>The full shelf</Eyebrow>
            <Title em="one wheel." emColor={CLAY}>
              Every piece,
            </Title>
            <p className="mt-4 text-base leading-relaxed text-[#4a3428]">
              Cookware and serveware, all thrown by the same family of potters in Khurja.
            </p>
            <a
              href="#collection"
              className={`${ctaBase} mt-[26px] text-cream`}
              style={{ background: INK }}
            >
              Shop all pieces
            </a>
          </div>
          <div className={imgMotion} style={{ left: 560, top: 0, width: 840, height: 540 }}>
            <img
              src="/banners/jug.webp"
              alt="Clay jug"
              className="absolute h-[170px]"
              style={{ left: 70, bottom: 312 }}
            />
            <img
              src="/banners/handi-open.webp"
              alt="Clay handi"
              className="absolute w-[270px]"
              style={{ left: 290, bottom: 314 }}
            />
            <img
              src="/banners/roaster.webp"
              alt="Clay roaster"
              className="absolute w-[175px]"
              style={{ left: 610, bottom: 312 }}
            />
            <Plank top={228} />
            <img
              src="/banners/trio.webp"
              alt="Bhagona, kadhai and handi"
              className="absolute w-[360px]"
              style={{ left: 40, bottom: 72 }}
            />
            <img
              src="/banners/kadhai-open.webp"
              alt="Clay kadhai"
              className="absolute w-[320px]"
              style={{ left: 470, bottom: 74 }}
            />
            <Plank top={468} />
            <Tag left={120} top={248}>
              MUD005 · Jug
            </Tag>
            <Tag left={380} top={248}>
              MUD001 · Handi
            </Tag>
            <Tag left={650} top={248}>
              MUD004 · Roaster
            </Tag>
            <Tag left={150} top={488}>
              The cookware set
            </Tag>
            <Tag left={580} top={488}>
              MUD002 · Kadhai
            </Tag>
          </div>
        </>
      ),
      phone: {
        tone: "light",
        eyebrow: "The full shelf",
        title: "Every piece,",
        titleEm: "one wheel.",
        line: "Cookware and serveware, all from one family of potters.",
        cta: {
          label: "Shop all pieces",
          href: "#collection",
          className: "bg-[#3a2018] text-cream",
        },
        img: "/banners/trio.webp",
        alt: "Bhagona, kadhai and handi",
        imgClass: "w-[300px] bottom-14",
      },
    },
    {
      id: "catalogue",
      label: "Catalogue",
      bg: "#f4ede3",
      desktop: (
        <>
          <div className={textMotion} style={{ left: 112, top: 120, width: 380, color: INK }}>
            <Eyebrow color={CLAY}>Catalogue 2026</Eyebrow>
            <Title em="piece by piece." emColor={CLAY}>
              Start a clay kitchen,
            </Title>
            <a
              href="#collection"
              className={`${ctaBase} mt-[30px] border`}
              style={{ borderColor: INK, color: INK }}
            >
              Browse the collection
            </a>
          </div>
          <div
            className={`${imgMotion} grid grid-cols-4 border-t border-l border-[#cdbca6]`}
            style={{ left: 540, top: 60, width: 840, height: 420, color: INK }}
          >
            {[
              { n: "01", name: "Handi", cat: "Cookware · 2.5 L", img: "/banners/handi-open.webp" },
              { n: "02", name: "Kadhai", cat: "Cookware · 3 L", img: "/banners/kadhai-open.webp" },
              { n: "03", name: "Bhagona", cat: "Cookware · 4 L", img: "/banners/bhagona-top.webp" },
              { n: "05", name: "Jug", cat: "Serveware · 1.5 L", img: "/banners/jug.webp" },
            ].map((c) => (
              <div key={c.n} className="flex flex-col p-[18px] border-r border-b border-[#cdbca6]">
                <span className="font-display italic text-[22px]" style={{ color: CLAY }}>
                  No. {c.n}
                </span>
                <div className="flex-1 grid place-items-center">
                  <img src={c.img} alt={c.name} className="max-w-full max-h-[190px]" />
                </div>
                <span className="font-display text-[26px] leading-none">{c.name}</span>
                <span className="mt-1 text-[11px] tracking-[0.16em] uppercase text-[#7a6a5e]">
                  {c.cat}
                </span>
              </div>
            ))}
          </div>
        </>
      ),
      phone: {
        tone: "light",
        eyebrow: "Catalogue 2026",
        title: "Start a clay kitchen,",
        titleEm: "piece by piece.",
        line: "Seven pieces for cooking and serving.",
        cta: {
          label: "Browse the collection",
          href: "#collection",
          className: "bg-[#3a2018] text-cream",
        },
        img: "/banners/handi-open.webp",
        alt: "Clay handi",
        imgClass: "w-[300px] bottom-8",
      },
    },
    {
      id: "set",
      label: "Cookware set",
      bg: `radial-gradient(ellipse at 72% 70%, #6b3320 0%, ${DARK} 55%)`,
      desktop: (
        <>
          <div className={`${textMotion} text-cream`} style={{ left: 112, top: 120, width: 520 }}>
            <Eyebrow color={PEACH}>The cookware set</Eyebrow>
            <Title em="in clay." emColor={PEACH}>
              Cook the whole meal
            </Title>
            <p className="mt-4 max-w-[440px] text-base leading-relaxed text-cream/85">
              Bhagona, kadhai and handi: dal, sabzi and rice, slow and even on a low flame.
            </p>
            <a
              href="#collection"
              className={`${ctaBase} mt-[26px] text-white`}
              style={{ background: CLAY }}
            >
              Shop cookware
            </a>
          </div>
          <TextRing
            className="absolute animate-spin-slower"
            style={{ left: 760, top: -40, width: 600, height: 600 }}
            text="SLOW FIRED FOR 48 HOURS · HAND THROWN IN KHURJA · UNGLAZED RIVER CLAY · NO MOULDS ·"
            radius={262}
            fontSize={15}
          />
          <div
            aria-hidden="true"
            className="absolute rounded-[50%]"
            style={{
              left: 820,
              top: 420,
              width: 480,
              height: 110,
              background: "linear-gradient(180deg, #4a2a1e, #24130d)",
              boxShadow: "inset 0 6px 0 rgba(224,176,138,0.18), 0 30px 40px -20px rgba(0,0,0,0.7)",
            }}
          />
          <img
            src="/banners/trio.webp"
            alt="Bhagona, kadhai and handi on a potter's wheel"
            className={imgMotion}
            style={{ left: 850, top: 150, width: 420 }}
          />
        </>
      ),
      phone: {
        tone: "dark",
        eyebrow: "The cookware set",
        title: "Cook the whole meal",
        titleEm: "in clay.",
        line: "Dal, sabzi and rice, slow and even on a low flame.",
        cta: { label: "Shop cookware", href: "#collection", className: "bg-[#a8442a] text-white" },
        img: "/banners/trio.webp",
        alt: "Bhagona, kadhai and handi",
        imgClass: "w-[320px] bottom-0",
        disc: "#24130d",
      },
    },
  ];
}

function Plank({ top }: { top: number }) {
  return (
    <div
      aria-hidden="true"
      className="absolute left-0 right-0 h-5 rounded-sm shadow-[0_14px_18px_-10px_rgba(60,35,20,0.55)]"
      style={{ top, background: "linear-gradient(180deg, #a7714a 0%, #8a5a3a 60%, #6e4529 100%)" }}
    />
  );
}

function Tag({ left, top, children }: { left: number; top: number; children: ReactNode }) {
  return (
    <span
      className="absolute px-2 py-1 rounded-sm bg-[#d9b98f] text-[11px] tracking-[0.08em]"
      style={{ left, top, color: INK }}
    >
      {children}
    </span>
  );
}

/** Words set around a circle, for the slowly turning rings. */
export function TextRing({
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

// ---------------------------------------------------------------- rail

/**
 * The banners as a continuous rail of cards gliding right to left. The set is
 * rendered twice and the track slides by exactly one set, so the loop has no seam.
 * It pauses on hover, on keyboard focus and with the pause button; with reduced
 * motion it stands still and scrolls by hand instead.
 */
export function BannerRail({ products }: { products: ProductView[] }) {
  const slides = buildSlides(products);
  const [paused, setPaused] = useState(false);
  const [hovering, setHovering] = useState(false);
  const running = !paused && !hovering;

  const card = (s: Slide, copy: number) => {
    const dark = s.phone.tone === "dark";
    return (
      <div
        key={`${copy}-${s.id}`}
        role="group"
        aria-roledescription="banner"
        aria-label={s.label}
        className="relative shrink-0 mr-4 lg:mr-6 overflow-hidden ring-1 ring-inset ring-white/10 rounded-[22px] lg:rounded-[28px] w-[300px] h-[440px] sm:w-[340px] sm:h-[480px] lg:w-[calc(1440px*var(--rail-s))] lg:h-[calc(540px*var(--rail-s))]"
        style={{ background: s.bg }}
      >
        {/* Desktop: the banner as composed, scaled into the card */}
        <div
          className="hidden lg:block absolute left-0 top-0 w-[1440px] h-[540px] origin-top-left"
          style={{ transform: "scale(var(--rail-s))" }}
        >
          {s.desktop}
        </div>

        {/* Phones and tablets: copy on top, product below */}
        <div
          className={`lg:hidden absolute inset-0 flex flex-col items-center text-center px-5 pt-8 ${dark ? "text-cream" : "text-[#3a2018]"}`}
        >
          <div className="relative z-10">
            <p
              className="text-[10px] tracking-[0.26em] uppercase font-medium"
              style={{ color: dark ? PEACH : CLAY }}
            >
              {s.phone.eyebrow}
            </p>
            <h2 className="mt-2.5 font-display font-normal text-[2.1rem] sm:text-[2.4rem] leading-[1.02]">
              {s.phone.title} <em style={{ color: dark ? PEACH : CLAY }}>{s.phone.titleEm}</em>
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed opacity-85">{s.phone.line}</p>
            <a
              href={s.phone.cta.href}
              className={`mt-3.5 inline-flex items-center h-11 px-5 text-[11px] tracking-[0.16em] uppercase font-medium ${s.phone.cta.className}`}
            >
              {s.phone.cta.label}
            </a>
          </div>
          {s.phone.disc && (
            <div
              aria-hidden="true"
              className="absolute left-1/2 -bottom-28 w-[300px] h-[300px] -translate-x-1/2 rounded-full"
              style={{ background: s.phone.disc }}
            />
          )}
          <img
            src={s.phone.img}
            alt={s.phone.alt}
            className={`absolute left-1/2 -translate-x-1/2 scale-[0.88] origin-bottom ${s.phone.imgClass}`}
          />
        </div>
      </div>
    );
  };

  return (
    <section
      aria-label="Featured pieces"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocus={() => setHovering(true)}
      onBlur={() => setHovering(false)}
      className="relative [--rail-s:0.6] xl:[--rail-s:0.66] 2xl:[--rail-s:0.72]"
    >
      <div className="overflow-hidden motion-reduce:overflow-x-auto [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]">
        <div
          className="flex w-max animate-marquee motion-reduce:animate-none motion-reduce:px-5"
          style={{
            animationDuration: `${slides.length * SECONDS_PER_BANNER}s`,
            animationPlayState: running ? "running" : "paused",
          }}
        >
          {slides.map((s) => card(s, 0))}
          {/* The second copy only exists to close the loop. */}
          <div aria-hidden="true" inert className="flex motion-reduce:hidden">
            {slides.map((s) => card(s, 1))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-center motion-reduce:hidden">
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? "Play the banners" : "Pause the banners"}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-full border border-cream/20 text-cream/75 text-[11px] tracking-[0.18em] uppercase hover:text-cream hover:border-cream/40 transition-colors"
        >
          {paused ? (
            <Play className="w-3 h-3 fill-current" />
          ) : (
            <Pause className="w-3 h-3 fill-current" />
          )}
          {paused ? "Play" : "Pause"}
        </button>
      </div>
    </section>
  );
}
