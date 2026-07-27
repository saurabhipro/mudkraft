"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";

const inputCls =
  "mt-2 w-full rounded-full border border-earth/25 bg-background px-5 py-3 text-earth " +
  "placeholder:text-earth/40 focus:outline-none focus:ring-2 focus:ring-earth/40";

export function SignInForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<"google" | "email" | null>(null);

  const handleGoogle = async () => {
    setError(null);
    setPending("google");
    const { error: authError } = await authClient.signIn.social({
      provider: "google",
      callbackURL: nextPath,
    });
    // On success the browser navigates to Google, so reaching here means it failed.
    if (authError) {
      setError(authError.message ?? "Could not reach Google. Please try again.");
      setPending(null);
    }
  };

  const handleEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setPending("email");

    const { error: authError } = await authClient.signIn.email({ email, password });

    if (authError) {
      // Deliberately generic: distinguishing "no such account" from "wrong
      // password" tells an attacker which emails are registered.
      setError("That email and password combination did not work.");
      setPending(null);
      return;
    }

    router.push(nextPath);
    router.refresh();
  };

  return (
    <div className="rounded-3xl bg-cream/60 border border-earth/15 p-6 md:p-8">
      <button
        type="button"
        onClick={handleGoogle}
        disabled={pending !== null}
        className="w-full inline-flex items-center justify-center gap-3 border border-earth/25 bg-background text-earth px-6 py-3.5 rounded-full text-xs tracking-widest uppercase hover:bg-earth hover:text-cream transition-colors disabled:opacity-60"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12.24 10.29v3.66h5.19c-.22 1.35-1.6 3.96-5.19 3.96-3.12 0-5.67-2.58-5.67-5.76s2.55-5.76 5.67-5.76c1.78 0 2.97.76 3.65 1.41l2.49-2.4C16.79 3.87 14.71 3 12.24 3 7.34 3 3.37 6.97 3.37 11.85s3.97 8.85 8.87 8.85c5.12 0 8.51-3.6 8.51-8.67 0-.58-.06-1.03-.14-1.47z"
          />
        </svg>
        {pending === "google" ? "Redirecting…" : "Continue with Google"}
      </button>

      <div className="my-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-earth/15" />
        <span className="text-[11px] tracking-[0.3em] uppercase text-earth/50">or</span>
        <span className="h-px flex-1 bg-earth/15" />
      </div>

      <form onSubmit={handleEmail} noValidate>
        <label className="block text-xs tracking-widest uppercase text-earth/70" htmlFor="email">
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
          className={inputCls}
        />

        <label
          className="block mt-5 text-xs tracking-widest uppercase text-earth/70"
          htmlFor="password"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••••••"
          className={inputCls}
        />

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending !== null}
          className="mt-6 w-full inline-flex items-center justify-center bg-earth text-cream px-6 py-3.5 rounded-full text-xs tracking-widest uppercase hover:bg-clay transition-colors disabled:opacity-60"
        >
          {pending === "email" ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
