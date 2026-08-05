import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getDeliveryVerificationByToken } from "@/server/store/orders";

import { VerifyForm } from "./verify-form";

export const metadata: Metadata = {
  title: "Verify your delivery — Mudkraft",
  robots: { index: false, follow: false },
};

/**
 * Landing page for the QR pasted on the parcel. One-time by design: once
 * verified, every later scan lands on the "already verified" state and the
 * OTP form is never rendered again.
 */
export default async function VerifyDeliveryPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const verification = await getDeliveryVerificationByToken(token);

  if (!verification) notFound();

  const verified = verification.state === "verified";

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SiteHeader />

      <section className="max-w-lg mx-auto px-6 md:px-10 pt-24 pb-24">
        <div className="text-xs tracking-[0.35em] uppercase text-clay">
          {verified ? "Delivery verified" : "Delivery verification"}
        </div>
        <h1 className="mt-3 font-display text-4xl text-earth leading-[1.05]">
          {verified ? "All done." : <>Namaste, <span className="italic">{verification.customerFirstName}</span>.</>}
        </h1>

        {verified ? (
          <div className="mt-6 rounded-3xl border border-earth/15 bg-cream/50 p-6 md:p-8">
            <p className="leading-relaxed text-foreground/85">
              Order <strong className="text-earth">{verification.orderNumber}</strong> was already
              verified
              {verification.verifiedAt && (
                <> on {verification.verifiedAt.toLocaleDateString("en-IN", { dateStyle: "long" })}</>
              )}
              . This code works only once — nothing more to do here.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              We hope the piece has found a good spot in your home. If anything arrived less than
              perfect, message us on WhatsApp and we will make it right.
            </p>
            <Link
              href="/#collection"
              className="mt-6 inline-flex items-center justify-center bg-earth text-cream px-6 py-3.5 rounded-full text-xs tracking-widest uppercase hover:bg-clay transition-colors"
            >
              Browse the collection
            </Link>
          </div>
        ) : (
          <div className="mt-6 rounded-3xl border border-earth/15 bg-cream/50 p-6 md:p-8">
            <p className="leading-relaxed text-foreground/85">
              Your order <strong className="text-earth">{verification.orderNumber}</strong> has
              arrived. To confirm it reached the right hands, we will text a 6-digit code to the
              number this order was placed with:
            </p>
            <p className="mt-3 font-display text-2xl text-earth">
              {verification.maskedPhone ?? "no number on record"}
            </p>

            {verification.maskedPhone ? (
              <VerifyForm token={token} />
            ) : (
              <p className="mt-6 text-sm text-muted-foreground">
                There is no phone number on record for this order — please message us on WhatsApp
                to confirm your delivery.
              </p>
            )}
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}
