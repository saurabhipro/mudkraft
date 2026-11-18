import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/components/auth/AuthShell";
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
    <AuthShell
      eyebrow="Your account"
      title={
        <>
          Choose a new <span className="italic">password</span>
        </>
      }
      intro={
        token && !error
          ? "Pick something you haven't used here before. You'll sign in with it straight after."
          : "This link can't be used any more."
      }
    >
      {token && !error ? (
        <ResetPasswordForm token={token} nextPath={nextPath} />
      ) : (
        <div className="rounded-2xl border border-earth/15 bg-sand/60 p-6 text-center">
          <p className="text-earth">This reset link has expired or was already used.</p>
          <Link
            href={forgotHref}
            className="mt-5 inline-flex items-center justify-center bg-earth text-cream px-6 py-3.5 rounded-full text-xs tracking-widest uppercase hover:bg-clay transition-colors"
          >
            Send a new link
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
