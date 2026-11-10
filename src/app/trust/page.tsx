import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { OG_IMAGE } from "@/lib/seo";

const TITLE = "Trust & Privacy — Mudkraft";

export const metadata: Metadata = {
  title: TITLE,
  description:
    "How Mudkraft handles your data, orders, payments, and privacy. Maintained by the Mudkraft studio team.",
  openGraph: {
    siteName: "Mudkraft",
    title: TITLE,
    description: "How Mudkraft handles your data, orders, payments, and privacy.",
    type: "website",
    images: [OG_IMAGE],
  },
  twitter: { card: "summary_large_image", images: [OG_IMAGE] },
};

type Section = { label: string; heading: string; body: ReactNode };

const SECTIONS: Section[] = [
  {
    label: "Ownership",
    heading: "Who runs this site",
    body: (
      <p>
        This page is maintained by the Mudkraft studio team in Khurja, India, to answer common
        questions about how we handle your data and orders. It describes our current practices —
        it is not a third-party certification.
      </p>
    ),
  },
  {
    label: "Data you share",
    heading: "What we collect",
    body: (
      <>
        <p>When you place an order, we receive your name, mobile number, email, delivery address
        and the pieces you chose. When you join our welcome offer or send an enquiry, we receive
        the name, number and email you enter. We use these to prepare, ship and support your
        order, and to answer you.</p>
        <p className="mt-3">Your order and contact details are kept in our order-management system
        (Bikriup), which runs on servers in India.</p>
      </>
    ),
  },
  {
    label: "Payments",
    heading: "How payment works",
    body: (
      <p>
        Online payments (UPI, card, net banking) are processed by Razorpay on their own secure
        systems. We never see or store your card or bank details. Cash on delivery is collected by
        our courier.
      </p>
    ),
  },
  {
    label: "WhatsApp",
    heading: "Messages on WhatsApp",
    body: (
      <>
        <p>We send order updates to the mobile number on your order through WhatsApp (Meta&apos;s
        WhatsApp Business Platform): order received, payment, confirmed with your invoice,
        packed, shipped with tracking, out for delivery, delivered, and any cancellation, return
        or refund. If you message us, we use that conversation only to help you.</p>
        <p className="mt-3">Offers are sent only if you tick the box to receive them, and you can
        stop them at any time by replying STOP or asking us.</p>
      </>
    ),
  },
  {
    label: "Cookies",
    heading: "Cookies & analytics",
    body: (
      <p>
        We remember your cart in your browser. We use Google Analytics and the Meta Pixel to
        understand which pages and products are useful and, when we advertise, which adverts lead
        to orders. These use cookies; you can block them in your browser settings and the shop
        still works.
      </p>
    ),
  },
  {
    label: "Sharing",
    heading: "Who we share data with",
    body: (
      <p>
        Only the services that make an order work: our courier (to deliver it), Razorpay (to take
        payment), Meta&apos;s WhatsApp and our email provider (to send you updates), and Google and
        Meta for the analytics above. We do not sell or rent your contact information to anyone.
      </p>
    ),
  },
  {
    label: "Retention",
    heading: "How long we keep it",
    body: (
      <p>
        We keep order records for as long as needed to service your order, handle replacements,
        and meet standard bookkeeping requirements in India. You can ask us to delete your
        contact record at any time — see below.
      </p>
    ),
  },
  {
    label: "Your rights",
    heading: "Access, correct, or delete",
    body: (
      <p>
        Message us on WhatsApp at +91 70420 05946 or email{" "}
        <a href="mailto:sales@mudkraft.com" className="underline decoration-clay/50 hover:text-clay">
          sales@mudkraft.com
        </a>{" "}
        to see, correct, or delete the information we hold about you. We reply within a few days.
      </p>
    ),
  },
  {
    label: "Craft integrity",
    heading: "About the pieces themselves",
    body: (
      <p>
        Every Mudkraft vessel is thrown by hand from river clay, sun-dried, and fired in a wood
        kiln with no chemical glaze. Because each piece is made one at a time, minor variation in
        shape, tone, and finish is part of the craft — not a defect. If a piece arrives
        broken, we replace it or refund you in full; share an unboxing photo or video within 48 hours of delivery.
      </p>
    ),
  },
  {
    label: "Contact",
    heading: "Reach a human",
    body: (
      <p>
        For anything security-, privacy-, or order-related, message{" "}
        <a href="mailto:sales@mudkraft.com" className="underline decoration-clay/50 hover:text-clay">
          sales@mudkraft.com
        </a>{" "}
        or WhatsApp <span className="whitespace-nowrap">+91 70420 05946</span>. A person from the
        studio will respond.
      </p>
    ),
  },
];

export default function TrustPage() {
  return (
    <div className="min-h-screen bg-cream text-earth">
      <SiteHeader />

      <section className="pt-32 md:pt-40 pb-16 px-6 md:px-10 max-w-4xl mx-auto">
        <div className="text-xs tracking-[0.4em] uppercase text-clay mb-6">Trust & Privacy</div>
        <h1 className="font-display text-5xl md:text-7xl leading-[0.95] tracking-tight">
          Small studio,<br />
          <span className="italic font-light">clear promises.</span>
        </h1>
        <p className="mt-6 text-lg text-earth/70 max-w-2xl">
          We&apos;re a family workshop, not a marketing machine. Here is exactly what happens with
          your details, your order, and your money when you buy from Mudkraft.
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

        <p className="pt-6 text-xs text-earth/50">
          Last updated {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long" })}.
          We update this page whenever our practices change.
        </p>
      </section>

      <SiteFooter />
    </div>
  );
}
