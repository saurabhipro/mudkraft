import type { Metadata } from "next";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getSession } from "@/server/auth-guard";
import { getSavedAddressForUser } from "@/server/store/orders";

import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = {
  title: "Checkout — Mudkraft",
  // Carries personal details and should never be indexed or shared.
  robots: { index: false, follow: false },
};

/**
 * Guests check out here too, so this page deliberately does not call
 * `requireUser` — and `src/proxy.ts` deliberately does not match `/checkout`.
 * A session, when there is one, only pre-fills the form.
 */
export default async function CheckoutPage() {
  const session = await getSession();

  // Guests deliberately get nothing back. There is no identifier we could match
  // them on that another person could not simply type.
  const saved = session ? await getSavedAddressForUser(session.user.id) : null;

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SiteHeader />

      <section className="max-w-5xl mx-auto px-6 md:px-10 pt-24 pb-6">
        <div className="text-xs tracking-[0.35em] uppercase text-clay">Checkout</div>
        <h1 className="font-display text-4xl md:text-5xl text-earth leading-[1.05] mt-3">
          Where should these <span className="italic">travel</span>?
        </h1>
        <p className="mt-4 max-w-xl text-foreground/80">
          {saved
            ? "We have filled this in from your last order. Change anything that has moved."
            : session
              ? "We have pre-filled what we know from your account. Change anything that isn't right."
              : "No account needed. We only ask for what we need to reach you and to get the parcel there."}
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-6 md:px-10 pb-24">
        <CheckoutForm
          signedIn={Boolean(session)}
          fromLastOrder={Boolean(saved)}
          defaults={{
            // The delivery name they last used beats the account name — an
            // account is often in one person's name and the parcel in another's.
            name: saved?.name || session?.user.name || "",
            // Always the account email for a signed-in customer; that is the one
            // they can actually receive things at.
            email: session?.user.email ?? "",
            phone: session?.user.phone || saved?.phone || "",
            line1: saved?.line1 ?? "",
            line2: saved?.line2 ?? "",
            city: saved?.city ?? "",
            state: saved?.state ?? "",
            postalCode: saved?.postalCode ?? "",
          }}
        />
      </section>

      <SiteFooter />
    </div>
  );
}
