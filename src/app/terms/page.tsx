import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SALES_EMAIL, SALES_PHONE_DISPLAY } from "@/lib/catalogue";
import { OG_IMAGE, SITE_URL } from "@/lib/seo";

const URL = `${SITE_URL}/terms`;
const TITLE = "Terms & Conditions — Mudkraft";
const DESCRIPTION =
  "The terms for buying from Mudkraft: orders, prices, payment, delivery, handmade variation, returns, care and workshops.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    url: URL,
    images: [OG_IMAGE],
  },
  twitter: { card: "summary_large_image", images: [OG_IMAGE] },
};

const linkCls = "underline decoration-clay/50 hover:text-clay";

// Each section restates what the rest of the site already promises, and points
// to the page that holds the detail, so the two can never disagree.
type Section = { label: string; heading: string; body: ReactNode };
const SECTIONS: Section[] = [
  {
    label: "About",
    heading: "Who you are buying from",
    body: (
      <p>
        This website is run by Mudkraft, a slow craft studio in Khurja, Uttar Pradesh, India. By
        placing an order or booking a workshop with us, you agree to these terms.
      </p>
    ),
  },
  {
    label: "Orders",
    heading: "How an order is placed",
    body: (
      <p>
        An order is confirmed only when we accept it, either on WhatsApp or by the confirmation
        after online checkout. We may decline or cancel an order, for example when a piece is out of
        stock or a pincode is outside our delivery area, and will refund anything already paid.
      </p>
    ),
  },
  {
    label: "Prices",
    heading: "Prices and payment",
    body: (
      <>
        <p>
          Prices on this website are in Indian rupees and include taxes and delivery, unless a page
          says otherwise. The price that applies is the one shown when your order is confirmed.
        </p>
        <p>
          Payments are handled by our payment provider on their own secure systems. We never see or
          store your card or bank details. See{" "}
          <Link href="/trust" className={linkCls}>
            Trust &amp; Privacy
          </Link>
          .
        </p>
      </>
    ),
  },
  {
    label: "Handmade",
    heading: "Every piece is a little different",
    body: (
      <p>
        Each piece is thrown by hand from unglazed river clay and fired in a wood kiln. Small
        differences in size, colour and surface from the photographs are part of the craft and are
        not defects.
      </p>
    ),
  },
  {
    label: "Delivery",
    heading: "Shipping, breakage and returns",
    body: (
      <p>
        Dispatch times, delivery charges, what to do if a piece arrives broken, and which pieces can
        be returned are set out in our{" "}
        <Link href="/shipping-returns" className={linkCls}>
          Shipping &amp; Returns policy
        </Link>
        , which forms part of these terms.
      </p>
    ),
  },
  {
    label: "Use & care",
    heading: "Using clay cookware safely",
    body: (
      <p>
        Clay cookware must be seasoned before first use and heated gradually. It does not work on
        induction. Please follow our{" "}
        <Link href="/care/season-your-handi" className={linkCls}>
          Care Guide
        </Link>
        . We are not responsible for cracks caused by sudden heat changes, dropping, or use against
        that guidance.
      </p>
    ),
  },
  {
    label: "Workshops",
    heading: "Workshop bookings",
    body: (
      <p>
        Workshop dates, prices and group sizes are confirmed with you on WhatsApp or email before a
        booking is final. Pieces made in a workshop are non-returnable. See{" "}
        <Link href="/workshops" className={linkCls}>
          Workshops
        </Link>
        .
      </p>
    ),
  },
  {
    label: "Content",
    heading: "Photographs and text",
    body: (
      <p>
        The photographs, text, catalogue and logo on this website belong to Mudkraft. Please ask
        before reusing them.
      </p>
    ),
  },
  {
    label: "Contact",
    heading: "Questions",
    body: (
      <p>
        Write to{" "}
        <a href={`mailto:${SALES_EMAIL}`} className={linkCls}>
          {SALES_EMAIL}
        </a>{" "}
        or call / WhatsApp {SALES_PHONE_DISPLAY}. These terms are governed by the laws of India.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-cream text-earth">
      <SiteHeader />

      <section className="pt-32 md:pt-40 pb-16 px-6 md:px-10 max-w-4xl mx-auto">
        <div className="text-xs tracking-[0.4em] uppercase text-clay mb-6">
          Terms &amp; Conditions
        </div>
        <h1 className="font-display text-5xl md:text-7xl leading-[0.95] tracking-tight">
          The fine print,
          <br />
          <span className="italic font-light">kept plain.</span>
        </h1>
        <p className="mt-6 text-lg text-earth/70 max-w-2xl">
          What you can expect from us when you order a piece or book a workshop, and what we ask of
          you in return.
        </p>
      </section>

      <section className="px-6 md:px-10 max-w-4xl mx-auto pb-24 space-y-14">
        {SECTIONS.map((s, i) => (
          <article
            key={s.label}
            className="grid md:grid-cols-[10rem_1fr] gap-4 md:gap-10 border-t border-earth/15 pt-10"
          >
            <div>
              <div className="text-xs tracking-widest text-clay font-sans">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className="mt-2 text-xs uppercase tracking-[0.28em] text-earth/60">
                {s.label}
              </div>
            </div>
            <div>
              <h2 className="font-display text-3xl md:text-4xl text-earth leading-tight">
                {s.heading}
              </h2>
              <div className="mt-4 text-earth/75 leading-relaxed space-y-3">{s.body}</div>
            </div>
          </article>
        ))}
      </section>

      <SiteFooter />
    </div>
  );
}
