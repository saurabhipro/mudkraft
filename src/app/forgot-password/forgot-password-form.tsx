"use client";

import Link from "next/link";
import { useState } from "react";

import { authInputCls, authLabelCls } from "@/components/auth/PasswordField";
import { authClient } from "@/lib/auth-client";

export function ForgotPasswordForm({
  nextPath,
  initialEmail,
}: {
  nextPath: string;
  initialEmail: string;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const signInHref = `/sign-in?next=${encodeURIComponent(nextPath)}`;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(email.trim()))
      return setError("Please enter a valid email address.");

    setPending(true);
    const { error: authError } = await authClient.requestPasswordReset({
      email: email.trim(),
      redirectTo: `/reset-password?next=${encodeURIComponent(nextPath)}`,
    });
    setPending(false);

    // Better Auth answers the same whether or not the account exists, and so do
    // we: only rate limiting is worth reporting.
    if (authError?.status === 429)
      return setError("Too many requests. Please wait a minute and try again.");
    if (authError && authError.status >= 500)
      return setError("We could not send the email just now. Please try again.");
    setSent(true);
  };

  if (sent) {
    return (
      <div className="rounded-2xl border border-earth/15 bg-sand/60 p-6 text-center">
        <div className="text-xs tracking-[0.3em] uppercase text-clay">Check your inbox</div>
        <p className="mt-4 text-earth">
          If an account exists for <strong className="break-all">{email.trim()}</strong>, we&apos;ve
          sent a link to reset the password.
        </p>
        <p className="mt-2 text-sm text-foreground/70">
          It expires in 1 hour. Check spam if you don&apos;t see it.
        </p>
        <Link
          href={signInHref}
          className="mt-6 inline-block text-sm text-earth/70 underline underline-offset-2 hover:text-earth"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label className={authLabelCls} htmlFor="email">
        Email
      </label>
      <input
        id="email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className={authInputCls}
      />

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 w-full inline-flex items-center justify-center bg-earth text-cream px-6 py-3.5 rounded-full text-xs tracking-widest uppercase hover:bg-clay transition-colors disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send reset link"}
      </button>

      <p className="mt-5 text-center text-sm text-earth/70">
        Remembered it?{" "}
        <Link href={signInHref} className="underline underline-offset-2 hover:text-earth">
          Sign in
        </Link>
      </p>
    </form>
  );
}
