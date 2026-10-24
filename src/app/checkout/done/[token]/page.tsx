import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { cloudinaryThumb } from "@/lib/cloudinary";
import { formatPaise } from "@/lib/money";
import { whatsappLink } from "@/lib/whatsapp";
import { getOrderByToken } from "@/server/store/orders";

export const metadata: Metadata = {
  title: "Order placed — Mudkraft",
  robots: { index: false, follow: false },
};

export default async function OrderPlacedPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const order = await getOrderByToken(token);

  if (!order) notFound();

  const paid = order.paymentStatus === "paid";
  const viaWhatsApp = order.paymentProvider === "whatsapp";
  const viaCod = order.paymentProvider === "cod";

  const whatsappHref = whatsappLink([
    "Namaste Mudkraft 🙏",
    `I have just placed order ${order.orderNumber}.`,
    `Total: ${formatPaise(order.totalPaise)}`,
    "",
    "Please share payment and dispatch details. Dhanyavaad 🙏",
  ]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SiteHeader />

      <section className="max-w-3xl mx-auto px-6 md:px-10 pt-24 pb-8">
        <div className="text-xs tracking-[0.35em] uppercase text-clay">
          {paid ? "Payment received" : "Order placed"}
        </div>
        <h1 className="mt-3 font-display text-4xl md:text-5xl text-earth leading-[1.05]">
          Thank you, <span className="italic">{order.shippingName.split(" ")[0]}</span>.
        </h1>
        <p className="mt-4 max-w-xl text-foreground/80">
          {paid
            ? "Your order is confirmed. We will start packing, and you will hear from us on WhatsApp when it is dispatched."
            : viaCod
              ? `Your order is confirmed — pay ${formatPaise(order.totalPaise)} in cash when it arrives. We will reach you on WhatsApp before dispatch.`
              : viaWhatsApp
                ? "Your order is saved. Send us a message and we will confirm the pieces, share payment details and dispatch."
                : "Your order is saved but not yet paid. You can pay whenever you are ready — nothing is dispatched until then."}
        </p>

        <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-earth/20 bg-cream/60 px-5 py-2.5">
          <span className="text-xs tracking-[0.3em] uppercase text-muted-foreground">Order</span>
          <span className="font-display text-xl text-earth">{order.orderNumber}</span>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 md:px-10 pb-24">
        <div className="rounded-3xl border border-earth/15 bg-cream/50 p-6 md:p-8">
          <ul className="space-y-4">
            {order.items.map((item) => (
              <li key={item.productSlug} className="flex gap-4">
                {item.imagePublicId ? (
                  <img
                    src={cloudinaryThumb(item.imagePublicId, 96)}
                    alt=""
                    aria-hidden="true"
                    className="h-20 w-16 shrink-0 rounded-lg bg-background object-contain p-1"
                  />
                ) : (
                  <div className="h-20 w-16 shrink-0 rounded-lg bg-earth/5" aria-hidden="true" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-display text-lg text-earth">{item.productName}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatPaise(item.unitPricePaise)} × {item.qty}
                  </div>
                </div>
                <div className="text-sm text-earth">{formatPaise(item.lineTotalPaise)}</div>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-baseline justify-between border-t border-earth/15 pt-5">
            <span className="text-xs tracking-[0.3em] uppercase text-muted-foreground">Total</span>
            <span className="font-display text-3xl text-earth">
              {formatPaise(order.totalPaise)}
            </span>
          </div>
          <p className="mt-1 text-right text-[11px] text-muted-foreground">Shipping included</p>

          <div className="mt-8 grid gap-6 border-t border-earth/15 pt-6 sm:grid-cols-2">
            <div>
              <h2 className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground">
                Delivering to
              </h2>
              <address className="mt-2 text-sm not-italic leading-relaxed text-earth">
                {order.shippingName}
                <br />
                {order.shippingLine1}
                <br />
                {order.shippingLine2 && (
                  <>
                    {order.shippingLine2}
                    <br />
                  </>
                )}
                {order.shippingCity}, {order.shippingState} {order.shippingPostalCode}
              </address>
            </div>
            <div>
              <h2 className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground">
                We will reach you at
              </h2>
              <div className="mt-2 text-sm leading-relaxed text-earth">
                {order.contactPhone}
                <br />
                {order.contactEmail}
              </div>
            </div>
          </div>

          {order.customerNote && (
            <div className="mt-6 border-t border-earth/15 pt-6">
              <h2 className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground">
                Your note
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-foreground/85">
                {order.customerNote}
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          {!paid && !viaWhatsApp && !viaCod && (
            <Link
              href={`/checkout/pay/${order.lookupToken}`}
              className="flex-1 inline-flex items-center justify-center bg-earth text-cream px-6 py-4 rounded-full text-xs tracking-widest uppercase hover:bg-clay transition-colors"
            >
              Pay now
            </Link>
          )}
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex-1 inline-flex items-center justify-center px-6 py-4 rounded-full text-xs tracking-widest uppercase transition-colors ${
              viaWhatsApp && !paid
                ? "bg-earth text-cream hover:bg-clay"
                : "border border-earth/25 bg-background text-earth hover:bg-earth hover:text-cream"
            }`}
          >
            {viaWhatsApp && !paid ? "Message us on WhatsApp" : "Questions? Message us"}
          </a>
        </div>

        {/* The confirmation email is best-effort (sendEmail never throws), so
            the bookmark advice stays — this page must remain reachable even
            when the email never arrived. */}
        <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
          We&apos;ve sent a confirmation with a link back to this order to {order.contactEmail}. If
          it doesn&apos;t arrive, keep this page bookmarked — the link in your address bar also
          brings you back here.
        </p>
      </section>

      <SiteFooter />
    </div>
  );
}
