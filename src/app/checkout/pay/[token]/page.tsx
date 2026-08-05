import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { formatPaise } from "@/lib/money";
import { getOrderByToken } from "@/server/store/orders";

import { RazorpayGateway } from "./razorpay-gateway";

export const metadata: Metadata = {
  title: "Payment — Mudkraft",
  robots: { index: false, follow: false },
};

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const order = await getOrderByToken(token);

  if (!order) notFound();

  // Anything already settled, or never destined for this gateway, belongs on the
  // confirmation page instead.
  if (order.paymentProvider !== "razorpay" || order.paymentStatus === "paid") {
    redirect(`/checkout/done/${token}`);
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SiteHeader />

      <section className="max-w-lg mx-auto px-6 md:px-10 pt-24 pb-24">
        <div className="rounded-3xl border border-earth/15 bg-cream/50 p-6 md:p-8">
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

          <RazorpayGateway token={token} />
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
