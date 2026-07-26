import type { Metadata } from "next";

import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { OG_IMAGE } from "@/lib/seo";

const TITLE = "FAQ — Mudkraft";
const DESCRIPTION =
  "Answers about our handcrafted clay pots, seasoning, shipping, care, and workshops.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website", images: [OG_IMAGE] },
  twitter: { card: "summary_large_image", images: [OG_IMAGE] },
};

const FAQS: { q: string; a: string }[] = [
  {
    q: "Are the pots food-safe?",
    a: "Yes. We use river clay fired in a wood kiln with no chemical glaze. Season each piece once before first use — see our Care Guide for the 5-step ritual.",
  },
  {
    q: "How do I season a new handi before cooking?",
    a: "Soak it fully submerged in water for 12 hours, air-dry in shade for 24 hours, rub the inside with mustard or coconut oil, cook plain rice or dal-water on a low flame, then cool and rinse. Full steps live on our Care Guide page.",
  },
  {
    q: "Will the pot crack on my gas stove or induction?",
    a: "Direct flame is safe on low-to-medium once seasoned. Always start cold, warm slowly, and never place a hot pot on a cold surface. Induction does not work — clay is non-magnetic.",
  },
  {
    q: "How do I clean a clay pot?",
    a: "Rinse with warm water and a soft brush. Skip dish soap — the porous clay will absorb detergent. For stubborn residue, use a paste of baking soda and water. Sun-dry fully before storing.",
  },
  {
    q: "Do you ship across India?",
    a: "Yes. We ship pan-India with careful straw-and-cotton packing. Shipping timelines and cost are shared on WhatsApp before we confirm your order.",
  },
  {
    q: "How do I place an order?",
    a: "Add pieces to your cart and tap Checkout — it opens WhatsApp with your order pre-filled. We reply within a few hours with total, shipping, and payment details.",
  },
  {
    q: "What payment methods do you accept?",
    a: "UPI, bank transfer, and major cards through a shared payment link. Payment is confirmed on WhatsApp before dispatch.",
  },
  {
    q: "Can I return or exchange a pot?",
    a: "If your piece arrives damaged in transit, send us a photo within 48 hours of delivery and we will replace it. Because each vessel is hand-thrown, minor variation in shape, tone, and finish is part of the craft — not a defect.",
  },
  {
    q: "Do you host workshops or school visits?",
    a: "Yes — birthday parties, school field trips, corporate off-sites, and private wheel sessions at our studio. See the Workshops page or WhatsApp us to book a date.",
  },
  {
    q: "Do you do wholesale or custom orders?",
    a: "We take small-batch wholesale for cafes, restaurants, and gift stores, plus custom shapes for weddings and brand orders. Message us on WhatsApp with quantities and timeline.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-cream text-earth">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <SiteHeader />

      <section className="pt-32 md:pt-40 pb-16 px-6 md:px-10 max-w-4xl mx-auto">
        <div className="text-xs tracking-[0.4em] uppercase text-clay mb-6">Support</div>
        <h1 className="font-display text-5xl md:text-7xl leading-[0.95] tracking-tight">
          Questions,<br />
          <span className="italic font-light">answered honestly.</span>
        </h1>
        <p className="mt-6 text-lg text-earth/70 max-w-2xl">
          Everything you might wonder before ordering a piece of Mudkraft — seasoning, shipping,
          care, workshops, and the small human bits.
        </p>
      </section>

      <section className="px-6 md:px-10 max-w-4xl mx-auto pb-24">
        <ul className="divide-y divide-earth/15 border-y border-earth/15">
          {FAQS.map((f, i) => (
            <li key={i} className="py-8 grid md:grid-cols-[3rem_1fr] gap-4 md:gap-8">
              <div className="text-xs tracking-widest text-clay font-sans">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div>
                <h2 className="font-display text-2xl md:text-3xl text-earth leading-snug">{f.q}</h2>
                <p className="mt-3 text-earth/75 leading-relaxed">{f.a}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-16 bg-earth text-cream rounded-3xl p-10 md:p-14 text-center">
          <div className="font-hand text-2xl text-gold">still wondering?</div>
          <h2 className="mt-2 font-display text-3xl md:text-5xl">Talk to us on WhatsApp</h2>
          <p className="mt-4 text-cream/70 max-w-lg mx-auto">
            We answer every message ourselves — no bots, no scripts.
          </p>
          <a
            href="https://wa.me/919990649990?text=Namaste%20Mudkraft!%20I%20have%20a%20question."
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 bg-gold text-earth px-8 py-4 rounded-full text-sm tracking-widest uppercase hover:scale-105 transition-transform"
          >
            Message us
          </a>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
