import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/AuthShell";
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
    <AuthShell
      eyebrow="Your account"
      title={
        <>
          Forgot your <span className="italic">password</span>?
        </>
      }
      intro="No trouble. Enter your account email and we'll send you a link to choose a new one."
    >
      <ForgotPasswordForm nextPath={safeNextPath(next)} initialEmail={email?.slice(0, 200) ?? ""} />
    </AuthShell>
  );
}
