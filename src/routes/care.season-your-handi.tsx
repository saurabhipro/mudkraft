import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import handiSoak from "@/assets/handi-soak.jpg";

export const Route = createFileRoute("/care/season-your-handi")({
  head: () => ({
    meta: [
      { title: "How to Season a Clay Handi (So It Never Cracks) — Mudkraft" },
      {
        name: "description",
        content:
          "A step-by-step ritual to cure your new clay handi before cooking — soak, dry, first rice, and daily care. Follow it once and your handi will last for years without cracking.",
      },
      { property: "og:title", content: "How to Season a Clay Handi — Mudkraft" },
      {
        property: "og:description",
        content:
          "Soak, dry, first rice, daily care — the full ritual to cure a new clay handi before you cook in it.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "canonical", href: "https://mudkraft.lovable.app/care/season-your-handi" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: "How to season a clay handi before cooking",
          description:
            "A traditional five-step ritual to cure a new terracotta handi so it does not crack on the stove.",
          totalTime: "P2D",
          supply: [
            { "@type": "HowToSupply", name: "New clay handi" },
            { "@type": "HowToSupply", name: "Clean water" },
            { "@type": "HowToSupply", name: "Rice (½ cup)" },
            { "@type": "HowToSupply", name: "Mustard or coconut oil (1 tbsp)" },
          ],
          step: [
            { "@type": "HowToStep", name: "Soak", text: "Fully submerge the handi in clean water for 12–24 hours." },
            { "@type": "HowToStep", name: "Dry", text: "Air-dry in the shade for at least 6 hours until no dark patches remain." },
            { "@type": "HowToStep", name: "Oil rub", text: "Rub the inside and outside with a thin layer of mustard or coconut oil." },
            { "@type": "HowToStep", name: "First rice", text: "Cook a batch of plain rice on very low flame — this seals the pores." },
            { "@type": "HowToStep", name: "Daily care", text: "Wash with warm water, avoid soap, and always heat on a low flame from cold." },
          ],
        }),
      },
    ],
  }),
  component: SeasonHandiPage,
});

const WHATSAPP_NUMBER = "919990649990";

const steps = [
  {
    n: "01",
    title: "Soak in water",
    time: "12–24 hours",
    body: "Place the new handi in a large tub or bucket and submerge it completely — lid too. Fresh terracotta is thirsty; it will drink water into every pore. This is what stops it from cracking later on the flame.",
    tip: "Small bubbles rising from the clay are a good sign — it's breathing in.",
  },
  {
    n: "02",
    title: "Dry in the shade",
    time: "6–8 hours",
    body: "Lift it out, pour off the water, and set it upside-down on a cloth in a shaded spot with good airflow. Never in direct sun — that dries it unevenly and invites hairline cracks. Wait until the surface looks a single, uniform earth colour with no darker damp patches.",
    tip: "In humid weather, give it a full day.",
  },
  {
    n: "03",
    title: "Oil the inside",
    time: "10 minutes",
    body: "Rub a thin layer of mustard oil (or coconut oil) all over the inside and lightly on the outside base. Use your fingers — feel the clay. This oil will soak in and form the first non-stick, water-resistant seasoning.",
    tip: "Any cold-pressed cooking oil works. Skip refined oils.",
  },
  {
    n: "04",
    title: "Cook your first rice",
    time: "45 minutes on low flame",
    body: "Add ½ cup of rice, 2 cups of water and a pinch of salt. Place the handi on the smallest burner at the lowest flame. Let it come to a slow boil, cover, and cook until the rice is done. The starch will seal the inner pores — this is the traditional sanskaar the pot needs before it can hold your daily food.",
    tip: "Never place a cold handi on a hot flame. Always start cold-to-cold and warm slowly.",
  },
  {
    n: "05",
    title: "Daily care, forever",
    time: "a lifetime",
    body: "Wash with warm water and a soft cloth — no dish soap, no scrubber. Sun-dry after washing. Always heat from cold on a low flame; a heat diffuser helps on gas or induction. Once a month, re-oil the inside. Treated this way, a Mudkraft handi will feed your family for many years.",
    tip: "If you ever see a tiny hairline, soak overnight in rice water — it re-seals itself.",
  },
];

function SeasonHandiPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SiteHeader
        rightSlot={
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center text-xs tracking-widest uppercase bg-earth text-cream px-5 py-2.5 rounded-full hover:bg-clay transition-colors"
          >
            Enquire
          </a>
        }
      />

      {/* HERO */}
      <section className="relative pt-40 pb-20 grain">
        <div
          className="absolute inset-0 -z-10 opacity-90"
          style={{
            background:
              "radial-gradient(ellipse at 30% 40%, oklch(0.88 0.06 65) 0%, oklch(0.955 0.018 75) 60%)",
          }}
        />
        <div className="max-w-7xl mx-auto px-6 md:px-10 grid md:grid-cols-12 gap-10 items-center">
          <div className="md:col-span-7">
            <p className="font-hand text-clay text-2xl mb-6">— a small ritual, once</p>
            <h1 className="text-balance text-[clamp(2.25rem,6vw,5rem)] leading-[0.98] font-display text-earth">
              Season your <span className="italic text-clay-deep">handi</span><br />
              so it never cracks.
            </h1>
            <p className="mt-8 max-w-xl text-lg text-muted-foreground leading-relaxed">
              Every new clay pot needs one gentle ceremony before it meets the flame — a
              soak, a rest, a first rice. Follow these five steps once and your handi
              will hold your food for many years.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-earth/80">
              <span className="flex items-center gap-2"><span className="text-clay">◦</span> 5 steps</span>
              <span className="flex items-center gap-2"><span className="text-clay">◦</span> ~2 days total</span>
              <span className="flex items-center gap-2"><span className="text-clay">◦</span> No special tools</span>
            </div>
          </div>
          <div className="md:col-span-5">
            <img
              src={handiSoak}
              alt="A new clay handi soaking in water — the first step of seasoning"
              width={1200}
              height={900}
              className="w-full aspect-[4/3] object-cover rounded-[2rem] shadow-[0_40px_100px_-30px_rgba(80,40,20,0.5)]"
            />
          </div>
        </div>
      </section>

      {/* WHY */}
      <section className="py-20 px-6 md:px-10 max-w-4xl mx-auto text-center">
        <p className="text-xs tracking-[0.4em] uppercase text-clay mb-6">— why season?</p>
        <h2 className="text-3xl md:text-5xl font-display text-earth text-balance leading-tight">
          Terracotta is <span className="italic">alive</span>. It expands, breathes, and remembers heat.
        </h2>
        <p className="mt-6 text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          A new handi is dry and porous — sudden fire will make it split. Soaking fills its
          pores with water, and cooking rice inside coats it with a natural starch seal.
          After this one ritual, you can cook dal, biryani, curries, milk — anything.
        </p>
      </section>

      {/* STEPS */}
      <section className="pb-24 px-6 md:px-10 max-w-5xl mx-auto">
        <div className="mb-14">
          <p className="text-xs tracking-[0.4em] uppercase text-clay mb-6">— the five steps</p>
          <h2 className="text-4xl md:text-6xl font-display text-earth text-balance max-w-3xl">
            One evening of care, then <span className="italic">years</span> of cooking.
          </h2>
        </div>

        <ol className="space-y-6">
          {steps.map((s) => (
            <li
              key={s.n}
              className="group relative rounded-[1.5rem] border border-border bg-cream/50 p-8 md:p-10 hover:border-clay transition-colors"
            >
              <div className="grid md:grid-cols-[auto_1fr] gap-6 md:gap-10">
                <div className="font-display text-6xl md:text-7xl text-clay/70 leading-none">
                  {s.n}
                </div>
                <div>
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <h3 className="text-2xl md:text-3xl font-display text-earth">{s.title}</h3>
                    <div className="text-xs tracking-widest uppercase text-clay">{s.time}</div>
                  </div>
                  <p className="mt-4 text-earth/90 leading-relaxed">{s.body}</p>
                  <div className="mt-5 border-l-2 border-clay/40 pl-4 font-hand text-lg text-clay-deep">
                    {s.tip}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* DO / DON'T */}
      <section className="py-24 px-6 md:px-10 bg-earth text-cream grain">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs tracking-[0.4em] uppercase text-gold mb-6">— to remember</p>
          <h2 className="text-4xl md:text-5xl font-display text-balance mb-12">
            A few small things, forever.
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-[1.5rem] border border-cream/15 bg-cream/[0.04] p-8">
              <div className="text-xs tracking-[0.3em] uppercase text-gold mb-5">Do</div>
              <ul className="space-y-3 text-cream/90">
                {[
                  "Always start on a low flame from a cold pot",
                  "Use a heat diffuser on gas or induction",
                  "Wash with warm water and a soft cloth",
                  "Sun-dry after every wash",
                  "Re-oil the inside once a month",
                ].map((d) => (
                  <li key={d} className="flex gap-3"><span className="text-gold">◦</span>{d}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-[1.5rem] border border-cream/15 bg-cream/[0.04] p-8">
              <div className="text-xs tracking-[0.3em] uppercase text-gold mb-5">Don't</div>
              <ul className="space-y-3 text-cream/90">
                {[
                  "Never place a cold handi on a hot flame",
                  "No dish soap — it soaks into the clay",
                  "No steel scrubbers — soft cloth only",
                  "Don't store food in it overnight",
                  "Don't put a hot handi under cold water",
                ].map((d) => (
                  <li key={d} className="flex gap-3"><span className="text-gold">×</span>{d}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 md:px-10 max-w-3xl mx-auto text-center">
        <p className="font-hand text-clay text-2xl mb-6">— stuck somewhere?</p>
        <h2 className="text-3xl md:text-5xl font-display text-earth text-balance leading-tight">
          Message us on WhatsApp and we'll walk you through it.
        </h2>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Namaste 🙏 I need help seasoning my Mudkraft handi.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-earth text-cream px-8 py-4 rounded-full text-sm tracking-widest uppercase hover:bg-clay transition-colors"
          >
            Ask on WhatsApp →
          </a>
          <Link
            to="/"
            hash="collection"
            className="inline-flex items-center gap-3 border border-earth/30 text-earth px-8 py-4 rounded-full text-sm tracking-widest uppercase hover:bg-earth hover:text-cream transition-colors"
          >
            Shop the collection
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-earth text-cream px-6 md:px-10 pt-16 pb-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-3">
            <span className="text-3xl sm:text-4xl md:text-5xl font-display italic text-gold leading-none tracking-tight">
              Mudkraft
            </span>
          </Link>
          <div className="font-hand text-xl text-gold">made from earth, made with love</div>
          <div className="text-xs tracking-widest uppercase text-cream/60">© {new Date().getFullYear()} Mudkraft Studio</div>
        </div>
      </footer>
    </div>
  );
}
