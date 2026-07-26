"use client";

import Link from "next/link";
import { useState } from "react";

import { SiteHeader } from "@/components/SiteHeader";
import { products, type Product } from "@/lib/products";
import { addToCart, useCartCount } from "@/lib/cart";
import { ShareButton } from "@/components/ShareButton";
import { ReviewsSection } from "@/components/ReviewsSection";
import { getReviewSummary } from "@/lib/reviews";
import { SITE_URL } from "@/lib/seo";

const WHATSAPP_NUMBER = "919990649990";

function WhatsAppIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.52 3.48A11.86 11.86 0 0 0 12.04 0C5.5 0 .2 5.3.2 11.84c0 2.09.55 4.13 1.6 5.93L0 24l6.4-1.68a11.82 11.82 0 0 0 5.64 1.44h.01c6.54 0 11.84-5.3 11.84-11.84 0-3.16-1.23-6.13-3.37-8.44ZM12.05 21.4h-.01a9.55 9.55 0 0 1-4.87-1.34l-.35-.21-3.8 1 1.02-3.7-.23-.38a9.53 9.53 0 0 1-1.46-5.08c0-5.28 4.3-9.58 9.6-9.58 2.56 0 4.97.99 6.78 2.8a9.53 9.53 0 0 1 2.81 6.79c0 5.28-4.3 9.58-9.59 9.58Zm5.26-7.18c-.29-.14-1.7-.84-1.96-.94-.26-.1-.45-.14-.64.14-.19.29-.74.94-.9 1.13-.17.19-.33.21-.62.07-.29-.14-1.22-.45-2.32-1.43-.86-.77-1.44-1.72-1.6-2-.17-.29-.02-.44.13-.58.13-.13.29-.33.43-.5.14-.17.19-.29.29-.48.1-.19.05-.36-.02-.5-.07-.14-.64-1.54-.88-2.11-.23-.55-.47-.48-.64-.49h-.55c-.19 0-.5.07-.76.36-.26.29-1 .98-1 2.38 0 1.4 1.02 2.75 1.17 2.94.14.19 2.02 3.09 4.9 4.33.68.29 1.22.47 1.63.6.68.22 1.31.19 1.8.11.55-.08 1.7-.7 1.94-1.37.24-.67.24-1.25.17-1.37-.07-.12-.26-.19-.55-.34Z"/>
    </svg>
  );
}

function whatsappBuyNow(p: Product, qty: number) {
  const total = p.priceNum * qty;
  const text = [
    "Namaste Mudkraft 🙏",
    `I'd like to order ${qty} × ${p.name} (${p.tag}).`,
    `Total: ₹${total.toLocaleString("en-IN")}`,
    "",
    "Please share dispatch & payment details. Dhanyavaad 🙏",
  ].join("\n");
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export function ProductDetail({ product: p }: { product: Product }) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const cartCount = useCartCount();

  const handleAdd = () => {
    addToCart(p, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  };

  const related = products.filter((x) => x.slug !== p.slug && x.category === p.category).slice(0, 3);
  const fallback = products.filter((x) => x.slug !== p.slug).slice(0, 3);
  const alsoLove = related.length ? related : fallback;

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SiteHeader
        rightSlot={
          <Link
            href="/"
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
            <img
              src={p.img}
              alt={`Handcrafted ${p.name} — ${p.tag} from Mudkraft`}
              width={1200}
              height={1500}
              className="w-full h-full object-contain p-3 md:p-4 drop-shadow-[0_35px_50px_rgba(80,40,20,0.32)]"
            />
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
            const s = getReviewSummary(p.slug);
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
            <div className="text-xs tracking-widest uppercase text-muted-foreground">Incl. taxes</div>
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

      <ReviewsSection slug={p.slug} name={p.name} />

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
                    <img
                      src={x.img}
                      alt={x.name}
                      loading="lazy"
                      className="w-full h-full object-contain p-2 transition-transform duration-[1400ms] group-hover:scale-105 drop-shadow-[0_25px_35px_rgba(80,40,20,0.25)]"
                    />
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
