import type { Metadata } from "next";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { requireUser } from "@/server/auth-guard";
import { getSavedAddressForUser } from "@/server/store/orders";

import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = {
  title: "Checkout — Mudkraft",
  // Carries personal details and should never be indexed or shared.
  robots: { index: false, follow: false },
};

/**
 * Sign-in is required to check out. Signed-out visitors go to /sign-in and
 * come straight back; the basket is in localStorage, so it survives the trip
 * (Google redirect and magic link included). `placeOrder` checks again.
 */
export default async function CheckoutPage() {
  const session = await requireUser("/checkout");
  const saved = await getSavedAddressForUser(session.user.id);
  const firstName = session.user.name.trim().split(/\s+/)[0] || "there";

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SiteHeader />

      <section className="max-w-5xl mx-auto px-6 md:px-10 pt-24 pb-6">
        <div className="text-xs tracking-[0.35em] uppercase text-clay">Checkout</div>
        <h1 className="font-display text-4xl md:text-5xl text-earth leading-[1.05] mt-3">
          Hello, <span className="italic">{firstName}</span>
        </h1>
        <p className="mt-4 max-w-xl text-foreground/80">
          {saved
            ? "Good to see you again. We've filled in your saved address — change anything that has moved."
            : "Where should these travel? Add your delivery address once and we'll remember it for next time."}
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-6 md:px-10 pb-24">
        <CheckoutForm
          fromLastOrder={Boolean(saved)}
          defaults={{
            // The delivery name they last used beats the account name — an
            // account is often in one person's name and the parcel in another's.
            name: saved?.name || session.user.name || "",
            // Always the account email; that is the one they can actually receive things at.
            email: session.user.email,
            phone: saved?.phone || session.user.phone || "",
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
