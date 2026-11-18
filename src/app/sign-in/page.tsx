import type { Metadata } from "next";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { safeNextPath } from "@/lib/safe-next";
import { getSession } from "@/server/auth-guard";
import { redirect } from "next/navigation";

import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = {
  title: "Sign in — Mudkraft",
  // A login page has no business in search results.
  robots: { index: false, follow: false },
};

/** Better Auth sends `?error=` back here when a magic link is used twice or has expired. */
function linkErrorMessage(error: string | undefined): string | null {
  if (!error) return null;
  if (/EXPIRED|INVALID|TOKEN/i.test(error))
    return "That sign-in link has expired or was already used. Request a new one below.";
  return "We could not sign you in with that link. Please try again.";
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; mode?: string; error?: string; reset?: string }>;
}) {
  const { next, mode, error, reset } = await searchParams;
  const nextPath = safeNextPath(next);
  const forCheckout = nextPath.startsWith("/checkout");

  const session = await getSession();
  if (session) redirect(nextPath);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SiteHeader />

      <section className="max-w-md mx-auto px-6 md:px-10 pt-24 pb-8">
        <div className="text-xs tracking-[0.35em] uppercase text-clay">Your account</div>
        <h1 className="font-display text-4xl md:text-5xl text-earth leading-[1.05] mt-3">
          {forCheckout ? (
            <>
              Almost <span className="italic">there</span>
            </>
          ) : (
            <>
              Welcome <span className="italic">back</span>
            </>
          )}
        </h1>
        <p className="mt-4 text-foreground/80">
          {forCheckout
            ? "Sign in or create an account to check out. Your basket is saved, and we'll remember your address for next time."
            : "Sign in to check out faster, see your orders and leave a review."}
        </p>
      </section>

      <section className="max-w-md mx-auto px-6 md:px-10 pb-20">
        <SignInForm
          nextPath={nextPath}
          initialMode={mode === "signup" ? "signup" : "signin"}
          linkError={linkErrorMessage(error)}
          notice={reset === "1" ? "Password updated. Sign in with your new password." : null}
        />
      </section>

      <SiteFooter />
    </div>
  );
}
