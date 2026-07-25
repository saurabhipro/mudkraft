import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import handsClay from "@/assets/hands-clay.jpg";
import potImg from "@/assets/pot-transparent.png.asset.json";
import { products, type Category, type Product } from "@/lib/products";
import { useCart, addToCart as addToCartStore, updateQty as updateQtyStore, removeItem as removeItemStore } from "@/lib/cart";

const SITE_URL = "https://mudkraft.lovable.app";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mudkraft — Soulful Handcrafted Clay Pots, Kulhads & Matkas" },
      {
        name: "description",
        content:
          "Mudkraft is a slow craft studio shaping pots, kulhads, planters and diyas from river clay — made by hand, fired with fire, rooted in earth.",
      },
      { property: "og:title", content: "Mudkraft — Soulful Handcrafted Clay" },
      {
        property: "og:description",
        content:
          "Mudkraft is a slow craft studio shaping pots, kulhads, planters and diyas from river clay — made by hand, fired with fire, rooted in earth.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SITE_URL + "/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "canonical", href: SITE_URL + "/" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Inter:wght@300;400;500;600&family=Caveat:wght@400;600&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": products.map((p) => ({
            "@type": "Product",
            name: p.name,
            description: `${p.tag} — handcrafted river-clay piece by Mudkraft.`,
            image: p.img,
            brand: { "@type": "Brand", name: "Mudkraft" },
            offers: {
              "@type": "Offer",
              price: p.priceNum,
              priceCurrency: "INR",
              availability: "https://schema.org/InStock",
              url: SITE_URL + "/#collection",
            },
          })),
        }),
      },
    ],
  }),
  component: Index,
});



const CATEGORIES: Array<"All" | Category> = ["All", "Water", "Tea", "Cookware", "Serveware"];

// Replace with your real WhatsApp number (country code + number, no + or spaces)
const WHATSAPP_NUMBER = "919990649990";
const ENQUIRY_EMAIL = "hello@mudkraft.com";

function Index() {
  const cart = useCart();
  const [open, setOpen] = useState(false);
  const [customer, setCustomer] = useState({ name: "", phone: "" });
  const [activeCategory, setActiveCategory] = useState<"All" | Category>("All");
  const visibleProducts = activeCategory === "All" ? products : products.filter((p) => p.category === activeCategory);

  const addToCart = (p: Product) => {
    addToCartStore(p);
    setOpen(true);
  };
  const updateQty = (slug: string, delta: number) => updateQtyStore(slug, delta);
  const removeItem = (slug: string) => removeItemStore(slug);

  const total = cart.reduce((s, x) => s + x.priceNum * x.qty, 0);
  const count = cart.reduce((s, x) => s + x.qty, 0);
  const canCheckout = cart.length > 0 && customer.name.trim() && customer.phone.trim();

  const checkoutMessage = () => {
    const lines = [
      "Namaste Mudkraft 🙏",
      "I'd like to place an order:",
      "",
      "— Items —",
      ...cart.map(
        (x) => `• ${x.name} × ${x.qty} — ₹${(x.priceNum * x.qty).toLocaleString("en-IN")}`
      ),
      "",
      `Total: ₹${total.toLocaleString("en-IN")} (${count} ${count === 1 ? "piece" : "pieces"})`,
      "",
      "— My details —",
      `Name: ${customer.name.trim()}`,
      `Phone: ${customer.phone.trim()}`,
      "",
      "Please share dispatch & payment details. Dhanyavaad 🙏",
    ];
    return encodeURIComponent(lines.join("\n"));
  };

  const whatsappCheckout = () =>
    `https://wa.me/${WHATSAPP_NUMBER}?text=${checkoutMessage()}`;


  const whatsappEnquiry = () =>
    `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      "Namaste Mudkraft 🙏 I'd love to know more about your clay pieces."
    )}`;

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SiteHeader
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
              className="relative inline-flex items-center gap-2 text-xs tracking-widest uppercase bg-earth text-cream px-4 sm:px-5 py-2.5 rounded-full hover:bg-clay transition-colors"
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
      <section className="relative min-h-[92vh] flex items-center pt-28 pb-16 grain">
        <div className="absolute inset-0 -z-10">
          <div
            className="absolute inset-0 opacity-90"
            style={{
              background:
                "radial-gradient(ellipse at 70% 40%, oklch(0.88 0.06 65) 0%, oklch(0.955 0.018 75) 60%)",
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto w-full px-6 md:px-10 grid md:grid-cols-12 gap-10 items-center">
          <div className="md:col-span-6 relative z-10 animate-fade-up order-2 md:order-1">
            <p className="font-hand text-clay text-xl sm:text-2xl mb-4 sm:mb-6">— shaped by hand, held by earth</p>
            <h1 className="text-balance text-[clamp(2.5rem,10vw,7rem)] leading-[0.95] font-display text-earth">
              The soul of<br />
              <span className="italic text-clay-deep">soil</span>, spun<br />
              into <span className="italic">stillness</span>.
            </h1>
            <p className="mt-6 sm:mt-8 max-w-md text-base sm:text-lg text-muted-foreground leading-relaxed">
              Mudkraft is a slow craft studio. Every pot begins as river clay in the hands of
              a potter, and ends as a quiet object in your home.
            </p>
            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              <a
                href="#collection"
                className="group relative inline-flex items-center justify-center gap-3 bg-earth text-cream px-6 sm:px-8 py-3.5 sm:py-4 rounded-full text-[11px] sm:text-sm tracking-widest uppercase overflow-hidden transition-transform hover:-translate-y-0.5 whitespace-nowrap w-full sm:w-auto"
              >
                <span className="relative z-10">Explore the collection</span>
                <span className="relative z-10 transition-transform group-hover:translate-x-1">→</span>
                <span className="absolute inset-0 bg-clay translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              </a>
              <a href="#craft" className="text-sm text-earth underline underline-offset-4 decoration-clay/40 hover:decoration-clay text-center sm:text-left">
                Watch the wheel
              </a>
            </div>
          </div>

          <div className="md:col-span-6 relative order-1 md:order-2">
            <div className="relative aspect-[4/5] max-w-xs sm:max-w-md md:max-w-lg mx-auto md:ml-auto md:mr-0 animate-float">
              <div
                className="absolute -inset-6 rounded-full blur-3xl opacity-60"
                style={{ background: "radial-gradient(circle, oklch(0.58 0.14 42 / 0.5), transparent 70%)" }}
              />
              <img
                src={potImg.url}
                alt="Handcrafted terracotta clay pot"
                width={1600}
                height={1808}
                fetchPriority="high"
                decoding="async"
                className="relative w-full h-full object-contain drop-shadow-[0_40px_60px_rgba(80,40,20,0.35)]"
              />

            </div>
          </div>
        </div>

        <div className="hidden md:block absolute bottom-8 left-1/2 -translate-x-1/2 text-xs tracking-[0.4em] text-muted-foreground uppercase">
          scroll ↓
        </div>
      </section>

      {/* MARQUEE */}
      <section className="border-y border-border/50 py-6 overflow-hidden bg-earth/5">
        <div className="flex animate-marquee whitespace-nowrap gap-16 text-earth/70 font-display italic text-2xl md:text-3xl">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-16 pr-16">
              <span>river clay</span><span>·</span>
              <span>wood fired</span><span>·</span>
              <span>hand thrown</span><span>·</span>
              <span>seven generations</span><span>·</span>
              <span>slow made</span><span>·</span>
              <span>earth born</span><span>·</span>
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
              Objects that <span className="italic font-light">breathe</span>,<br className="hidden md:block" />
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
          <span className="text-[10px] tracking-[0.3em] uppercase text-clay font-medium mr-2 md:mr-4">Filter</span>
          {CATEGORIES.map((c) => {
            const count = c === "All" ? products.length : products.filter((p) => p.category === c).length;
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
                {c} <span className={`ml-1 text-[10px] ${isActive ? "text-cream/70" : "text-muted-foreground"}`}>({count})</span>
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
                to="/shop/$slug"
                params={{ slug: p.slug }}
                aria-label={`View ${p.name}`}
                className="relative block aspect-square"
              >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(35,45%,96%)_0%,transparent_65%)]" />
                <img
                  src={p.img}
                  alt={`Handcrafted ${p.name} — ${p.tag} from Mudkraft`}
                  width={900}
                  height={900}
                  loading="lazy"
                  className="relative w-full h-full object-contain p-5 sm:p-6 transition-transform duration-[1400ms] ease-out group-hover:scale-[1.06] drop-shadow-[0_30px_35px_rgba(80,40,20,0.35)]"
                />
                <div className="absolute top-4 left-4 text-[10px] tracking-[0.25em] uppercase bg-earth/90 backdrop-blur px-3 py-1.5 rounded-full text-cream">
                  {p.tag}
                </div>
                <div className="pointer-events-none absolute bottom-3 right-4 font-display italic text-sm text-earth/50 tracking-wide">
                  Mudkraft
                </div>
              </Link>

              <div className="flex items-end justify-between gap-4 px-6 pt-5 pb-6 border-t border-earth/10 bg-cream/40">
                <div className="min-w-0">
                  <Link
                    to="/shop/$slug"
                    params={{ slug: p.slug }}
                    className="hover:text-clay transition-colors"
                  >
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
      <section id="craft" className="relative py-20 md:py-32 mt-10 md:mt-20 grain overflow-hidden bg-earth">
        <div className="max-w-7xl mx-auto px-6 md:px-10 grid md:grid-cols-12 gap-10 md:gap-12 items-center">
          <div className="md:col-span-6 relative">
            <img
              src={handsClay}
              alt="Potter's hands shaping clay on the wheel"
              width={1408}
              height={1600}
              loading="lazy"
              className="w-full aspect-[4/5] object-cover rounded-[2rem] shadow-[0_40px_100px_-30px_rgba(0,0,0,0.6)]"
            />
            <div className="hidden md:block absolute -bottom-6 -right-6 bg-clay text-cream px-6 py-4 rounded-2xl font-display italic text-xl max-w-[220px]">
              "The wheel remembers what the hand forgets."
            </div>
          </div>

          <div className="md:col-span-6 text-cream">
            <p className="md:hidden font-display italic text-clay text-xl leading-snug mb-6 border-l-2 border-gold/60 pl-4">
              "The wheel remembers what the hand forgets."
            </p>
            <p className="text-xs tracking-[0.4em] uppercase text-gold mb-6">— the craft</p>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-display text-balance leading-tight">
              Seven generations,<br />
              <span className="italic text-gold">one wheel.</span>
            </h2>
            <p className="mt-6 md:mt-8 text-base md:text-lg text-cream/70 leading-relaxed max-w-md">
              We work with a single family of potters in Khurja, whose ancestors have thrown pots
              on the same wheel for over 180 years. No moulds. No machines. Only clay, water, fire, and time.
            </p>

            <div className="mt-10 md:mt-12 grid grid-cols-3 gap-4 sm:gap-8 border-t border-cream/20 pt-6 md:pt-8">
              {[
                { n: "180+", l: "years of craft" },
                { n: "12", l: "master potters" },
                { n: "48h", l: "of slow firing" },
              ].map((s) => (
                <div key={s.l}>
                  <div className="text-3xl sm:text-4xl md:text-5xl font-display text-gold">{s.n}</div>
                  <div className="mt-2 text-[10px] sm:text-xs tracking-widest uppercase text-cream/60">{s.l}</div>
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
          "<span className="not-italic">Mudkraft</span> is the craft of earth in your hands.
          We think of every home that keeps our clay as another quiet birth —
          of stillness, of ritual, of a slower way to hold what matters."
        </p>
        <div className="mt-8 md:mt-10 font-hand text-2xl text-clay">— Ananya, founder</div>
      </section>

      {/* JOURNAL / CTA */}
      <section
        id="journal"
        className="relative py-20 md:py-32 px-6 md:px-10 mx-4 sm:mx-6 md:mx-10 mb-16 rounded-[2rem] md:rounded-[2.5rem] grain overflow-hidden"
        style={{ background: "linear-gradient(135deg, oklch(0.58 0.14 42), oklch(0.42 0.11 38))" }}
      >
        <div className="max-w-3xl mx-auto text-center text-cream">
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-display text-balance leading-tight">
            Letters from<br /><span className="italic">the kiln.</span>
          </h2>
          <p className="mt-6 text-cream/80 max-w-md mx-auto">
            A quiet note once a month — new pieces, small essays on craft, and the occasional
            invitation to the studio.
          </p>
          <form className="mt-10 flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
            <label htmlFor="newsletter-email" className="sr-only">Email address</label>
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

      {/* FOOTER */}
      <footer className="relative bg-earth text-cream px-6 md:px-10 pt-20 pb-10 mt-10">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <span className="relative flex items-center justify-center shrink-0">
                <span
                  className="relative w-12 h-12 rounded-full flex items-center justify-center shadow-sm overflow-hidden -rotate-6"
                  style={{ background: "var(--gradient-clay)" }}
                >
                  <span
                    className="absolute inset-0 opacity-25"
                    style={{
                      backgroundImage: "radial-gradient(circle at center, #000 1px, transparent 1px)",
                      backgroundSize: "3px 3px",
                    }}
                  />
                  <span className="relative font-display text-cream text-2xl font-semibold leading-none -mt-0.5">M</span>
                </span>
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-earth"
                  style={{ backgroundColor: "var(--gold)" }}
                />
              </span>
              <span className="flex flex-col leading-none">
                <span className="text-4xl font-display text-gold leading-none tracking-tight">Mud<span className="italic">kraft</span></span>
                <span className="flex items-center gap-2 mt-2">
                  <span className="h-px w-5 bg-gold/40" />
                  <span className="text-[9px] uppercase tracking-[0.28em] text-gold/70 font-sans">Slow Craft Studio</span>
                </span>
              </span>
            </div>
            <p className="mt-6 font-hand text-2xl text-gold">made from earth, made with love</p>
            <p className="mt-4 text-cream/70 leading-relaxed max-w-sm">
              A slow craft studio from the banks of the Ganges. Each vessel is thrown by hand,
              dried under sky, and fired in a wood kiln.
            </p>
          </div>

          <div>
            <div className="text-xs tracking-[0.3em] uppercase text-gold mb-5">Explore</div>
            <ul className="space-y-3 text-cream/80">
              <li><a href="#collection" className="hover:text-gold transition-colors">Collection</a></li>
              <li><Link to="/workshops" className="hover:text-gold transition-colors">Workshops & Soil Report</Link></li>
              <li><a href="#story" className="hover:text-gold transition-colors">Story</a></li>
              <li><Link to="/care/season-your-handi" className="hover:text-gold transition-colors">Care Guide</Link></li>
            </ul>
          </div>

          <div>
            <div className="text-xs tracking-[0.3em] uppercase text-gold mb-5">Get in touch</div>
            <ul className="space-y-3 text-cream/80">
              <li>
                <a
                  href={whatsappEnquiry()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:text-gold transition-colors"
                >
                  <WhatsAppIcon className="w-4 h-4" /> WhatsApp
                </a>
              </li>
              <li>
                <a href={`mailto:${ENQUIRY_EMAIL}`} className="hover:text-gold transition-colors">
                  {ENQUIRY_EMAIL}
                </a>
              </li>
              <li>
                <a
                  href={whatsappEnquiry()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gold transition-colors"
                >
                  Enquiry &amp; wholesale
                </a>
              </li>
              <li>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors">
                  Instagram
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-cream/15 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-cream/60">
          <div>© {new Date().getFullYear()} Mudkraft Studio · Khurja, India</div>
          <div className="tracking-[0.3em] uppercase">Handmade · Slow · Soulful</div>
        </div>

        {/* Floating WhatsApp */}
        <a
          href={whatsappEnquiry()}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
          className="fixed bottom-6 right-6 z-40 inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-2xl hover:scale-110 transition-transform"
        >
          <WhatsAppIcon className="w-7 h-7" />
        </a>
      </footer>

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
                <div className="font-display text-2xl">{count} {count === 1 ? "piece" : "pieces"}</div>
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
                  <img src={x.img} alt={x.name} className="w-20 h-24 object-contain rounded-lg bg-cream p-1" />
                  <div className="flex-1">
                    <div className="font-display text-lg">{x.name}</div>
                    <div className="text-xs text-muted-foreground">{x.tag}</div>
                    <div className="mt-2 flex items-center gap-3">
                      <button onClick={() => updateQty(x.slug, -1)} className="w-7 h-7 rounded-full border border-border">−</button>
                      <span className="text-sm">{x.qty}</span>
                      <button onClick={() => updateQty(x.slug, 1)} className="w-7 h-7 rounded-full border border-border">+</button>
                      <button onClick={() => removeItem(x.slug)} className="ml-auto text-xs text-muted-foreground hover:text-clay">Remove</button>
                    </div>
                  </div>
                  <div className="font-display text-lg">₹{(x.priceNum * x.qty).toLocaleString("en-IN")}</div>
                </div>
              ))}
            </div>

            <div className="px-6 py-5 border-t border-border space-y-4 bg-cream">
              <div className="flex items-baseline justify-between">
                <span className="text-xs tracking-[0.3em] uppercase text-muted-foreground">Total</span>
                <span className="font-display text-3xl">₹{total.toLocaleString("en-IN")}</span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <label className="block">
                  <span className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">Your name</span>
                  <input
                    type="text"
                    value={customer.name}
                    onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                    placeholder="Aarushi Sharma"
                    className="mt-1 w-full bg-transparent border-b border-border focus:border-earth outline-none py-2 text-sm text-earth placeholder:text-muted-foreground/60"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">Phone (WhatsApp)</span>
                  <input
                    type="tel"
                    value={customer.phone}
                    onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                    placeholder="+91 98xxx xxxxx"
                    className="mt-1 w-full bg-transparent border-b border-border focus:border-earth outline-none py-2 text-sm text-earth placeholder:text-muted-foreground/60"
                  />
                </label>
              </div>

              <a
                href={canCheckout ? whatsappCheckout() : undefined}
                target="_blank"
                rel="noopener noreferrer"
                aria-disabled={!canCheckout}
                className={`w-full inline-flex items-center justify-center gap-2 py-4 rounded-full text-sm tracking-widest uppercase transition ${
                  canCheckout
                    ? "bg-earth text-cream hover:bg-clay"
                    : "bg-muted text-muted-foreground pointer-events-none"
                }`}
              >
                <WhatsAppIcon className="w-4 h-4" />
                Checkout on WhatsApp
              </a>
              <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                {cart.length === 0
                  ? "Add a piece to begin."
                  : !customer.name.trim() || !customer.phone.trim()
                  ? "Add your name and phone to send the order."
                  : "We confirm every order personally over WhatsApp — sharing dispatch, packing and payment details before your pieces travel."}
              </p>
            </div>

          </aside>
        </div>
      )}
    </div>
  );
}

function WhatsAppIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.52 3.48A11.86 11.86 0 0 0 12.04 0C5.5 0 .2 5.3.2 11.84c0 2.09.55 4.13 1.6 5.93L0 24l6.4-1.68a11.82 11.82 0 0 0 5.64 1.44h.01c6.54 0 11.84-5.3 11.84-11.84 0-3.16-1.23-6.13-3.37-8.44ZM12.05 21.4h-.01a9.55 9.55 0 0 1-4.87-1.34l-.35-.21-3.8 1 1.02-3.7-.23-.38a9.53 9.53 0 0 1-1.46-5.08c0-5.28 4.3-9.58 9.6-9.58 2.56 0 4.97.99 6.78 2.8a9.53 9.53 0 0 1 2.81 6.79c0 5.28-4.3 9.58-9.59 9.58Zm5.26-7.18c-.29-.14-1.7-.84-1.96-.94-.26-.1-.45-.14-.64.14-.19.29-.74.94-.9 1.13-.17.19-.33.21-.62.07-.29-.14-1.22-.45-2.32-1.43-.86-.77-1.44-1.72-1.6-2-.17-.29-.02-.44.13-.58.13-.13.29-.33.43-.5.14-.17.19-.29.29-.48.1-.19.05-.36-.02-.5-.07-.14-.64-1.54-.88-2.11-.23-.55-.47-.48-.64-.49h-.55c-.19 0-.5.07-.76.36-.26.29-1 .98-1 2.38 0 1.4 1.02 2.75 1.17 2.94.14.19 2.02 3.09 4.9 4.33.68.29 1.22.47 1.63.6.68.22 1.31.19 1.8.11.55-.08 1.7-.7 1.94-1.37.24-.67.24-1.25.17-1.37-.07-.12-.26-.19-.55-.34Z"/>
    </svg>
  );
}
