import { createFileRoute } from "@tanstack/react-router";
import heroPot from "@/assets/hero-pot.jpg";
import handsClay from "@/assets/hands-clay.jpg";
import productMatka from "@/assets/product-matka.jpg";
import productKulhad from "@/assets/product-kulhad.jpg";
import productPlanter from "@/assets/product-planter.jpg";
import productDiya from "@/assets/product-diya.jpg";

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
          "Slow-made pottery from river clay. Pots, kulhads, planters, diyas — each piece shaped by hand.",
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

const products = [
  { name: "Surahi Matka", tag: "Water Pot", price: "₹1,240", img: productMatka, note: "Cools water the ancient way" },
  { name: "Kulhad", tag: "Tea Cup · Set of 6", price: "₹680", img: productKulhad, note: "For chai that tastes of earth" },
  { name: "Bhumi Planter", tag: "Planter", price: "₹920", img: productPlanter, note: "Breathes with the roots" },
  { name: "Deepa Diya", tag: "Oil Lamp · Set of 12", price: "₹360", img: productDiya, note: "Light from the soil" },
];

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* NAV */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/70 border-b border-border/40">
        <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 md:px-10 py-5">
          <a href="#" className="flex items-center gap-2">
            <span className="text-2xl font-display italic text-earth">कु</span>
            <span className="tracking-[0.35em] text-xs font-medium text-earth">KUMBHAJA</span>
          </a>
          <div className="hidden md:flex items-center gap-10 text-sm text-muted-foreground">
            <a href="#collection" className="hover:text-clay transition-colors">Collection</a>
            <a href="#craft" className="hover:text-clay transition-colors">The Craft</a>
            <a href="#story" className="hover:text-clay transition-colors">Story</a>
            <a href="#journal" className="hover:text-clay transition-colors">Journal</a>
          </div>
          <a
            href="#collection"
            className="text-xs tracking-widest uppercase border border-earth/30 px-5 py-2.5 rounded-full text-earth hover:bg-earth hover:text-cream transition-all duration-500"
          >
            Shop
          </a>
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
            <a
              key={p.name}
              href="#"
              className={`group block ${i % 2 === 1 ? "md:translate-y-24" : ""}`}
            >
              <div className="relative overflow-hidden rounded-[1.5rem] bg-muted aspect-[4/5]">
                <img
                  src={p.img}
                  alt={p.name}
                  width={900}
                  height={1100}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-earth/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="absolute top-5 left-5 text-xs tracking-widest uppercase bg-cream/90 backdrop-blur px-3 py-1.5 rounded-full text-earth">
                  {p.tag}
                </div>
              </div>
              <div className="mt-6 flex items-baseline justify-between gap-6">
                <div>
                  <h3 className="text-3xl font-display text-earth">{p.name}</h3>
                  <p className="mt-1 font-hand text-clay text-xl">{p.note}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-display text-earth">{p.price}</div>
                  <div className="mt-1 text-xs tracking-widest uppercase text-muted-foreground group-hover:text-clay transition-colors">
                    Add →
                  </div>
                </div>
              </div>
            </a>
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
      <footer className="border-t border-border/50 px-6 md:px-10 py-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="text-xl font-display italic text-earth">कु</span>
            <span className="tracking-[0.3em] text-xs text-earth">KUMBHAJA</span>
          </div>
          <div className="font-hand text-lg text-clay">made from earth, made with love</div>
          <div className="text-xs tracking-widest uppercase">© {new Date().getFullYear()} Kumbhaja Studio</div>
        </div>
      </footer>
    </div>
  );
}
