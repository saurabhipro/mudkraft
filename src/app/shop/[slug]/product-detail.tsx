"use client";

import Link from "next/link";
import { useState } from "react";

import { SiteHeader } from "@/components/SiteHeader";
import { displayImage, type ProductView } from "@/lib/product-view";
import { formatPaise } from "@/lib/money";
import type { ReviewSummaryView, ReviewView } from "@/lib/review-view";
import { addToCart, useCartCount } from "@/lib/cart";
import { ShareButton } from "@/components/ShareButton";
import { ReviewsSection } from "@/components/ReviewsSection";
import { SITE_URL } from "@/lib/seo";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { whatsappLink } from "@/lib/whatsapp";


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
  alsoLove,
  reviews,
  reviewSummary,
}: {
  product: ProductView;
  alsoLove: ProductView[];
  reviews: ReviewView[];
  reviewSummary: ReviewSummaryView;
}) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const cartCount = useCartCount();
  const heroImage = displayImage(p);

  const handleAdd = () => {
    addToCart(p, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SiteHeader
        rightSlot={
          // There is no cart drawer on this page, so the basket goes where the
          // items can actually be reviewed and paid for.
          <Link
            href={cartCount > 0 ? "/checkout" : "/#collection"}
            className="relative inline-flex items-center gap-2 text-xs tracking-widest uppercase bg-earth text-cream px-4 sm:px-5 py-2.5 rounded-full hover:bg-clay transition-colors"
          >
            Basket
            <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-gold text-earth text-[11px] font-medium">
              {cartCount}
            </span>
          </Link>
        }
      />

      <nav className="max-w-7xl mx-auto px-6 md:px-10 pt-6 text-xs tracking-widest uppercase text-muted-foreground">
        <Link href="/" className="hover:text-earth">Home</Link>
        <span className="mx-2">·</span>
        <Link href="/#collection" className="hover:text-earth">Collection</Link>
        <span className="mx-2">·</span>
        <span className="text-earth">{p.name}</span>
      </nav>

      <section className="max-w-7xl mx-auto px-6 md:px-10 pt-8 pb-16 md:pt-14 md:pb-24 grid md:grid-cols-2 gap-10 md:gap-16 items-start">
        <div className="relative">
          <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden bg-gradient-to-br from-cream to-[hsl(35,35%,86%)]">
            {heroImage ? (
              <img
                src={heroImage}
                alt={`Handcrafted ${p.name} — ${p.tag} from Mudkraft`}
                width={1200}
                height={1500}
                className="w-full h-full object-contain p-3 md:p-4 drop-shadow-[0_35px_50px_rgba(80,40,20,0.32)]"
              />
            ) : (
              <div className="w-full h-full grid place-items-center text-earth/30 font-hand text-3xl">
                photograph coming soon
              </div>
            )}
            <div className="absolute top-5 left-5 text-xs tracking-widest uppercase bg-earth/90 text-cream px-3 py-1.5 rounded-full">
              {p.tag}
            </div>
            <div className="pointer-events-none absolute bottom-5 right-6 text-earth/70 font-display italic text-xl tracking-wide">
              Mudkraft
            </div>
          </div>
        </div>

        <div>
          <div className="text-[11px] tracking-[0.35em] uppercase text-clay">{p.category}</div>
          <h1 className="mt-3 font-display text-5xl md:text-6xl text-earth leading-[1.05]">
            {p.name}
          </h1>
          <p className="mt-3 font-hand text-clay text-2xl">{p.note}</p>

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
                    <svg key={i} viewBox="0 0 24 24" className="w-4 h-4" fill={i < Math.round(s.average) ? "currentColor" : "rgba(0,0,0,0.15)"}>
                      <path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.5l1.1-6.5L2.6 9.4l6.5-.9L12 2.6z" />
                    </svg>
                  ))}
                </span>
                <span className="tabular-nums">{s.average.toFixed(1)}</span>
                <span className="text-muted-foreground">· {s.count} review{s.count === 1 ? "" : "s"}</span>
              </a>
            );
          })()}

          <div className="mt-6 flex items-baseline gap-4">
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

          <p className="mt-8 text-lg leading-relaxed text-foreground/85">{p.description}</p>
          <p className="mt-4 font-display italic text-earth/80 text-lg">&ldquo;{p.story}&rdquo;</p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <div className="inline-flex items-center rounded-full border border-earth/25 bg-cream">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-11 h-11 rounded-l-full text-lg text-earth hover:bg-earth hover:text-cream transition"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="w-10 text-center font-display text-lg text-earth">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => q + 1)}
                className="w-11 h-11 rounded-r-full text-lg text-earth hover:bg-earth hover:text-cream transition"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex items-center gap-2 bg-earth text-cream px-7 py-3.5 rounded-full text-xs tracking-widest uppercase hover:bg-clay transition-colors"
            >
              {added ? "Added ✓" : "Add to Cart"}
            </button>

            <a
              href={whatsappBuyNow(p, qty)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-earth/30 text-earth px-6 py-3.5 rounded-full text-xs tracking-widest uppercase hover:bg-earth hover:text-cream transition-colors"
            >
              <WhatsAppIcon className="w-4 h-4" />
              Buy on WhatsApp
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
              href="/"
              className="mt-4 inline-block text-xs tracking-widest uppercase text-clay hover:text-earth"
            >
              View basket →
            </Link>
          )}

          <div className="mt-12 border-t border-border pt-8">
            <h2 className="text-xs tracking-[0.3em] uppercase text-clay">Specifications</h2>
            <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8">
              {p.specs.map((s: { label: string; value: string }) => (
                <div key={s.label} className="flex justify-between gap-4 border-b border-border/60 pb-2">
                  <dt className="text-sm text-muted-foreground">{s.label}</dt>
                  <dd className="text-sm text-earth font-medium text-right">{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="mt-8">
            <h2 className="text-xs tracking-[0.3em] uppercase text-clay">Care</h2>
            <ul className="mt-4 space-y-2 text-sm text-foreground/85">
              {p.care.map((c: string) => (
                <li key={c} className="flex gap-3">
                  <span className="text-clay mt-1">◦</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/care/season-your-handi"
              className="mt-4 inline-block text-xs tracking-widest uppercase text-earth hover:text-clay border-b border-earth/40"
            >
              Read the full care guide →
            </Link>
          </div>
        </div>
      </section>

      <ReviewsSection name={p.name} reviews={reviews} summary={reviewSummary} />

      {alsoLove.length > 0 && (
        <section className="bg-cream/60 py-16 md:py-24 border-t border-border">
          <div className="max-w-7xl mx-auto px-6 md:px-10">
            <div className="flex items-baseline justify-between mb-10">
              <h2 className="font-display text-3xl md:text-4xl text-earth">
                You may also <span className="italic">love</span>
              </h2>
              <Link
                href="/#collection"
                className="text-xs tracking-widest uppercase text-muted-foreground hover:text-earth"
              >
                All pieces →
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
              {alsoLove.map((x) => (
                <Link
                  key={x.slug}
                  href={`/shop/${x.slug}`}
                  className="group block"
                >
                  <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-gradient-to-br from-cream to-[hsl(35,35%,88%)]">
                    {displayImage(x) ? (
                      <img
                        src={displayImage(x)!}
                        alt={x.name}
                        loading="lazy"
                        className="w-full h-full object-contain p-2 transition-transform duration-[1400ms] group-hover:scale-105 drop-shadow-[0_25px_35px_rgba(80,40,20,0.25)]"
                      />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-earth/30 font-hand text-xl">
                        coming soon
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex items-baseline justify-between">
                    <div>
                      <div className="font-display text-xl text-earth">{x.name}</div>
                      <div className="text-xs text-muted-foreground">{x.tag}</div>
                    </div>
                    <div className="font-display text-lg text-earth">{x.price}</div>
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
