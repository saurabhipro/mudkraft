"use client";

import { useMemo, useState } from "react";
import { z } from "zod";

import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ShareButton } from "@/components/ShareButton";
import { WHATSAPP_NUMBER } from "@/lib/whatsapp";

// Validation
const orderSchema = z.object({
  orderNumber: z
    .string()
    .trim()
    .min(3, "Order number is too short")
    .max(40, "Order number is too long")
    .regex(/^[A-Za-z0-9\-#_/ ]+$/, "Only letters, numbers and - # _ / are allowed"),
  email: z
    .string()
    .trim()
    .email("Enter a valid email")
    .max(255, "Email is too long"),
});

const awbSchema = z
  .string()
  .trim()
  .min(6, "AWB looks too short")
  .max(30, "AWB looks too long")
  .regex(/^[A-Za-z0-9]+$/, "AWB should be letters and numbers only");

type Courier = {
  id: string;
  name: string;
  url: (awb: string) => string;
  hint: string;
};

const COURIERS: Courier[] = [
  {
    id: "delhivery",
    name: "Delhivery",
    hint: "12–14 digit number",
    url: (awb) => `https://www.delhivery.com/track-v2/package/${encodeURIComponent(awb)}`,
  },
  {
    id: "dtdc",
    name: "DTDC",
    hint: "9-digit number",
    url: (awb) => `https://www.dtdc.in/tracking.asp?strCnno=${encodeURIComponent(awb)}`,
  },
  {
    id: "bluedart",
    name: "Blue Dart",
    hint: "11-digit number",
    url: (awb) =>
      `https://www.bluedart.com/tracking?trackFor=0&trackNo=${encodeURIComponent(awb)}`,
  },
  {
    id: "indiapost",
    name: "India Post",
    hint: "13-char, ends with IN",
    url: (awb) =>
      `https://www.indiapost.gov.in/_layouts/15/DOP.Portal.Tracking/TrackConsignment.aspx?ID=${encodeURIComponent(awb)}`,
  },
  {
    id: "shiprocket",
    name: "Shiprocket",
    hint: "Any Shiprocket AWB",
    url: (awb) => `https://shiprocket.co/tracking/${encodeURIComponent(awb)}`,
  },
];

const STAGES: { label: string; note: string }[] = [
  { label: "Order received", note: "We've got your details and are packing with care." },
  { label: "Handcrafted & inspected", note: "Each piece is checked for cracks before it leaves the studio." },
  { label: "Dispatched", note: "Cushioned, boxed, and handed to the courier — you'll receive an AWB." },
  { label: "Out for delivery", note: "Almost home. Please keep an eye on your phone." },
  { label: "Delivered", note: "Season your pot before first use — see the Care Guide." },
];

function whatsappTrack(orderNumber: string, email: string) {
  const text = [
    "Namaste Mudkraft 🙏",
    "I'd like to check my order status.",
    "",
    `Order #: ${orderNumber}`,
    `Email: ${email}`,
    "",
    "Please share the latest update. Dhanyavaad 🙏",
  ].join("\n");
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export function TrackPage() {
  // Order form
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [orderErrors, setOrderErrors] = useState<{ orderNumber?: string; email?: string }>({});
  const [orderSubmitted, setOrderSubmitted] = useState(false);

  // AWB form
  const [awb, setAwb] = useState("");
  const [courierId, setCourierId] = useState<string>(COURIERS[0].id);
  const [awbError, setAwbError] = useState<string | undefined>(undefined);

  const courier = useMemo(
    () => COURIERS.find((c) => c.id === courierId) ?? COURIERS[0],
    [courierId],
  );

  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = orderSchema.safeParse({ orderNumber, email });
    if (!parsed.success) {
      const errs: { orderNumber?: string; email?: string } = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as "orderNumber" | "email";
        if (!errs[key]) errs[key] = issue.message;
      }
      setOrderErrors(errs);
      setOrderSubmitted(false);
      return;
    }
    setOrderErrors({});
    setOrderSubmitted(true);
    window.open(whatsappTrack(parsed.data.orderNumber, parsed.data.email), "_blank", "noopener,noreferrer");
  };

  const handleAwbSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = awbSchema.safeParse(awb);
    if (!parsed.success) {
      setAwbError(parsed.error.issues[0]?.message ?? "Invalid AWB");
      return;
    }
    setAwbError(undefined);
    window.open(courier.url(parsed.data), "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SiteHeader />

      {/* Header */}
      <section className="max-w-4xl mx-auto px-6 md:px-10 pt-24 md:pt-28 pb-8">
        <div className="text-xs tracking-[0.35em] uppercase text-clay">Order Status</div>
        <div className="flex flex-wrap items-end justify-between gap-6 mt-3">
          <h1 className="font-display text-5xl md:text-6xl text-earth leading-[1.05]">
            Track your <span className="italic">clay</span>
          </h1>
          <ShareButton
            title="Track your Mudkraft order"
            text="Check the status of your handcrafted clay order."
            label="Share"
          />
        </div>
        <p className="mt-5 text-lg leading-relaxed text-foreground/80 max-w-2xl">
          Enter your order number and email and we&apos;ll pull up the latest status over WhatsApp. If
          you already have a courier AWB, jump straight to the courier&apos;s tracker below.
        </p>
      </section>

      {/* Two-column forms */}
      <section className="max-w-4xl mx-auto px-6 md:px-10 py-6 grid md:grid-cols-2 gap-6">
        {/* Order form */}
        <form
          onSubmit={handleOrderSubmit}
          className="rounded-3xl bg-cream/60 border border-earth/15 p-6 md:p-8"
          noValidate
        >
          <div className="text-xs tracking-[0.3em] uppercase text-clay">Option 1</div>
          <h2 className="font-display text-2xl text-earth mt-2">Look up by order</h2>

          <label className="block mt-6 text-xs tracking-widest uppercase text-earth/70" htmlFor="orderNumber">
            Order number
          </label>
          <input
            id="orderNumber"
            type="text"
            inputMode="text"
            autoComplete="off"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="MK-1024"
            maxLength={40}
            className="mt-2 w-full rounded-full border border-earth/25 bg-background px-5 py-3 text-earth placeholder:text-earth/40 focus:outline-none focus:ring-2 focus:ring-earth/40"
            aria-invalid={!!orderErrors.orderNumber}
            aria-describedby={orderErrors.orderNumber ? "orderNumber-error" : undefined}
          />
          {orderErrors.orderNumber && (
            <p id="orderNumber-error" className="mt-2 text-xs text-red-700">
              {orderErrors.orderNumber}
            </p>
          )}

          <label className="block mt-5 text-xs tracking-widest uppercase text-earth/70" htmlFor="email">
            Email used at checkout
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            maxLength={255}
            className="mt-2 w-full rounded-full border border-earth/25 bg-background px-5 py-3 text-earth placeholder:text-earth/40 focus:outline-none focus:ring-2 focus:ring-earth/40"
            aria-invalid={!!orderErrors.email}
            aria-describedby={orderErrors.email ? "email-error" : undefined}
          />
          {orderErrors.email && (
            <p id="email-error" className="mt-2 text-xs text-red-700">
              {orderErrors.email}
            </p>
          )}

          <button
            type="submit"
            className="mt-6 w-full inline-flex items-center justify-center gap-2 bg-earth text-cream px-6 py-3.5 rounded-full text-xs tracking-widest uppercase hover:bg-clay transition-colors"
          >
            Check status on WhatsApp
          </button>

          {orderSubmitted && (
            <p className="mt-4 text-sm text-earth/80">
              Opened WhatsApp with your order details — our studio usually replies within a few
              hours during working days.
            </p>
          )}
        </form>

        {/* AWB form */}
        <form
          onSubmit={handleAwbSubmit}
          className="rounded-3xl bg-earth text-cream p-6 md:p-8"
          noValidate
        >
          <div className="text-xs tracking-[0.3em] uppercase text-gold">Option 2</div>
          <h2 className="font-display text-2xl text-cream mt-2">Track with courier AWB</h2>

          <label className="block mt-6 text-xs tracking-widest uppercase text-gold/80" htmlFor="courier">
            Courier
          </label>
          <select
            id="courier"
            value={courierId}
            onChange={(e) => setCourierId(e.target.value)}
            className="mt-2 w-full rounded-full border border-cream/20 bg-cream text-earth px-5 py-3 focus:outline-none focus:ring-2 focus:ring-gold/60"
          >
            {COURIERS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <label className="block mt-5 text-xs tracking-widest uppercase text-gold/80" htmlFor="awb">
            AWB / Tracking number
          </label>
          <input
            id="awb"
            type="text"
            inputMode="text"
            autoComplete="off"
            value={awb}
            onChange={(e) => setAwb(e.target.value)}
            placeholder={courier.hint}
            maxLength={30}
            className="mt-2 w-full rounded-full border border-cream/20 bg-cream text-earth placeholder:text-earth/40 px-5 py-3 focus:outline-none focus:ring-2 focus:ring-gold/60"
            aria-invalid={!!awbError}
            aria-describedby={awbError ? "awb-error" : undefined}
          />
          {awbError && (
            <p id="awb-error" className="mt-2 text-xs text-[hsl(15,80%,80%)]">
              {awbError}
            </p>
          )}
          <p className="mt-2 text-xs text-cream/60">Tip: {courier.hint}</p>

          <button
            type="submit"
            className="mt-6 w-full inline-flex items-center justify-center gap-2 bg-gold text-earth px-6 py-3.5 rounded-full text-xs tracking-widest uppercase hover:bg-cream transition-colors"
          >
            Open courier tracker →
          </button>
        </form>
      </section>

      {/* Stages */}
      <section className="max-w-4xl mx-auto px-6 md:px-10 py-12">
        <h2 className="font-display text-3xl text-earth mb-8">
          The journey of your <span className="italic">pot</span>
        </h2>
        <ol className="relative border-l border-earth/20 ml-4 space-y-8">
          {STAGES.map((s, i) => (
            <li key={s.label} className="pl-8 relative">
              <span className="absolute -left-[13px] top-1 w-6 h-6 rounded-full bg-earth text-cream text-[11px] font-medium flex items-center justify-center">
                {i + 1}
              </span>
              <div className="font-display text-xl text-earth">{s.label}</div>
              <div className="mt-1 text-foreground/75">{s.note}</div>
            </li>
          ))}
        </ol>
      </section>

      {/* Help */}
      <section className="max-w-4xl mx-auto px-6 md:px-10 py-10 mb-8">
        <div className="rounded-3xl border border-earth/15 bg-cream/60 p-6 md:p-8 text-earth">
          <div className="text-xs tracking-[0.3em] uppercase text-clay">Need help?</div>
          <p className="mt-3 text-foreground/85 leading-relaxed">
            Can&apos;t find your order number, or something feels off? Message the studio directly and
            we&apos;ll sort it out.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Namaste Mudkraft, I need help with my order.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-earth text-cream px-5 py-3 rounded-full text-xs tracking-widest uppercase hover:bg-clay transition-colors"
            >
              Chat on WhatsApp
            </a>
            <a
              href="/shipping-returns"
              className="inline-flex items-center gap-2 border border-earth/30 text-earth px-5 py-3 rounded-full text-xs tracking-widest uppercase hover:bg-earth hover:text-cream transition-colors"
            >
              Shipping & Returns
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
