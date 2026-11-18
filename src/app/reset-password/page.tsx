import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { safeNextPath } from "@/lib/safe-next";

import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: "Choose a new password — Mudkraft",
  robots: { index: false, follow: false },
};

/**
 * The email link goes to /api/auth/reset-password/:token, which checks the
 * token and redirects here with `?token=` (valid) or `?error=INVALID_TOKEN`.
 */
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string; next?: string }>;
}) {
  const { token, error, next } = await searchParams;
  const nextPath = safeNextPath(next);
  const forgotHref = `/forgot-password?next=${encodeURIComponent(nextPath)}`;

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SiteHeader />

      <section className="max-w-md mx-auto px-6 md:px-10 pt-24 pb-8">
        <div className="text-xs tracking-[0.35em] uppercase text-clay">Your account</div>
        <h1 className="font-display text-4xl md:text-5xl text-earth leading-[1.05] mt-3">
          Choose a new <span className="italic">password</span>
        </h1>
      </section>

      <section className="max-w-md mx-auto px-6 md:px-10 pb-20">
        {token && !error ? (
          <ResetPasswordForm token={token} nextPath={nextPath} />
        ) : (
          <div className="rounded-3xl bg-cream/60 border border-earth/15 p-6 md:p-8 text-center">
            <p className="text-earth">This reset link has expired or was already used.</p>
            <Link
              href={forgotHref}
              className="mt-6 inline-flex items-center justify-center bg-earth text-cream px-6 py-3.5 rounded-full text-xs tracking-widest uppercase hover:bg-clay transition-colors"
            >
              Send a new link
            </Link>
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}
