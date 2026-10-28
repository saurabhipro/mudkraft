"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

import { SiteHeader } from "@/components/SiteHeader";
import { ClayPlinth, HoldsBadge } from "@/components/ClayPlinth";
import { variantLabel, type ProductFamily, type ProductView } from "@/lib/product-view";
import { formatPaise } from "@/lib/money";
import { CATALOGUE_CODES, catalogueSlug } from "@/lib/catalogue";
import type { ReviewSummaryView, ReviewView } from "@/lib/review-view";
import { addToCart, useCartCount } from "@/lib/cart";
import { ShareButton } from "@/components/ShareButton";
import { ReviewsSection } from "@/components/ReviewsSection";
import { SITE_URL } from "@/lib/seo";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { whatsappLink } from "@/lib/whatsapp";
import stepSoak from "@/assets/step-soak.jpg";
import stepDry from "@/assets/step-dry.jpg";
import stepOil from "@/assets/step-oil.jpg";

// Delivery promises from /shipping-returns, shown beside the photographs.
const PERKS = [
  { text: "Ships in 2–3 days, tracking on WhatsApp", icon: "M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a1.5 1.5 0 1 0 0-.01M17 19a1.5 1.5 0 1 0 0-.01" },
  { text: "Breakage cover, free replacement or refund", icon: "M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" },
  { text: "Hand packed in a double-walled carton", icon: "M4 8l8-4 8 4-8 4zM4 8v8l8 4 8-4V8" },
];

// A short version of /care/season-your-handi, shown on cookware pages.
const SEASONING = [
  {
    title: "Soak in water",
    img: stepSoak.src,
    body: "Submerge it completely, lid too, so the clay drinks into every pore.",
  },
  {
    title: "Dry in the shade",
    img: stepDry.src,
    body: "Upside-down on a cloth, out of direct sun, until it is one even colour.",
  },
  {
    title: "Oil the inside",
    img: stepOil.src,
    body: "A thin layer of mustard or coconut oil forms the first seasoning.",
  },
];

function whatsappBuyNow(p: ProductView, qty: number) {
  return whatsappLink([
    "Namaste Mudkraft 🙏",
    `I'd like to order ${qty} × ${p.name} (${p.tag}).`,
    `Total: ${formatPaise(p.pricePaise * qty)}`,
    "",
    "Please share dispatch & payment details. Dhanyavaad 🙏",
  ]);
}

export function ProductDetail({
  product: p,
  sizes,
  alsoLove,
  reviews,
  reviewSummary,
}: {
  product: ProductView;
  /** Every variant of this product type; a single entry when there is only one. */
  sizes: ProductView[];
  /** Other product types, each with its sizes. */
  alsoLove: ProductFamily[];
  reviews: ReviewView[];
  reviewSummary: ReviewSummaryView;
}) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [openPanel, setOpenPanel] = useState<string | null>("specs");
  const cartCount = useCartCount();
  // The cutout leads (it stands on the plinth best), then every photograph.
  const shots = [...new Set([p.cutout, ...p.gallery, p.img].filter((x): x is string => Boolean(x)))];
  // Another size is another page: it opens on its first photograph.
  const [picked, setPicked] = useState({ slug: p.slug, i: 0 });
  const shot = picked.slug === p.slug ? Math.min(picked.i, Math.max(shots.length - 1, 0)) : 0;
  const setShot = (i: number) => setPicked({ slug: p.slug, i });

  // Bikriup says how many are left (99 when it only knows "in stock").
  const soldOut = p.stockQty <= 0;
  const few = !soldOut && p.stockQty <= 5;
  // Another size is another page: its quantity starts again at one.
  useEffect(() => setQty(1), [p.slug]);

  const handleAdd = () => {
    if (!addToCart(p, qty)) return;
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  };

  const oneName = sizes.every((s) => s.name === p.name);
  const isCookware = p.category?.toLowerCase() === "cookware";
  const quickFacts = p.specs.slice(0, 3);
  const panels: Array<{ id: string; title: string; body: ReactNode }> = [];
  if (p.specs.length > 0)
    panels.push({
      id: "specs",
      title: "Specifications",
      body: (
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8">
          {p.specs.map((s) => (
            <div
              key={s.label}
              className="flex justify-between gap-4 border-b border-border/60 pb-2"
            >
              <dt className="text-sm text-muted-foreground">{s.label}</dt>
              <dd className="text-sm text-earth font-medium text-right">{s.value}</dd>
            </div>
          ))}
        </dl>
      ),
    });
  if (p.care.length > 0)
    panels.push({
      id: "care",
      title: "Seasoning & care",
      body: (
        <>
          <ul className="space-y-2 text-sm text-foreground/85">
            {p.care.map((c) => (
              <li key={c} className="flex gap-3">
                <span className="text-clay mt-1">◦</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/care/season-your-handi"
            className="mk-link mt-4 inline-block text-xs tracking-widest uppercase text-earth"
          >
            Read the full care guide →
          </Link>
        </>
      ),
    });

  // Under the photo on desktop (the left column was empty there), under the buttons on phones.
  const perks = (
    <ul className="flex flex-col justify-center gap-2 text-[13px] text-muted-foreground">
      {PERKS.map((perk) => (
        <li key={perk.text}>
          <Link href="/shipping-returns" className="flex items-center gap-2.5 transition-colors hover:text-earth">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-clay-deep"
            >
              <path d={perk.icon} />
            </svg>
            {perk.text}
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SiteHeader
        cartCount={cartCount}
        cartHref={cartCount > 0 ? "/checkout" : "/#collection"}
        rightSlot={
          // There is no cart drawer on this page, so the basket goes where the
          // items can actually be reviewed and paid for.
          <Link
            href={cartCount > 0 ? "/checkout" : "/#collection"}
            className="relative inline-flex items-center gap-2.5 text-xs tracking-widest uppercase bg-earth text-cream pl-4 sm:pl-5 pr-2 min-h-[44px] rounded-full hover:bg-ink transition-colors"
          >
            Basket
            <span
              key={cartCount}
              className="inline-flex items-center justify-center min-w-[30px] h-[30px] px-1.5 rounded-full bg-clay text-cream text-[12px] font-medium tracking-normal animate-in zoom-in-50 duration-500 ease-[var(--ease-spring)]"
            >
              {cartCount}
            </span>
          </Link>
        }
      />

      <nav
        aria-label="Breadcrumb"
        className="max-w-7xl mx-auto px-6 md:px-10 pt-28 md:pt-32 text-xs tracking-widest uppercase text-muted-foreground animate-fade-up"
      >
        <Link href="/" className="mk-link hover:text-earth">
          Home
        </Link>
        <span className="mx-2" aria-hidden="true">
          /
        </span>
        <Link href="/#collection" className="mk-link hover:text-earth">
          Collection
        </Link>
        <span className="mx-2" aria-hidden="true">
          /
        </span>
        <span className="text-earth">{p.name}</span>
      </nav>

      <section className="max-w-7xl mx-auto px-6 md:px-10 pt-8 pb-20 md:pt-10 md:pb-28 grid grid-cols-1 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-10 md:gap-16 items-start">
        <div className="md:sticky md:top-28">
          <div className="group relative aspect-square overflow-hidden rounded-[2rem] animate-fade-up">
            <ClayPlinth
              product={p}
              src={shots[shot] ?? null}
              alt={`Handcrafted ${p.name} — ${p.tag} from Mudkraft, photograph ${shot + 1}`}
              priority
            />
            <div className="pointer-events-none absolute left-5 right-[104px] top-5 flex flex-col gap-0.5 md:left-6 md:right-[120px] md:top-6">
              <span className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">
                {p.category || p.tag}
              </span>
              {p.note && <span className="font-display text-xl italic text-clay-deep md:text-2xl">{p.note}</span>}
            </div>
            {/\d/.test(p.sizeLabel) && (
              <HoldsBadge size={p.sizeLabel} className="right-5 top-5 h-[72px] w-[72px] text-[26px] md:h-20 md:w-20" />
            )}
            {shots.length > 1 && (
              <div className="absolute inset-x-0 bottom-5 flex justify-center gap-2" role="tablist" aria-label="Product photographs">
                {shots.map((src, i) => (
                  <button
                    key={src}
                    type="button"
                    role="tab"
                    aria-selected={i === shot}
                    aria-label={`Photograph ${i + 1} of ${shots.length}`}
                    onClick={() => setShot(i)}
                    className="grid h-6 place-items-center px-0.5"
                  >
                    <span
                      className={`block h-2 rounded-full transition-[width,background-color] duration-500 ease-[var(--ease-clay)] ${i === shot ? "w-7 bg-earth" : "w-2 bg-earth/25"}`}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="mt-4 flex flex-wrap items-stretch gap-3">
            {shots.length > 1 &&
              shots.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  aria-label={`Show photograph ${i + 1}`}
                  aria-pressed={i === shot}
                  onClick={() => setShot(i)}
                  className={`group relative h-[88px] w-[88px] overflow-hidden rounded-[1.25rem] transition-opacity duration-300 ${i === shot ? "" : "opacity-80 hover:opacity-100"}`}
                >
                  <ClayPlinth product={p} src={src} alt="" />
                  {i === shot && <span aria-hidden="true" className="absolute inset-0 rounded-[1.25rem] ring-2 ring-inset ring-earth" />}
                </button>
              ))}
            <div className="hidden min-w-[220px] flex-1 pl-2 md:flex">{perks}</div>
          </div>
        </div>

        <div>
          <p className="font-hand text-clay-deep text-2xl md:text-[1.65rem] animate-fade-up">
            {p.note}
          </p>
          <div className="mt-1 text-[11px] tracking-[0.35em] uppercase text-clay-deep">
            {[p.category, CATALOGUE_CODES[catalogueSlug(p) ?? ""]].filter(Boolean).join(" · ")}
          </div>
          <h1 className="mt-2 font-display font-normal text-[clamp(3.5rem,8vw,6rem)] text-earth leading-[0.9]">
            <span className="mk-line">
              <span style={{ animationDelay: "0.1s" }}>{p.name}</span>
            </span>
          </h1>

          {(() => {
            const s = reviewSummary;
            if (!s.count) return null;
            return (
              <a
                href="#reviews"
                className="mt-4 inline-flex items-center gap-2 text-sm text-earth/80 hover:text-earth"
              >
                <span className="inline-flex items-center gap-0.5 text-gold" aria-hidden="true">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <svg
                      key={i}
                      viewBox="0 0 24 24"
                      className="w-4 h-4"
                      fill={i < Math.round(s.average) ? "currentColor" : "rgba(0,0,0,0.15)"}
                    >
                      <path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.5l1.1-6.5L2.6 9.4l6.5-.9L12 2.6z" />
                    </svg>
                  ))}
                </span>
                <span className="tabular-nums">{s.average.toFixed(1)}</span>
                <span className="text-muted-foreground">
                  · {s.count} review{s.count === 1 ? "" : "s"}
                </span>
              </a>
            );
          })()}

          <div className="mt-6 flex flex-wrap items-baseline gap-x-4 gap-y-2 animate-fade-up [animation-delay:0.15s]">
            <div className="font-display text-4xl text-earth">{p.price}</div>
            {p.compareAt && (
              <div className="font-display text-xl text-muted-foreground line-through">
                {p.compareAt}
              </div>
            )}
            <div className="text-xs tracking-widest uppercase text-muted-foreground">
              {p.fulfilmentMode === "pickup_only"
                ? "Studio pickup · incl. taxes"
                : "Incl. taxes & delivery"}
            </div>
          </div>

          <p className="mt-7 text-lg leading-relaxed text-foreground/85 animate-fade-up [animation-delay:0.25s]">
            {p.description}
          </p>
          {p.story && (
            <p className="mt-4 font-display italic text-earth/80 text-xl animate-fade-up [animation-delay:0.3s]">
              &ldquo;{p.story}&rdquo;
            </p>
          )}

          {quickFacts.length > 0 && (
            <dl className="mt-7 grid grid-cols-2 sm:grid-cols-3 gap-2.5 animate-fade-up [animation-delay:0.35s]">
              {quickFacts.map((s) => (
                <div
                  key={s.label}
                  className="flex flex-col-reverse px-4 py-3.5 rounded-2xl bg-sand"
                >
                  <dt className="text-[11px] tracking-[0.14em] uppercase text-muted-foreground">
                    {s.label}
                  </dt>
                  <dd className="font-display text-2xl leading-tight text-earth">{s.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {sizes.length > 1 && (
            <div className="mt-7 animate-fade-up [animation-delay:0.35s]">
              <div className="flex items-baseline justify-between gap-4">
                <div className="text-[11px] tracking-[0.3em] uppercase text-earth font-medium">
                  {oneName ? "Choose your size" : "Choose your piece"}
                </div>
                <div className="text-xs text-muted-foreground">{variantLabel(p, sizes)}</div>
              </div>
              {/* Each variant is its own product page, so the URL, price and basket line
                  all follow the choice. replace keeps the back button tidy. */}
              <div
                role="group"
                aria-label={oneName ? "Size" : "Variant"}
                className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3"
              >
                {sizes.map((size) => {
                  const current = size.slug === p.slug;
                  const gone = size.stockQty <= 0;
                  return (
                    <Link
                      key={size.slug}
                      href={`/shop/${size.slug}`}
                      replace
                      scroll={false}
                      aria-current={current ? "page" : undefined}
                      className={`${gone && !current ? "opacity-55 " : ""}flex flex-col justify-center gap-1 min-h-[76px] px-4 py-3 rounded-[1.1rem] border-[1.5px] transition-[background-color,border-color,color,box-shadow,transform] duration-500 ease-[var(--ease-clay)] hover:-translate-y-0.5 ${
                        current
                          ? "bg-earth border-earth text-cream shadow-[0_18px_36px_-22px_rgba(59,42,34,0.7)]"
                          : "bg-cream/70 border-border text-earth hover:border-earth/50"
                      }`}
                    >
                      <span className="font-display text-lg leading-tight">
                        {oneName ? size.sizeLabel || "One size" : size.name}
                      </span>
                      <span
                        className={`flex items-baseline justify-between gap-2 text-[13px] ${current ? "text-cream/75" : "text-muted-foreground"}`}
                      >
                        <span>{oneName ? "" : size.sizeLabel}</span>
                        <span className={current ? "text-cream" : "text-earth/80"}>
                          {gone ? "Sold out" : size.price}
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          <ul className="mt-6 flex flex-wrap gap-2 animate-fade-up [animation-delay:0.4s]">
            {["Handmade, no moulds", "Lab-tested food safe", "No chemical glaze"].map((chip) => (
              <li
                key={chip}
                className="px-3.5 py-2 rounded-full border border-border text-[13px] text-earth"
              >
                {chip === "Lab-tested food safe" ? (
                  <Link href="/soil-report" className="hover:text-clay-deep transition-colors">
                    {chip}
                  </Link>
                ) : (
                  chip
                )}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-3 animate-fade-up [animation-delay:0.45s]">
            <div className="inline-flex items-center rounded-full border border-earth/25">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-12 h-[60px] rounded-l-full text-xl text-earth hover:bg-sand transition-colors"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span
                key={qty}
                aria-live="polite"
                className="w-8 text-center text-lg font-medium text-earth animate-in zoom-in-50 duration-300"
              >
                {qty}
              </span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(q + 1, Math.max(1, p.stockQty)))}
                disabled={soldOut || qty >= p.stockQty}
                className="w-12 h-[60px] rounded-r-full text-xl text-earth hover:bg-sand transition-colors disabled:opacity-35 disabled:hover:bg-transparent"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={handleAdd}
              disabled={soldOut}
              className={`flex-1 min-w-[200px] inline-flex items-center justify-center gap-2.5 min-h-[60px] px-7 rounded-full text-cream text-base font-medium transition-[background-color,transform] duration-500 ease-[var(--ease-clay)] ${
                soldOut
                  ? "bg-earth/35 cursor-not-allowed"
                  : added
                    ? "bg-sage hover:-translate-y-0.5 active:scale-[0.98]"
                    : "bg-clay hover:bg-clay-deep hover:-translate-y-0.5 active:scale-[0.98]"
              }`}
            >
              {added && (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  aria-hidden="true"
                  className="w-[18px] h-[18px]"
                >
                  <path d="M5 12l5 5L20 7" className="animate-check-draw" />
                </svg>
              )}
              {soldOut
                ? "Sold out"
                : added
                  ? "Added to basket"
                  : `Add to basket · ${formatPaise(p.pricePaise * qty)}`}
            </button>
          </div>
          {(soldOut || few) && (
            <p className="mt-3 text-sm text-clay-deep" role="status">
              {soldOut
                ? "Sold out for now — ask on WhatsApp and we'll tell you when the next firing is ready."
                : `Only ${p.stockQty} left`}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-3 animate-fade-up [animation-delay:0.5s]">
            <a
              href={whatsappBuyNow(p, qty)}
              target="_blank"
              rel="noopener noreferrer"
              className="mk-btn-fill flex-1 min-w-[200px] inline-flex items-center justify-center gap-2.5 min-h-[58px] px-6 rounded-full border-[1.5px] border-earth text-earth text-base font-medium"
            >
              <WhatsAppIcon className="w-4 h-4" />
              Ask on WhatsApp
            </a>
            <ShareButton
              title={`${p.name} — Mudkraft`}
              text={p.description.slice(0, 120)}
              url={`${SITE_URL}/shop/${p.slug}`}
              label="Share"
            />
          </div>

          {added && (
            <Link
              href="/checkout"
              className="mk-link mt-4 inline-block text-xs tracking-widest uppercase text-clay-deep animate-fade-up"
            >
              Go to checkout →
            </Link>
          )}

          <div className="mt-6 md:hidden">{perks}</div>

          {panels.length > 0 && (
            <div className="mt-10 border-t border-border">
              {panels.map((panel) => {
                const isOpen = openPanel === panel.id;
                return (
                  <div key={panel.id} className="border-b border-border">
                    <h2>
                      <button
                        type="button"
                        onClick={() => setOpenPanel(isOpen ? null : panel.id)}
                        aria-expanded={isOpen}
                        aria-controls={`panel-${panel.id}`}
                        className="w-full min-h-[64px] flex items-center justify-between gap-4 text-left font-display text-[1.75rem] text-earth"
                      >
                        {panel.title}
                        <span
                          aria-hidden="true"
                          className={`grid place-items-center w-8 h-8 rounded-full bg-sand font-sans text-lg transition-transform duration-500 ease-[var(--ease-clay)] ${
                            isOpen ? "rotate-45" : ""
                          }`}
                        >
                          +
                        </span>
                      </button>
                    </h2>
                    {/* Grid-rows 0fr→1fr animates to the panel's natural height. */}
                    <div
                      id={`panel-${panel.id}`}
                      className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[var(--ease-clay)] ${
                        isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="pb-6">{panel.body}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {isCookware && (
        <section className="bg-earth text-cream px-6 md:px-10 py-20 md:py-28 grain">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap items-end justify-between gap-6 mb-10 md:mb-12">
              <h2 className="mk-reveal font-display font-normal text-[clamp(2.5rem,5vw,4.5rem)] leading-none">
                Before its first <em className="font-light text-gold">fire.</em>
              </h2>
              <Link
                href="/care/season-your-handi"
                className="mk-link text-gold text-xs tracking-[0.16em] uppercase"
              >
                Full seasoning guide →
              </Link>
            </div>
            <ol className="grid sm:grid-cols-3 gap-5">
              {SEASONING.map((step, i) => (
                <li
                  key={step.title}
                  className="mk-reveal group rounded-3xl overflow-hidden bg-cream/[0.06]"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={step.img}
                      alt=""
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-[1600ms] ease-[var(--ease-clay)] group-hover:scale-[1.06]"
                    />
                  </div>
                  <div className="p-6">
                    <span className="font-display text-xl text-ember">0{i + 1}</span>
                    <h3 className="mt-1 mb-1.5 font-display text-[1.75rem]">{step.title}</h3>
                    <p className="text-sm leading-relaxed text-cream/75">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      <ReviewsSection slug={p.slug} name={p.name} reviews={reviews} summary={reviewSummary} />

      {alsoLove.length > 0 && (
        <section className="py-20 md:py-28 border-t border-border">
          <div className="max-w-7xl mx-auto px-6 md:px-10">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
              <div>
                <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-clay-deep">From the same kiln</p>
                <h2 className="font-display font-normal text-[clamp(2.25rem,4vw,3.5rem)] leading-none text-earth">
                  Keeps good <em className="font-light text-clay">company.</em>
                </h2>
              </div>
              <Link
                href="/#collection"
                className="mk-link text-xs tracking-widest uppercase text-muted-foreground hover:text-earth"
              >
                All pieces →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {alsoLove.map((family) => (
                <RelatedCard key={family.key} family={family} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

/** A related piece: plinth photo, sizes, measurements, share, and a one-tap add. */
function RelatedCard({ family }: { family: ProductFamily }) {
  const [slug, setSlug] = useState(() => {
    const sizes = [...family.sizes].reverse();
    return (sizes.find((size) => size.stockQty > 0) ?? sizes[0]).slug;
  });
  const [added, setAdded] = useState(false);
  const p = family.sizes.find((size) => size.slug === slug) ?? family.sizes[0];
  const soldOut = p.stockQty <= 0;
  const few = !soldOut && p.stockQty <= 5;
  const href = `/shop/${p.slug}`;
  const labels = family.sizes.map((size) => size.sizeLabel || "One size");
  const chip = (size: ProductView, i: number) =>
    labels.indexOf(labels[i]) === labels.lastIndexOf(labels[i]) ? labels[i] : variantLabel(size, family.sizes);

  const add = () => {
    if (!addToCart(p, 1)) return;
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <article className="group relative flex min-w-0 flex-col gap-3 rounded-[1.6rem] bg-[oklch(0.925_0.025_75)] p-2.5 transition-[background-color,box-shadow] duration-500 hover:bg-white hover:shadow-[0_24px_40px_-28px_rgba(59,42,34,0.4)] sm:flex-row sm:gap-5">
      <div className="relative h-[190px] w-full shrink-0 overflow-hidden rounded-[1.2rem] sm:h-[238px] sm:w-[180px]">
        <Link href={href} aria-label={`View ${p.name} ${p.sizeLabel}`.trim()} className="absolute inset-0">
          <ClayPlinth product={p} />
        </Link>
        {/\d/.test(p.sizeLabel) && <HoldsBadge size={p.sizeLabel} className="left-2.5 top-2.5 h-12 w-12 text-base" />}
        {few && (
          <span className="pointer-events-none absolute bottom-2.5 left-2.5 rounded-full bg-clay-deep px-2 py-0.5 text-[11px] font-semibold text-cream">
            Only {p.stockQty} left
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2.5 px-1.5 pb-1 sm:px-0 sm:py-1 sm:pr-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">
            {[p.category, "Khurja clay"].filter(Boolean).join(" · ")}
          </span>
          <ShareButton
            title={`${p.name} ${p.sizeLabel}`.trim()}
            text={p.note || "Handcrafted clay from Mudkraft."}
            url={`${SITE_URL}${href}`}
            label={`Share ${p.name}`}
            icon="-my-1 grid h-9 w-9 place-items-center rounded-full bg-cream text-earth transition-colors hover:bg-earth hover:text-cream"
          />
        </div>
        <div>
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="min-w-0 truncate font-display text-[1.75rem] leading-none text-earth">
              <Link href={href} className="transition-colors hover:text-clay-deep">
                {family.sizes.every((size) => size.name === p.name) ? p.name : family.name}
              </Link>
            </h3>
            <span className="shrink-0 font-display text-2xl text-earth">{p.price}</span>
          </div>
          {p.note && <p className="mt-0.5 truncate font-hand text-lg text-clay-deep">{p.note}</p>}
        </div>
        <p className="flex flex-wrap gap-x-3 text-[12.5px] text-muted-foreground">
          {p.sizeLabel && (
            <span>
              Holds <b className="text-earth">{p.sizeLabel}</b>
            </span>
          )}
          {p.widthCm && (
            <span>
              Ø <b className="text-earth">{p.widthCm} cm</b>
            </span>
          )}
          {p.heightCm && (
            <span>
              Tall <b className="text-earth">{p.heightCm} cm</b>
            </span>
          )}
          <span>No glaze</span>
        </p>
        <div role="group" aria-label={`${family.name} size`} className="flex flex-wrap gap-1.5">
          {family.sizes.map((size, i) => (
            <button
              key={size.slug}
              type="button"
              onClick={() => setSlug(size.slug)}
              aria-pressed={size.slug === p.slug}
              className={`min-h-9 min-w-[52px] rounded-full border-[1.5px] px-3 text-[12.5px] transition-colors ${
                size.slug === p.slug
                  ? "border-earth bg-earth font-semibold text-cream"
                  : "border-border text-earth hover:border-clay"
              } ${size.stockQty <= 0 ? "line-through opacity-50" : ""}`}
            >
              {chip(size, i)}
            </button>
          ))}
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-2.5">
          <span className="text-[11.5px] leading-snug text-muted-foreground">
            Ships in 2–3 days
            <br />
            Breakage cover
          </span>
          {added ? (
            <span role="status" className="flex min-h-11 items-center gap-1.5 rounded-full bg-earth px-4 text-[13px] font-semibold text-cream">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true" className="h-4 w-4">
                <path d="M5 12.5l4.5 4.5L19 7" />
              </svg>
              Added
            </span>
          ) : (
            <button
              type="button"
              disabled={soldOut}
              onClick={add}
              aria-label={soldOut ? `${p.name} ${p.sizeLabel} is sold out` : `Add ${p.name} ${p.sizeLabel} to basket`}
              className="flex min-h-11 items-center gap-1.5 rounded-full bg-clay-deep px-[18px] text-[13px] font-semibold text-cream transition-colors hover:bg-earth disabled:cursor-not-allowed disabled:bg-transparent disabled:text-muted-foreground disabled:ring-1 disabled:ring-border"
            >
              {soldOut ? (
                "Sold out"
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true" className="h-4 w-4">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Add
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
