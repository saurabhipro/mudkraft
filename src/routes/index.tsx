import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import heroPot from "@/assets/hero-pot.jpg";
import handsClay from "@/assets/hands-clay.jpg";
import matkaStand from "@/assets/matka-stand.jpg.asset.json";
import kulhadSet from "@/assets/kulhad-set.jpg.asset.json";
import bottleJug from "@/assets/bottle-jug.jpg.asset.json";
import handiDuo from "@/assets/handi-duo.jpg.asset.json";
import handiSmall from "@/assets/handi-small.jpg.asset.json";
import sieveDome from "@/assets/sieve-dome.jpg.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kumbhaja — Soulful Handcrafted Clay" },
      {
        name: "description",
        content:
          "Kumbhaja is a slow craft studio shaping pots, kulhads, planters and diyas from river clay — made by hand, fired with fire, rooted in earth.",
      },
      { property: "og:title", content: "Kumbhaja — Soulful Handcrafted Clay" },
      {
        property: "og:description",
        content:
          "Kumbhaja is a slow craft studio shaping pots, kulhads, planters and diyas from river clay — made by hand, fired with fire, rooted in earth.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Inter:wght@300;400;500;600&family=Caveat:wght@400;600&display=swap",
      },
    ],
  }),
  component: Index,
});

type Product = { name: string; tag: string; price: string; priceNum: number; img: string; note: string };

const products: Product[] = [
  { name: "Surahi Matka", tag: "Water Pot", price: "₹1,240", priceNum: 1240, img: matkaStand.url, note: "Cools water the ancient way" },
  { name: "Kulhad", tag: "Tea Cup · Set of 6", price: "₹680", priceNum: 680, img: kulhadSet.url, note: "For chai that tastes of earth" },
  { name: "Bottle & Jug", tag: "Serveware · Duo", price: "₹1,480", priceNum: 1480, img: bottleJug.url, note: "Water that remembers the river" },
  { name: "Handi", tag: "Cookware · Set of 2", price: "₹1,120", priceNum: 1120, img: handiDuo.url, note: "Slow food, slower fire" },
  { name: "Chhoti Handi", tag: "Serving Bowl", price: "₹540", priceNum: 540, img: handiSmall.url, note: "Little vessel, full ritual" },
  { name: "Steam Dome", tag: "Idli / Steamer", price: "₹860", priceNum: 860, img: sieveDome.url, note: "Breath of the kitchen" },
];

// Replace with your real WhatsApp number (country code + number, no + or spaces)
const WHATSAPP_NUMBER = "919999999999";
const ENQUIRY_EMAIL = "hello@kumbhaja.com";

type CartItem = Product & { qty: number };

function Index() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);

  const addToCart = (p: Product) => {
    setCart((c) => {
      const existing = c.find((x) => x.name === p.name);
      if (existing) return c.map((x) => (x.name === p.name ? { ...x, qty: x.qty + 1 } : x));
      return [...c, { ...p, qty: 1 }];
    });
    setOpen(true);
  };

  const updateQty = (name: string, delta: number) =>
    setCart((c) =>
      c
        .map((x) => (x.name === name ? { ...x, qty: x.qty + delta } : x))
        .filter((x) => x.qty > 0)
    );

  const removeItem = (name: string) => setCart((c) => c.filter((x) => x.name !== name));

  const total = cart.reduce((s, x) => s + x.priceNum * x.qty, 0);
  const count = cart.reduce((s, x) => s + x.qty, 0);

  const checkoutMessage = () => {
    const lines = [
      "Namaste Kumbhaja 🙏",
      "I'd like to order:",
      ...cart.map((x) => `• ${x.name} × ${x.qty} — ₹${(x.priceNum * x.qty).toLocaleString("en-IN")}`),
      `Total: ₹${total.toLocaleString("en-IN")}`,
    ];
    return encodeURIComponent(lines.join("\n"));
  };

  const whatsappCheckout = () =>
    `https://wa.me/${WHATSAPP_NUMBER}?text=${checkoutMessage()}`;

  const whatsappEnquiry = () =>
    `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      "Namaste Kumbhaja 🙏 I'd love to know more about your clay pieces."
    )}`;

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* NAV */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/70 border-b border-border/40">
        <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 md:px-10 py-5">
          <a href="#" className="flex items-center gap-3">
            <span className="text-3xl font-display italic text-earth leading-none">कुम्भज</span>
            <span className="hidden sm:inline tracking-[0.35em] text-xs font-medium text-earth">KUMBHAJA</span>
          </a>
          <div className="hidden md:flex items-center gap-10 text-sm text-muted-foreground">
            <a href="#collection" className="hover:text-clay transition-colors">Collection</a>
            <a href="#craft" className="hover:text-clay transition-colors">The Craft</a>
            <Link to="/workshops" className="hover:text-clay transition-colors">Workshops</Link>
            <a href="#story" className="hover:text-clay transition-colors">Story</a>
            <a href="#journal" className="hover:text-clay transition-colors">Journal</a>
          </div>
          <div className="flex items-center gap-3">
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
              className="relative inline-flex items-center gap-2 text-xs tracking-widest uppercase bg-earth text-cream px-5 py-2.5 rounded-full hover:bg-clay transition-colors"
            >
              Cart
              <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-gold text-earth text-[11px] font-medium">
                {count}
              </span>
            </button>
          </div>
        </nav>
      </header>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center pt-24 pb-16 grain">
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
          <div className="md:col-span-6 relative z-10 animate-fade-up">
            <p className="font-hand text-clay text-2xl mb-6">— shaped by hand, held by earth</p>
            <h1 className="text-balance text-[clamp(3rem,8vw,7rem)] leading-[0.95] font-display text-earth">
              The soul of<br />
              <span className="italic text-clay-deep">soil</span>, spun<br />
              into <span className="italic">stillness</span>.
            </h1>
            <p className="mt-8 max-w-md text-lg text-muted-foreground leading-relaxed">
              Kumbhaja is a slow craft studio. Every pot begins as river clay in the hands of
              a potter, and ends as a quiet object in your home.
            </p>
            <div className="mt-10 flex items-center gap-6">
              <a
                href="#collection"
                className="group relative inline-flex items-center gap-3 bg-earth text-cream px-8 py-4 rounded-full text-sm tracking-widest uppercase overflow-hidden transition-transform hover:-translate-y-0.5"
              >
                <span className="relative z-10">Explore the collection</span>
                <span className="relative z-10 transition-transform group-hover:translate-x-1">→</span>
                <span className="absolute inset-0 bg-clay translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              </a>
              <a href="#craft" className="text-sm text-earth underline underline-offset-4 decoration-clay/40 hover:decoration-clay">
                Watch the wheel
              </a>
            </div>
          </div>

          <div className="md:col-span-6 relative">
            <div className="relative aspect-[4/5] max-w-lg ml-auto animate-float">
              <div
                className="absolute -inset-6 rounded-full blur-3xl opacity-60"
                style={{ background: "radial-gradient(circle, oklch(0.58 0.14 42 / 0.5), transparent 70%)" }}
              />
              <img
                src={heroPot}
                alt="Handcrafted terracotta clay pot in warm light"
                width={1600}
                height={1808}
                className="relative w-full h-full object-cover rounded-[2rem] shadow-[0_40px_100px_-30px_rgba(80,40,20,0.5)]"
              />
              <div className="absolute -bottom-4 -left-4 bg-cream/95 backdrop-blur px-5 py-3 rounded-full text-xs tracking-widest uppercase text-earth shadow-lg border border-border">
                Est. from the Ganges
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs tracking-[0.4em] text-muted-foreground uppercase">
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
      <section id="collection" className="py-32 px-6 md:px-10 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-12 gap-6 mb-20 items-end">
          <div className="md:col-span-7">
            <p className="text-xs tracking-[0.4em] uppercase text-clay mb-6">— the collection</p>
            <h2 className="text-5xl md:text-7xl font-display text-earth text-balance">
              Objects that <span className="italic">breathe</span>, made<br />to be lived with.
            </h2>
          </div>
          <p className="md:col-span-4 md:col-start-9 text-muted-foreground text-lg leading-relaxed">
            Four families of clay — each thrown, dried under sky, and fired in a slow wood kiln.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-x-8 gap-y-20">
          {products.map((p, i) => (
            <div
              key={p.name}
              className={`group block ${i % 2 === 1 ? "md:translate-y-24" : ""}`}
            >
              <button
                type="button"
                onClick={() => addToCart(p)}
                aria-label={`Add ${p.name} to cart`}
                className="relative w-full overflow-hidden rounded-[1.5rem] bg-muted aspect-[4/5] block text-left"
              >
                <img
                  src={p.img}
                  alt={p.name}
                  width={900}
                  height={1100}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-earth/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="absolute top-5 left-5 text-xs tracking-widest uppercase bg-cream/90 backdrop-blur px-3 py-1.5 rounded-full text-earth">
                  {p.tag}
                </div>
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 bg-cream text-earth px-6 py-3 rounded-full text-xs tracking-widest uppercase shadow-xl whitespace-nowrap">
                  + Add to cart
                </div>
              </button>
              <div className="mt-6 flex items-baseline justify-between gap-6">
                <div>
                  <h3 className="text-3xl font-display text-earth">{p.name}</h3>
                  <p className="mt-1 font-hand text-clay text-xl">{p.note}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-display text-earth">{p.price}</div>
                  <button
                    onClick={() => addToCart(p)}
                    className="mt-1 text-xs tracking-widest uppercase text-muted-foreground hover:text-clay transition-colors"
                  >
                    Add →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CRAFT */}
      <section id="craft" className="relative py-32 mt-20 grain overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-earth" />
        <div className="max-w-7xl mx-auto px-6 md:px-10 grid md:grid-cols-12 gap-12 items-center">
          <div className="md:col-span-6 relative">
            <img
              src={handsClay}
              alt="Potter's hands shaping clay on the wheel"
              width={1408}
              height={1600}
              loading="lazy"
              className="w-full aspect-[4/5] object-cover rounded-[2rem] shadow-[0_40px_100px_-30px_rgba(0,0,0,0.6)]"
            />
            <div className="absolute -bottom-6 -right-6 bg-clay text-cream px-6 py-4 rounded-2xl font-display italic text-xl max-w-[200px]">
              "The wheel remembers what the hand forgets."
            </div>
          </div>

          <div className="md:col-span-6 text-cream">
            <p className="text-xs tracking-[0.4em] uppercase text-gold mb-6">— the craft</p>
            <h2 className="text-5xl md:text-6xl font-display text-balance">
              Seven generations,<br />
              <span className="italic text-gold">one wheel.</span>
            </h2>
            <p className="mt-8 text-lg text-cream/70 leading-relaxed max-w-md">
              We work with a single family of potters in Khurja, whose ancestors have thrown pots
              on the same wheel for over 180 years. No moulds. No machines. Only clay, water, fire, and time.
            </p>

            <div className="mt-12 grid grid-cols-3 gap-8 border-t border-cream/20 pt-8">
              {[
                { n: "180+", l: "years of craft" },
                { n: "12", l: "master potters" },
                { n: "48h", l: "of slow firing" },
              ].map((s) => (
                <div key={s.l}>
                  <div className="text-4xl md:text-5xl font-display text-gold">{s.n}</div>
                  <div className="mt-2 text-xs tracking-widest uppercase text-cream/60">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* STORY */}
      <section id="story" className="py-32 px-6 md:px-10 max-w-4xl mx-auto text-center">
        <p className="text-xs tracking-[0.4em] uppercase text-clay mb-8">— our story</p>
        <p className="text-3xl md:text-5xl font-display italic text-earth leading-[1.15] text-balance">
          "In Sanskrit, <span className="not-italic">Kumbhaja</span> means the one born of a pot.
          We think of every home that keeps our clay as another quiet birth —
          of stillness, of ritual, of a slower way to hold what matters."
        </p>
        <div className="mt-10 font-hand text-2xl text-clay">— Ananya, founder</div>
      </section>

      {/* JOURNAL / CTA */}
      <section id="journal" className="relative py-32 px-6 md:px-10 mx-6 md:mx-10 mb-16 rounded-[2.5rem] grain overflow-hidden">
        <div
          className="absolute inset-0 -z-10"
          style={{ background: "linear-gradient(135deg, oklch(0.58 0.14 42), oklch(0.42 0.11 38))" }}
        />
        <div className="max-w-3xl mx-auto text-center text-cream">
          <h2 className="text-5xl md:text-7xl font-display text-balance">
            Letters from<br /><span className="italic">the kiln.</span>
          </h2>
          <p className="mt-6 text-cream/80 max-w-md mx-auto">
            A quiet note once a month — new pieces, small essays on craft, and the occasional
            invitation to the studio.
          </p>
          <form className="mt-10 flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="your@email"
              className="flex-1 bg-cream/10 border border-cream/30 rounded-full px-6 py-4 text-cream placeholder:text-cream/50 focus:outline-none focus:border-cream transition"
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
              <span className="text-4xl font-display italic text-gold leading-none">कुम्भज</span>
              <span className="tracking-[0.35em] text-xs text-cream/80">KUMBHAJA</span>
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
              <li><a href="#craft" className="hover:text-gold transition-colors">The Craft</a></li>
              <li><Link to="/workshops" className="hover:text-gold transition-colors">Workshops & Soil Report</Link></li>
              <li><a href="#story" className="hover:text-gold transition-colors">Story</a></li>
              <li><a href="#journal" className="hover:text-gold transition-colors">Journal</a></li>
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
          <div>© {new Date().getFullYear()} Kumbhaja Studio · Khurja, India</div>
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
                <div key={x.name} className="flex gap-4 py-3 border-b border-border/60">
                  <img src={x.img} alt={x.name} className="w-20 h-24 object-cover rounded-lg" />
                  <div className="flex-1">
                    <div className="font-display text-lg">{x.name}</div>
                    <div className="text-xs text-muted-foreground">{x.tag}</div>
                    <div className="mt-2 flex items-center gap-3">
                      <button onClick={() => updateQty(x.name, -1)} className="w-7 h-7 rounded-full border border-border">−</button>
                      <span className="text-sm">{x.qty}</span>
                      <button onClick={() => updateQty(x.name, 1)} className="w-7 h-7 rounded-full border border-border">+</button>
                      <button onClick={() => removeItem(x.name)} className="ml-auto text-xs text-muted-foreground hover:text-clay">Remove</button>
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
              <a
                href={cart.length ? whatsappCheckout() : undefined}
                target="_blank"
                rel="noopener noreferrer"
                aria-disabled={cart.length === 0}
                className={`w-full inline-flex items-center justify-center gap-2 py-4 rounded-full text-sm tracking-widest uppercase transition ${
                  cart.length
                    ? "bg-earth text-cream hover:bg-clay"
                    : "bg-muted text-muted-foreground pointer-events-none"
                }`}
              >
                <WhatsAppIcon className="w-4 h-4" />
                Checkout on WhatsApp
              </a>
              <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                We confirm every order personally over WhatsApp — sharing dispatch, packing and
                payment details before your pieces travel.
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
