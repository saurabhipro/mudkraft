import type { Metadata } from "next";

import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { OrdersEnquiries } from "@/components/OrdersEnquiries";
import { BROCHURE } from "@/lib/catalogue";
import { OG_IMAGE, SITE_URL } from "@/lib/seo";
import { whatsappLink } from "@/lib/whatsapp";

const URL = `${SITE_URL}/soil-report`;
const TITLE = "Soil Report — Lab-Tested, Food-Safe River Clay | Mudkraft";
const DESCRIPTION =
  "The full lab report on Mudkraft's river clay from Khurja: tested by the Central Glass & Ceramic Research Institute. pH 7.2, no lead, cadmium or arsenic detected, no chemical glaze.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "article",
    url: URL,
    images: [OG_IMAGE],
  },
  twitter: { card: "summary_large_image", images: [OG_IMAGE] },
};

// From the CGCRI report, as printed on page 4 of the catalogue.
const PHYSICAL = [
  { k: "Colour, wet / fired", v: "Ochre-brown / terracotta" },
  { k: "Plasticity index", v: "22.4 · highly plastic" },
  { k: "Shrinkage, wet to fired", v: "9.7%" },
  { k: "Water absorption, fired", v: "12.8%" },
  { k: "Firing range", v: "920–1040 °C" },
  { k: "Kiln", v: "Wood, 48 h slow cycle" },
];

const CHEMICAL = [
  { k: "pH", v: "7.2 · near-neutral" },
  { k: "Organic content", v: "1.8% · aged 90 days" },
  { k: "Iron oxide (Fe₂O₃)", v: "6.4%" },
  { k: "Silica (SiO₂)", v: "58.1%" },
  { k: "Alumina (Al₂O₃)", v: "18.3%" },
  { k: "Lead, cadmium, arsenic", v: "Not detected", highlight: true },
];

const PARTICLES = [
  { label: "Clay", pct: 58, className: "bg-clay-deep text-cream" },
  { label: "Silt", pct: 34, className: "bg-[#d7a27c] text-ink" },
  { label: "Fine sand", pct: 8, className: "bg-[#e6d5c0] text-ink" },
];

const MEANING = [
  {
    figure: "Not detected",
    title: "Lead, cadmium, arsenic",
    body: "No heavy metals above the lab's detection limits, and no chemical glaze on any piece. Food touches only fired clay.",
  },
  {
    figure: "pH 7.2",
    title: "Near-neutral clay",
    body: "The clay itself is close to neutral, so it sits gently with tomato, tamarind and curd.",
  },
  {
    figure: "12.8%",
    title: "Water absorption",
    body: "The fired walls stay porous. That is why a matka cools water, and why a new handi is soaked before first use.",
  },
  {
    figure: "48 h",
    title: "Slow wood firing",
    body: "Fired at 920–1040 °C over two days, so the pot is strong enough for years of daily cooking.",
  },
];

const requestReport = () =>
  whatsappLink([
    "Namaste Mudkraft! Please share the full soil lab report (CGCRI/KHRJ/2026-03-118).",
  ]);

function PropertyTable({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ k: string; v: string; highlight?: boolean }>;
}) {
  return (
    <div>
      <h2 className="mb-3 font-display font-normal text-[2.25rem] text-earth">{title}</h2>
      <table className="w-full border-collapse border-t border-earth text-[15px]">
        <tbody>
          {rows.map((r) => (
            <tr key={r.k} className="border-b border-border">
              <th scope="row" className="py-3.5 pr-4 text-left font-normal text-muted-foreground">
                {r.k}
              </th>
              <td
                className={`py-3.5 text-right font-medium ${r.highlight ? "text-clay-deep" : "text-earth"}`}
              >
                {r.v}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SoilReportPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main>
        <section className="bg-kiln text-cream px-6 md:px-10 pt-36 md:pt-44 pb-16 md:pb-20">
          <div className="max-w-6xl mx-auto flex flex-wrap items-end justify-between gap-12">
            <div className="flex-[1_1_520px]">
              <p className="text-[11px] tracking-[0.32em] uppercase text-gold">Soil report</p>
              <h1 className="mt-4 font-display font-normal text-[clamp(3.25rem,7vw,6rem)] leading-[0.95]">
                Know your clay.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-cream/75">
                Every Mudkraft piece is made from river clay tested by an independent national
                laboratory. Here is everything the report found, and what it means for the food you
                cook.
              </p>
            </div>
            <div className="flex-[0_1_340px] rounded-2xl border border-gold/40 px-7 py-6">
              <p className="text-[11px] tracking-[0.28em] uppercase text-gold">Tested by</p>
              <p className="mt-3 font-display text-[1.65rem] leading-tight">
                Central Glass &amp; Ceramic Research Institute
              </p>
              <p className="mt-3 text-sm leading-relaxed text-cream/75">
                March 2026
                <br />
                Ref. CGCRI/KHRJ/2026-03-118
              </p>
            </div>
          </div>
        </section>

        <section className="px-6 md:px-10 pt-14">
          <div className="max-w-6xl mx-auto grid sm:grid-cols-2 gap-6">
            <div className="border-t border-border pt-4">
              <p className="text-[11px] tracking-[0.28em] uppercase text-muted-foreground">
                Origin
              </p>
              <p className="mt-2 text-[17px] text-earth">
                River bank silt, Ganges tributary, Khurja (Uttar Pradesh)
              </p>
            </div>
            <div className="border-t border-border pt-4">
              <p className="text-[11px] tracking-[0.28em] uppercase text-muted-foreground">
                Depth of extraction
              </p>
              <p className="mt-2 text-[17px] text-earth">
                1.8–2.4 metres, below the topsoil horizon
              </p>
            </div>
          </div>
        </section>

        <section className="px-6 md:px-10 pt-14">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12">
            <PropertyTable title="Physical properties" rows={PHYSICAL} />
            <PropertyTable title="Chemical properties" rows={CHEMICAL} />
          </div>
        </section>

        <section className="px-6 md:px-10 pt-16">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-wrap justify-between gap-2 text-[13px]">
              <span className="tracking-[0.28em] uppercase text-muted-foreground">
                Particle size
              </span>
              <span className="text-muted-foreground">
                {PARTICLES.map((p) => `${p.label} ${p.pct}%`).join(" · ")}
              </span>
            </div>
            <div
              role="img"
              aria-label="Particle size: clay 58 percent, silt 34 percent, fine sand 8 percent"
              className="mt-3 flex h-11 overflow-hidden rounded-lg text-sm"
            >
              {PARTICLES.map((p) => (
                <div
                  key={p.label}
                  style={{ width: `${p.pct}%` }}
                  className={`flex items-center pl-3.5 whitespace-nowrap ${p.className}`}
                >
                  {p.pct >= 20 ? `${p.label} ${p.pct}%` : ""}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 md:px-10 pt-20">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-display font-normal text-[clamp(2.25rem,4vw,3.25rem)] text-earth">
              What the numbers <em className="font-light text-clay">mean in your kitchen</em>
            </h2>
            <div className="mt-9 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {MEANING.map((m) => (
                <div key={m.title} className="rounded-[1.25rem] border border-border bg-cream p-6">
                  <p className="font-display text-[2.1rem] leading-tight text-clay-deep">
                    {m.figure}
                  </p>
                  <h3 className="mt-1.5 mb-2 font-sans text-base font-medium text-earth">
                    {m.title}
                  </h3>
                  <p className="text-[15px] leading-relaxed text-muted-foreground">{m.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 md:px-10 pt-16">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center gap-8 rounded-[1.5rem] bg-kiln text-cream p-8 md:p-10">
            <div className="grid place-items-center w-[120px] h-[120px] shrink-0 rounded-full border border-gold text-center font-display text-[1.6rem] leading-none text-gold">
              <span>
                Food
                <br />
                <em>safe</em>
              </span>
            </div>
            <div className="flex-[1_1_380px]">
              <p className="font-display text-[clamp(1.6rem,2.6vw,2rem)] leading-snug">
                Heavy metals below detectable limits. No chemical glaze.
              </p>
              <p className="mt-2 text-[15px] text-cream/70">
                The full lab report is available on request.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href={requestReport()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center min-h-[50px] px-6 rounded-full bg-[#25D366] text-[#0f3d22] text-xs font-medium tracking-[0.14em] uppercase"
              >
                Request on WhatsApp
              </a>
              <a
                href={BROCHURE.href}
                download={BROCHURE.fileName}
                className="inline-flex items-center min-h-[50px] px-6 rounded-full border border-cream/30 text-cream text-xs tracking-[0.14em] uppercase hover:border-gold transition-colors"
              >
                Download catalogue
              </a>
            </div>
          </div>
        </section>

        <OrdersEnquiries />
      </main>

      <SiteFooter />
    </div>
  );
}
