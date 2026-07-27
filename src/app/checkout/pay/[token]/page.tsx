import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { formatPaise } from "@/lib/money";
import { getOrderByToken } from "@/server/store/orders";

import { MockGateway } from "./mock-gateway";

export const metadata: Metadata = {
  title: "Payment — Mudkraft",
  robots: { index: false, follow: false },
};

/**
 * Stand-in for a hosted payment page.
 *
 * Shaped like the real thing on purpose — the customer leaves checkout, lands on
 * a payment screen, and is returned to a confirmation URL — so replacing it with
 * Razorpay or PayU later is a swap rather than a redesign.
 */
export default async function MockPaymentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const order = await getOrderByToken(token);

  if (!order) notFound();

  // Anything already settled, or never destined for this gateway, belongs on the
  // confirmation page instead.
  if (order.paymentProvider !== "mock" || order.paymentStatus === "paid") {
    redirect(`/checkout/done/${token}`);
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SiteHeader />

      <section className="max-w-lg mx-auto px-6 md:px-10 pt-24 pb-24">
        <div
          role="note"
          className="rounded-2xl border border-amber-400/60 bg-amber-50 px-5 py-4 text-sm text-amber-900"
        >
          <strong className="font-medium">Test gateway.</strong> No card is taken and no money
          moves. This screen stands in for a real payment provider until one is chosen.
        </div>

        <div className="mt-8 rounded-3xl border border-earth/15 bg-cream/50 p-6 md:p-8">
          <div className="text-xs tracking-[0.35em] uppercase text-clay">Payment</div>
          <h1 className="mt-3 font-display text-3xl text-earth">{order.orderNumber}</h1>

          <dl className="mt-6 space-y-3 border-t border-earth/15 pt-5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Paying for</dt>
              <dd className="text-right text-earth">
                {order.items.length} {order.items.length === 1 ? "piece" : "pieces"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Delivering to</dt>
              <dd className="text-right text-earth">
                {order.shippingCity}, {order.shippingPostalCode}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 border-t border-earth/15 pt-4">
              <dt className="text-xs tracking-[0.3em] uppercase text-muted-foreground">Amount</dt>
              <dd className="font-display text-3xl text-earth">{formatPaise(order.totalPaise)}</dd>
            </div>
          </dl>

          <MockGateway token={token} />
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
          Your order is already saved. If you close this page, it stays awaiting payment and we
          will reach you on WhatsApp.
        </p>
      </section>

      <SiteFooter />
    </div>
  );
}
