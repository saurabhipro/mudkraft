import type { Metadata } from "next";

import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ShareButton } from "@/components/ShareButton";
import { OG_IMAGE } from "@/lib/seo";

const TITLE = "Shipping & Returns — Mudkraft";

export const metadata: Metadata = {
  title: TITLE,
  description:
    "How Mudkraft packs, ships, and stands behind every hand-thrown clay piece — timelines, charges, breakage policy, and returns.",
  openGraph: {
    title: TITLE,
    description:
      "Timelines, charges, breakage-in-transit policy, and returns for our hand-thrown clay pieces.",
    type: "website",
    images: [OG_IMAGE],
  },
  twitter: { card: "summary_large_image", images: [OG_IMAGE] },
};

const SHIP_ZONES: { zone: string; days: string; charge: string }[] = [
  { zone: "Delhi NCR", days: "2–4 working days", charge: "Free above ₹1,499" },
  { zone: "North India", days: "3–6 working days", charge: "₹120 flat" },
  { zone: "Rest of India", days: "5–9 working days", charge: "₹180 flat" },
  { zone: "International", days: "10–21 working days", charge: "Quoted on WhatsApp" },
];

export default function ShippingReturnsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SiteHeader />

      <section className="max-w-4xl mx-auto px-6 md:px-10 pt-24 md:pt-28 pb-8">
        <div className="text-xs tracking-[0.35em] uppercase text-clay">Studio Policy</div>
        <div className="flex flex-wrap items-end justify-between gap-6 mt-3">
          <h1 className="font-display text-5xl md:text-6xl text-earth leading-[1.05]">
            Shipping &amp; <span className="italic">Returns</span>
          </h1>
          <ShareButton title="Shipping & Returns — Mudkraft" text="How Mudkraft ships and stands behind every piece." />
        </div>
        <p className="mt-5 text-lg leading-relaxed text-foreground/80 max-w-2xl">
          Every piece is hand-thrown, sun-dried, and wood-fired in Khurja. We pack each vessel in
          cushioned recycled paper and a double-walled carton so it reaches you the way it left the
          studio.
        </p>
      </section>

      <section className="max-w-4xl mx-auto px-6 md:px-10 py-8">
        <h2 className="font-display text-3xl text-earth mb-6">Dispatch</h2>
        <ul className="space-y-3 text-foreground/85">
          <li className="flex gap-3"><span className="text-clay mt-1">◦</span> Orders leave the studio within <b>2–3 working days</b> of confirmation.</li>
          <li className="flex gap-3"><span className="text-clay mt-1">◦</span> A WhatsApp update is shared with the tracking link the moment your parcel is picked up.</li>
          <li className="flex gap-3"><span className="text-clay mt-1">◦</span> Larger cookware sets may be split into two boxes for safer transit.</li>
        </ul>
      </section>

      <section className="max-w-4xl mx-auto px-6 md:px-10 py-8">
        <h2 className="font-display text-3xl text-earth mb-6">Timelines &amp; Charges</h2>
        <div className="overflow-x-auto rounded-2xl border border-earth/15">
          <table className="w-full min-w-[34rem] text-sm">
            <thead className="bg-earth text-cream">
              <tr>
                <th className="text-left px-3 sm:px-4 py-3 font-medium tracking-widest uppercase text-xs">Zone</th>
                <th className="text-left px-3 sm:px-4 py-3 font-medium tracking-widest uppercase text-xs">Delivery</th>
                <th className="text-left px-3 sm:px-4 py-3 font-medium tracking-widest uppercase text-xs">Charge</th>
              </tr>
            </thead>
            <tbody>
              {SHIP_ZONES.map((z, i) => (
                <tr key={z.zone} className={i % 2 === 0 ? "bg-cream/60" : "bg-cream/30"}>
                  <td className="px-3 sm:px-4 py-3 text-earth font-medium">{z.zone}</td>
                  <td className="px-3 sm:px-4 py-3 text-foreground/80">{z.days}</td>
                  <td className="px-3 sm:px-4 py-3 text-foreground/80">{z.charge}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 md:px-10 py-8">
        <h2 className="font-display text-3xl text-earth mb-6">Breakage in Transit</h2>
        <p className="text-foreground/85 leading-relaxed">
          Clay is fragile by nature — we take breakage seriously. If a piece arrives cracked or
          broken, share an <b>unboxing photo/video within 48 hours</b> on WhatsApp and we will send
          a free replacement or a full refund. No forms, no questions.
        </p>
      </section>

      <section className="max-w-4xl mx-auto px-6 md:px-10 py-8">
        <h2 className="font-display text-3xl text-earth mb-6">Returns &amp; Refunds</h2>
        <ul className="space-y-3 text-foreground/85">
          <li className="flex gap-3"><span className="text-clay mt-1">◦</span> <b>7-day return window</b> from delivery for unused pieces in their original packaging.</li>
          <li className="flex gap-3"><span className="text-clay mt-1">◦</span> Reverse pickup is arranged where our courier serves; otherwise self-ship with a shared address.</li>
          <li className="flex gap-3"><span className="text-clay mt-1">◦</span> Refunds are processed within <b>5 working days</b> of the piece reaching the studio.</li>
          <li className="flex gap-3"><span className="text-clay mt-1">◦</span> Custom, engraved, or workshop-order pieces are non-returnable.</li>
        </ul>
      </section>

      <section className="max-w-4xl mx-auto px-6 md:px-10 py-8">
        <h2 className="font-display text-3xl text-earth mb-6">The Human Touch</h2>
        <p className="text-foreground/85 leading-relaxed">
          Each pot is thrown by hand, so small variations in colour, fire-marks, and shape are part
          of the piece — not defects. We photograph honestly and pack with love. If anything feels
          off when you unbox, message us — we&apos;d rather make it right than sell you a
          &ldquo;perfect&rdquo; pot.
        </p>
      </section>

      <div className="max-w-4xl mx-auto px-6 md:px-10 pt-4 pb-12">
        <ShareButton
          title="Shipping & Returns — Mudkraft"
          text="How Mudkraft ships and stands behind every piece."
          label="Share this page"
        />
      </div>

      <SiteFooter />
    </div>
  );
}
