"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

import { SiteHeader } from "@/components/SiteHeader";
import { displayImage, variantLabel, type ProductView } from "@/lib/product-view";
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
  alsoLove: ProductView[];
  reviews: ReviewView[];
  reviewSummary: ReviewSummaryView;
}) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [openPanel, setOpenPanel] = useState<string | null>("specs");
  const cartCount = useCartCount();
  const pictures = p.gallery.length > 1 ? p.gallery : [];
  const [shot, setShot] = useState(0);
  const heroImage = pictures[shot] ?? displayImage(p);

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
    <ul className="mt-6 grid sm:grid-cols-3 gap-px rounded-[1.4rem] overflow-hidden border border-border bg-border">
      {[
        { title: "Hand packed", body: "Cushioned in a double-walled carton" },
        { title: "Ships in 2–3 days", body: "Tracking shared on WhatsApp" },
        { title: "Breakage cover", body: "Free replacement or refund" },
      ].map((perk) => (
        <li
          key={perk.title}
          className="bg-background px-4 py-3.5 text-[13px] leading-snug text-muted-foreground"
        >
          <Link href="/shipping-returns" className="block hover:text-earth transition-colors">
            <b className="block text-sm font-semibold text-earth">{perk.title}</b>
            {perk.body}
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

      <section className="max-w-7xl mx-auto px-6 md:px-10 pt-8 pb-20 md:pt-10 md:pb-28 grid md:grid-cols-[1.15fr_1fr] gap-10 md:gap-16 items-start">
        <div className="md:sticky md:top-28">
          <div className="relative aspect-square rounded-[2rem] overflow-hidden bg-sand animate-fade-up">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,oklch(0.97_0.015_75)_0%,transparent_65%)]" />
            {heroImage ? (
              <img
                key={heroImage}
                src={heroImage}
                alt={`Handcrafted ${p.name} — ${p.tag} from Mudkraft`}
                width={1200}
                height={1200}
                className="relative w-full h-full object-contain mix-blend-multiply p-6 md:p-12 drop-shadow-[0_35px_50px_rgba(80,40,20,0.32)] animate-in fade-in zoom-in-[1.04] duration-700 ease-[var(--ease-clay)] transition-transform hover:scale-[1.06]"
              />
            ) : (
              <div className="w-full h-full grid place-items-center text-earth/40 font-hand text-3xl">
                photograph coming soon
              </div>
            )}
            <div className="absolute top-5 left-5 text-[10px] tracking-[0.2em] uppercase bg-ink/80 backdrop-blur text-cream px-3.5 py-2 rounded-full">
              {p.tag}
            </div>
            <div className="absolute right-5 bottom-5 w-24 h-24 md:w-28 md:h-28 grid place-items-center rounded-full bg-ink/75 backdrop-blur">
              <svg
                viewBox="0 0 150 150"
                aria-hidden="true"
                className="absolute inset-0 w-full h-full animate-spin-slow"
              >
                <defs>
                  <path id="pd-seal" d="M75,75 m-56,0 a56,56 0 1,1 112,0 a56,56 0 1,1 -112,0" />
                </defs>
                <text
                  fill="var(--cream)"
                  className="font-sans uppercase"
                  style={{ fontSize: 12, fontWeight: 600 }}
                  textLength={350}
                  lengthAdjust="spacing"
                >
                  <textPath href="#pd-seal">Wood fired · Khurja · hand thrown · </textPath>
                </text>
              </svg>
              <span className="w-3.5 h-3.5 rounded-full bg-ember animate-ring-pulse" />
            </div>
          </div>
          {pictures.length > 1 && (
            <div
              className="mt-4 grid grid-cols-4 gap-3"
              role="tablist"
              aria-label="Product photographs"
            >
              {pictures.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  role="tab"
                  aria-selected={i === shot}
                  aria-label={`Photograph ${i + 1} of ${pictures.length}`}
                  onClick={() => setShot(i)}
                  className={`aspect-square rounded-2xl overflow-hidden bg-sand border-2 transition-[border-color,transform,opacity] duration-500 ease-[var(--ease-clay)] hover:-translate-y-1 ${i === shot ? "border-clay" : "border-transparent opacity-75 hover:opacity-100"}`}
                >
                  <img
                    src={src}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-contain mix-blend-multiply p-2"
                  />
                </button>
              ))}
            </div>
          )}
          <div className="hidden md:block">{perks}</div>
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

          <div className="md:hidden">{perks}</div>

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
            <div className="flex flex-wrap items-baseline justify-between gap-4 mb-10">
              <h2 className="mk-reveal font-display font-normal text-[clamp(2.25rem,4vw,3.5rem)] text-earth">
                Keeps good <em className="font-light text-clay">company.</em>
              </h2>
              <Link
                href="/#collection"
                className="mk-link text-xs tracking-widest uppercase text-muted-foreground hover:text-earth"
              >
                All pieces →
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              {alsoLove.map((x) => (
                <Link
                  key={x.slug}
                  href={`/shop/${x.slug}`}
                  className="mk-reveal group block rounded-[1.5rem] overflow-hidden bg-sand transition-[transform,box-shadow] duration-800 ease-[var(--ease-clay)] hover:-translate-y-2 hover:shadow-[0_40px_70px_-40px_rgba(59,42,34,0.55)]"
                >
                  <div className="relative aspect-square overflow-hidden">
                    {displayImage(x) ? (
                      <img
                        src={displayImage(x)!}
                        alt={x.name}
                        loading="lazy"
                        className="w-full h-full object-contain p-5 transition-transform duration-[1600ms] ease-[var(--ease-clay)] group-hover:scale-[1.07] drop-shadow-[0_25px_35px_rgba(80,40,20,0.25)]"
                      />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-earth/40 font-hand text-xl">
                        coming soon
                      </div>
                    )}
                  </div>
                  <div className="px-5 pt-3 pb-5 flex items-baseline justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-display text-2xl text-earth truncate">{x.name}</div>
                      <div className="font-hand text-lg text-clay-deep truncate">{x.note}</div>
                    </div>
                    <div className="font-display text-lg text-earth shrink-0">{x.price}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
