"use client";

import Link from "next/link";
import { useState } from "react";

import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import handsClay from "@/assets/hands-clay.jpg";
import heroBanner from "@/assets/hero-pot.jpg";
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

  // Categories come from the database, so a category added in the admin panel
  // appears here without a code change.
  const filterOptions = ["All", ...categories];
  const visibleProducts =
    activeCategory === "All" ? products : products.filter((p) => p.category === activeCategory);

  const addToCart = (p: ProductView) => {
    addToCartStore(p);
    setOpen(true);
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
              className="hidden sm:inline-flex items-center gap-2 text-xs tracking-widest uppercase border border-earth/30 px-4 py-2.5 rounded-full text-earth hover:bg-earth hover:text-cream transition-all duration-500"
            >
              <WhatsAppIcon className="w-4 h-4" />
              Enquire
            </a>
            <button
              onClick={() => setOpen(true)}
              className="relative hidden md:inline-flex items-center gap-2 text-xs tracking-widest uppercase bg-earth text-cream px-5 py-2.5 rounded-full hover:bg-clay transition-colors"
            >
              Cart
              <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-gold text-earth text-[11px] font-medium">
                {count}
              </span>
            </button>
          </>
        }
      />

      {/* HERO */}
      <section className="relative isolate flex min-h-[92vh] items-center overflow-hidden pt-28 pb-16 grain">
        {/* The source is portrait and the section is wide, so on desktop this is
            cropped top and bottom no matter what. Biasing the focal point above
            centre keeps the rim and the carved shoulder in frame rather than
            landing on an anonymous slice of the belly. */}
        <img
          src={heroBanner.src}
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-[50%_38%]"
        />

        {/* Warm rather than neutral, so the firelight in the photograph is damped
            instead of greyed. The horizontal pass carries the headline on
            desktop; on mobile the text sits over the middle of the frame, where a
            side gradient does nothing, so a flat veil takes over below md. */}
        <div
          className="absolute inset-0 -z-10 hidden md:block"
          style={{
            background:
              "linear-gradient(100deg, oklch(0.18 0.02 40 / 0.94) 0%, oklch(0.18 0.02 40 / 0.8) 38%, oklch(0.18 0.02 40 / 0.3) 70%, oklch(0.18 0.02 40 / 0.08) 100%)",
          }}
        />
        <div
          className="absolute inset-0 -z-10 md:hidden"
          style={{
            background:
              "linear-gradient(to bottom, oklch(0.18 0.02 40 / 0.55) 0%, oklch(0.18 0.02 40 / 0.82) 100%)",
          }}
        />

        <div className="max-w-7xl mx-auto w-full px-6 md:px-10">
          <div className="relative z-10 max-w-2xl animate-fade-up">
            <p className="font-hand text-gold text-xl sm:text-2xl mb-4 sm:mb-6">
              — shaped by hand, held by earth
            </p>
            <h1 className="text-balance text-[clamp(2.5rem,9vw,6.5rem)] leading-[0.95] font-display text-cream">
              The soul of
              <br />
              <span className="italic text-gold">soil</span>, spun
              <br />
              into <span className="italic">stillness</span>.
            </h1>
            <p className="mt-6 sm:mt-8 max-w-md text-base sm:text-lg text-cream/75 leading-relaxed">
              Mudkraft is a slow craft studio. Every pot begins as river clay in the hands of a
              potter, and ends as a quiet object in your home.
            </p>
            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              <a
                href="#collection"
                className="group relative inline-flex items-center justify-center gap-3 bg-cream text-earth px-6 sm:px-8 py-3.5 sm:py-4 rounded-full text-[11px] sm:text-sm tracking-widest uppercase overflow-hidden transition-transform hover:-translate-y-0.5 whitespace-nowrap w-full sm:w-auto"
              >
                <span className="relative z-10 transition-colors duration-500 group-hover:text-cream">
                  Explore the collection
                </span>
                <span className="relative z-10 transition-all duration-500 group-hover:translate-x-1 group-hover:text-cream">
                  →
                </span>
                <span className="absolute inset-0 bg-clay translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              </a>
              <a
                href="#craft"
                className="text-sm text-cream/90 underline underline-offset-4 decoration-gold/50 hover:decoration-gold text-center sm:text-left"
              >
                Watch the wheel
              </a>
            </div>
          </div>
        </div>

        <div className="hidden md:block absolute bottom-8 left-1/2 -translate-x-1/2 text-xs tracking-[0.4em] text-cream/55 uppercase">
          scroll ↓
        </div>
      </section>

      {/* MARQUEE */}
      <section className="border-y border-border/50 py-6 overflow-hidden bg-earth/5">
        <div className="flex animate-marquee whitespace-nowrap gap-16 text-earth/70 font-display italic text-2xl md:text-3xl">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-16 pr-16">
              <span>river clay</span>
              <span>·</span>
              <span>wood fired</span>
              <span>·</span>
              <span>hand thrown</span>
              <span>·</span>
              <span>seven generations</span>
              <span>·</span>
              <span>slow made</span>
              <span>·</span>
              <span>earth born</span>
              <span>·</span>
            </div>
          ))}
        </div>
      </section>

      {/* COLLECTION */}
      <section id="collection" className="py-20 md:py-32 px-6 md:px-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-10 lg:gap-x-16 border-t border-clay/25 pt-12 md:pt-16 pb-12 md:pb-20 mb-12 md:mb-16">
          <div className="lg:col-span-8 flex flex-col">
            <header className="mb-6 md:mb-10 flex items-center gap-4">
              <span className="h-px w-8 bg-clay"></span>
              <span className="text-[10px] tracking-[0.3em] uppercase text-clay font-medium">
                The Collection
              </span>
            </header>
            <h2 className="font-display text-4xl sm:text-5xl md:text-7xl lg:text-8xl leading-[1.02] md:leading-[0.95] text-earth tracking-tight text-balance">
              Objects that <span className="italic font-light">breathe</span>,
              <br className="hidden md:block" />
              made to be lived with.
            </h2>
          </div>

          <div className="lg:col-span-4 flex flex-col justify-end lg:pb-4">
            <div className="max-w-sm">
              <p className="text-sm md:text-base leading-relaxed text-muted-foreground/90">
                Four families of clay — each thrown, dried under sky, and fired in a slow wood kiln.
              </p>
              <div className="mt-8 flex items-center gap-6">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full border border-cream bg-[#D4B996]"></div>
                  <div className="w-8 h-8 rounded-full border border-cream bg-[#A67C52]"></div>
                  <div className="w-8 h-8 rounded-full border border-cream bg-[#7D5A44]"></div>
                  <div className="w-8 h-8 rounded-full border border-cream bg-earth"></div>
                </div>
                <span className="text-[10px] uppercase tracking-widest text-clay font-semibold">
                  Earth Elements
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-10 md:mb-14 flex flex-wrap items-center gap-2 md:gap-3">
          <span className="text-[10px] tracking-[0.3em] uppercase text-clay font-medium mr-2 md:mr-4">
            Filter
          </span>
          {filterOptions.map((c) => {
            const count =
              c === "All" ? products.length : products.filter((p) => p.category === c).length;
            const isActive = activeCategory === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setActiveCategory(c)}
                aria-pressed={isActive}
                className={`px-4 md:px-5 py-2 rounded-full text-xs md:text-sm tracking-wide transition-all border ${
                  isActive
                    ? "bg-earth text-cream border-earth shadow-sm"
                    : "bg-cream text-earth border-clay/30 hover:border-clay hover:bg-clay/5"
                }`}
              >
                {c}{" "}
                <span
                  className={`ml-1 text-[10px] ${isActive ? "text-cream/70" : "text-muted-foreground"}`}
                >
                  ({count})
                </span>
              </button>
            );
          })}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {visibleProducts.map((p) => (
            <article
              key={p.slug}
              className="group relative flex flex-col rounded-[1.75rem] bg-gradient-to-b from-[hsl(35,40%,94%)] to-[hsl(30,30%,86%)] ring-1 ring-earth/10 shadow-[0_1px_0_hsl(35,50%,98%)_inset,0_30px_60px_-40px_rgba(80,40,20,0.45)] hover:shadow-[0_1px_0_hsl(35,50%,98%)_inset,0_45px_80px_-40px_rgba(80,40,20,0.6)] transition-all duration-700 hover:-translate-y-1 overflow-hidden"
            >
              <Link
                href={`/shop/${p.slug}`}
                aria-label={`View ${p.name}`}
                className="relative block aspect-square"
              >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(35,45%,96%)_0%,transparent_65%)]" />
                {displayImage(p) ? (
                  <img
                    src={displayImage(p)!}
                    alt={`Handcrafted ${p.name} — ${p.tag} from Mudkraft`}
                    width={900}
                    height={900}
                    loading="lazy"
                    className="relative w-full h-full object-contain p-5 sm:p-6 transition-transform duration-[1400ms] ease-out group-hover:scale-[1.06] drop-shadow-[0_30px_35px_rgba(80,40,20,0.35)]"
                  />
                ) : (
                  <div className="relative w-full h-full grid place-items-center text-earth/30 font-hand text-2xl">
                    photograph coming soon
                  </div>
                )}
                <div className="absolute top-4 left-4 text-[10px] tracking-[0.25em] uppercase bg-earth/90 backdrop-blur px-3 py-1.5 rounded-full text-cream">
                  {p.tag}
                </div>
                <div className="pointer-events-none absolute bottom-3 right-4 font-display italic text-sm text-earth/50 tracking-wide">
                  Mudkraft
                </div>
              </Link>

              <div className="flex items-end justify-between gap-4 px-6 pt-5 pb-6 border-t border-earth/10 bg-cream/40">
                <div className="min-w-0">
                  <Link href={`/shop/${p.slug}`} className="hover:text-clay transition-colors">
                    <h3 className="text-2xl font-display text-earth truncate">{p.name}</h3>
                  </Link>
                  <p className="mt-0.5 font-hand text-clay text-lg truncate">{p.note}</p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-lg font-display text-earth">{p.price}</div>
                  <button
                    onClick={() => addToCart(p)}
                    className="mt-1 text-[10px] tracking-[0.25em] uppercase text-earth/70 hover:text-earth border-b border-earth/30 hover:border-earth transition-colors"
                  >
                    Add +
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* CRAFT */}
      <section
        id="craft"
        className="relative py-20 md:py-32 mt-10 md:mt-20 grain overflow-hidden bg-earth"
      >
        <div className="max-w-7xl mx-auto px-6 md:px-10 grid md:grid-cols-12 gap-10 md:gap-12 items-center">
          <div className="md:col-span-6 relative">
            <img
              src={handsClay.src}
              alt="Potter's hands shaping clay on the wheel"
              width={1408}
              height={1600}
              loading="lazy"
              className="w-full aspect-[4/5] object-cover rounded-[2rem] shadow-[0_40px_100px_-30px_rgba(0,0,0,0.6)]"
            />
            <div className="hidden md:block absolute -bottom-6 -right-6 bg-clay text-cream px-6 py-4 rounded-2xl font-display italic text-xl max-w-[220px]">
              &ldquo;The wheel remembers what the hand forgets.&rdquo;
            </div>
          </div>

          <div className="md:col-span-6 text-cream">
            <p className="md:hidden font-display italic text-clay text-xl leading-snug mb-6 border-l-2 border-gold/60 pl-4">
              &ldquo;The wheel remembers what the hand forgets.&rdquo;
            </p>
            <p className="text-xs tracking-[0.4em] uppercase text-gold mb-6">— the craft</p>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-display text-balance leading-tight">
              Seven generations,
              <br />
              <span className="italic text-gold">one wheel.</span>
            </h2>
            <p className="mt-6 md:mt-8 text-base md:text-lg text-cream/70 leading-relaxed max-w-md">
              We work with a single family of potters in Khurja, whose ancestors have thrown pots on
              the same wheel for over 180 years. No moulds. No machines. Only clay, water, fire, and
              time.
            </p>

            <div className="mt-10 md:mt-12 grid grid-cols-3 gap-4 sm:gap-8 border-t border-cream/20 pt-6 md:pt-8">
              {[
                { n: "180+", l: "years of craft" },
                { n: "12", l: "master potters" },
                { n: "48h", l: "of slow firing" },
              ].map((s) => (
                <div key={s.l}>
                  <div className="text-3xl sm:text-4xl md:text-5xl font-display text-gold">
                    {s.n}
                  </div>
                  <div className="mt-2 text-[10px] sm:text-xs tracking-widest uppercase text-cream/60">
                    {s.l}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* STORY */}
      <section id="story" className="py-20 md:py-32 px-6 md:px-10 max-w-4xl mx-auto text-center">
        <p className="text-xs tracking-[0.4em] uppercase text-clay mb-6 md:mb-8">— our story</p>
        <p className="text-2xl sm:text-3xl md:text-5xl font-display italic text-earth leading-[1.2] md:leading-[1.15] text-balance">
          &ldquo;<span className="not-italic">Mudkraft</span> is the craft of earth in your hands.
          We think of every home that keeps our clay as another quiet birth — of stillness, of
          ritual, of a slower way to hold what matters.&rdquo;
        </p>
        <div className="mt-8 md:mt-10 font-hand text-2xl text-clay">— Ananya, founder</div>
      </section>

      {/* VIDEOS — hidden entirely when the feed is unreachable, never broken */}
      {videos.length > 0 && (
        <section id="videos" className="py-20 md:py-32 px-6 md:px-10 max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6 md:mb-8">
            <span className="h-px w-8 bg-clay" />
            <p className="text-xs tracking-[0.4em] uppercase text-clay">from the studio</p>
          </div>
          <h2 className="font-display text-4xl sm:text-5xl md:text-7xl text-earth text-balance leading-tight">
            Watch the <span className="italic">wheel turn.</span>
          </h2>
          <div className="mt-10 md:mt-14 grid sm:grid-cols-2 gap-8">
            {videos.slice(0, 2).map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
          <div className="mt-10 md:mt-14 text-center">
            <Link
              href="/videos"
              className="inline-flex items-center justify-center border border-earth/25 bg-background text-earth px-8 py-4 rounded-full text-xs tracking-widest uppercase hover:bg-earth hover:text-cream transition-colors"
            >
              View all videos
            </Link>
          </div>
        </section>
      )}

      {/* JOURNAL / CTA */}
      <section
        id="journal"
        className="relative py-20 md:py-32 px-6 md:px-10 mx-4 sm:mx-6 md:mx-10 mb-16 rounded-[2rem] md:rounded-[2.5rem] grain overflow-hidden"
        style={{ background: "linear-gradient(135deg, oklch(0.58 0.14 42), oklch(0.42 0.11 38))" }}
      >
        <div className="max-w-3xl mx-auto text-center text-cream">
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-display text-balance leading-tight">
            Letters from
            <br />
            <span className="italic">the kiln.</span>
          </h2>
          <p className="mt-6 text-cream/80 max-w-md mx-auto">
            A quiet note once a month — new pieces, small essays on craft, and the occasional
            invitation to the studio.
          </p>
          <form
            className="mt-10 flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            onSubmit={(e) => e.preventDefault()}
          >
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="newsletter-email"
              name="email"
              type="email"
              aria-label="Email address"
              placeholder="your@email"
              className="flex-1 bg-cream/10 border border-cream/40 rounded-full px-6 py-4 text-cream placeholder:text-cream/75 focus:outline-none focus:border-cream transition"
            />
            <button className="bg-cream text-earth px-8 py-4 rounded-full text-sm tracking-widest uppercase hover:bg-gold transition-colors">
              Subscribe
            </button>
          </form>
        </div>
      </section>

      <SiteFooter />

      {/* CART DRAWER */}
      {open && (
        <div className="fixed inset-0 z-[100]">
          <div
            className="absolute inset-0 bg-earth/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute right-0 top-0 h-full w-full max-w-md bg-cream text-earth shadow-2xl flex flex-col animate-fade-up">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <div>
                <div className="text-xs tracking-[0.3em] uppercase text-clay">Your basket</div>
                <div className="font-display text-2xl">
                  {count} {count === 1 ? "piece" : "pieces"}
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-10 h-10 rounded-full border border-border hover:bg-earth hover:text-cream transition"
                aria-label="Close cart"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {cart.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <div className="font-hand text-3xl text-clay">the basket waits, quietly</div>
                  <p className="mt-3 text-sm">Tap any piece to add it here.</p>
                </div>
              )}
              {cart.map((x) => (
                <div key={x.slug} className="flex gap-4 py-3 border-b border-border/60">
                  {x.img ? (
                    <img
                      src={x.img}
                      alt={x.name}
                      className="w-20 h-24 object-contain rounded-lg bg-cream p-1"
                    />
                  ) : (
                    <div className="w-20 h-24 rounded-lg bg-earth/5" aria-hidden="true" />
                  )}
                  <div className="flex-1">
                    <div className="font-display text-lg">{x.name}</div>
                    <div className="text-xs text-muted-foreground">{x.tag}</div>
                    <div className="mt-2 flex items-center gap-3">
                      <button
                        onClick={() => updateQty(x.slug, -1)}
                        className="w-7 h-7 rounded-full border border-border"
                      >
                        −
                      </button>
                      <span className="text-sm">{x.qty}</span>
                      <button
                        onClick={() => updateQty(x.slug, 1)}
                        className="w-7 h-7 rounded-full border border-border"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeItem(x.slug)}
                        className="ml-auto text-xs text-muted-foreground hover:text-clay"
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
                className={`w-full inline-flex items-center justify-center gap-2 py-4 rounded-full text-sm tracking-widest uppercase transition ${
                  cart.length > 0
                    ? "bg-earth text-cream hover:bg-clay"
                    : "bg-muted text-muted-foreground pointer-events-none"
                }`}
              >
                Checkout
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

