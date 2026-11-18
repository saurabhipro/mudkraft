import type { Metadata } from "next";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { safeNextPath } from "@/lib/safe-next";

import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot password — Mudkraft",
  robots: { index: false, follow: false },
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; email?: string }>;
}) {
  const { next, email } = await searchParams;

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SiteHeader />

      <section className="max-w-md mx-auto px-6 md:px-10 pt-24 pb-8">
        <div className="text-xs tracking-[0.35em] uppercase text-clay">Your account</div>
        <h1 className="font-display text-4xl md:text-5xl text-earth leading-[1.05] mt-3">
          Forgot your <span className="italic">password</span>?
        </h1>
        <p className="mt-4 text-foreground/80">
          Enter your account email and we&apos;ll send you a link to choose a new one.
        </p>
      </section>

      <section className="max-w-md mx-auto px-6 md:px-10 pb-20">
        <ForgotPasswordForm
          nextPath={safeNextPath(next)}
          initialEmail={email?.slice(0, 200) ?? ""}
        />
      </section>

      <SiteFooter />
    </div>
  );
}
