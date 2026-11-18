import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/AuthShell";
import { safeNextPath } from "@/lib/safe-next";
import { getSession } from "@/server/auth-guard";

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
    return "That sign-in link has expired or was already used. Tap “Email me a sign-in link” to get a new one.";
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
    <AuthShell
      forCheckout={forCheckout}
      eyebrow={forCheckout ? "One quick step" : "Your account"}
      title={
        forCheckout ? (
          <>
            Almost <span className="italic">there</span>
          </>
        ) : (
          <>
            Welcome to <span className="italic">Mudkraft</span>
          </>
        )
      }
      intro={
        forCheckout
          ? "Sign in or create an account to place your order. It takes a few seconds, and we'll remember your address next time."
          : "Sign in to check out faster, follow your orders and leave a review."
      }
    >
      <SignInForm
        nextPath={nextPath}
        initialMode={mode === "signup" ? "signup" : "signin"}
        linkError={linkErrorMessage(error)}
        notice={reset === "1" ? "Password updated. Sign in with your new password." : null}
      />
    </AuthShell>
  );
}
