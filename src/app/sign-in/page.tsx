import type { Metadata } from "next";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getSession } from "@/server/auth-guard";
import { redirect } from "next/navigation";

import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = {
  title: "Sign in — Mudkraft",
  // A login page has no business in search results.
  robots: { index: false, follow: false },
};

/** Only same-origin paths are accepted, so `?next=` cannot become an open redirect. */
function safeNextPath(raw: string | undefined): string {
  if (!raw) return "/";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const nextPath = safeNextPath(next);

  const session = await getSession();
  if (session) redirect(nextPath);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SiteHeader />

      <section className="max-w-md mx-auto px-6 md:px-10 pt-24 pb-8">
        <div className="text-xs tracking-[0.35em] uppercase text-clay">Your account</div>
        <h1 className="font-display text-4xl md:text-5xl text-earth leading-[1.05] mt-3">
          Welcome <span className="italic">back</span>
        </h1>
        <p className="mt-4 text-foreground/80">
          Sign in to see your orders and leave a review. You don&apos;t need an account to place
          an order.
        </p>
      </section>

      <section className="max-w-md mx-auto px-6 md:px-10 pb-20">
        <SignInForm nextPath={nextPath} />
      </section>

      <SiteFooter />
    </div>
  );
}
