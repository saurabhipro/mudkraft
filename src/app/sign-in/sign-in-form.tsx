"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { PasswordField, authInputCls, authLabelCls } from "@/components/auth/PasswordField";
import { authClient } from "@/lib/auth-client";
import { checkPassword } from "@/lib/password-policy";

type Mode = "signin" | "signup";
type Pending = "google" | "email" | "link" | null;

const primaryBtn =
  "w-full inline-flex items-center justify-center bg-earth text-cream px-6 py-3.5 rounded-full text-xs tracking-widest uppercase hover:bg-clay transition-colors disabled:opacity-60";
const textBtn = "underline underline-offset-2 hover:text-earth disabled:opacity-60";

export function SignInForm({
  nextPath,
  initialMode,
  linkError,
  notice,
}: {
  nextPath: string;
  initialMode: Mode;
  linkError: string | null;
  notice: string | null;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(linkError);
  const [exists, setExists] = useState(false);
  const [linkSentTo, setLinkSentTo] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending>(null);

  const forgotHref = `/forgot-password?next=${encodeURIComponent(nextPath)}${
    email ? `&email=${encodeURIComponent(email)}` : ""
  }`;

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setExists(false);
    setPassword("");
  };

  const finish = () => {
    router.push(nextPath);
    router.refresh();
  };

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

  const handleMagicLink = async () => {
    setError(null);
    const address = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(address)) {
      setError("Enter your email above and we'll send you a sign-in link.");
      return;
    }
    setPending("link");
    const { error: authError } = await authClient.signIn.magicLink({
      email: address,
      name: name.trim() || undefined,
      callbackURL: nextPath,
      errorCallbackURL: `/sign-in?next=${encodeURIComponent(nextPath)}`,
    });
    setPending(null);
    if (authError) {
      setError(
        authError.status === 429
          ? "Too many requests. Please wait a minute and try again."
          : "We could not send the link just now. Please try again.",
      );
      return;
    }
    setLinkSentTo(address);
  };

  const handleSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setPending("email");
    const { error: authError } = await authClient.signIn.email({ email: email.trim(), password });
    if (authError) {
      // Deliberately generic: distinguishing "no such account" from "wrong
      // password" tells an attacker which emails are registered.
      setError(
        authError.status === 429
          ? "Too many attempts. Please wait a minute and try again."
          : "That email and password combination did not work. Try a sign-in link, or reset your password.",
      );
      setPending(null);
      return;
    }
    finish();
  };

  const handleSignUp = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setExists(false);

    if (name.trim().length < 2) return setError("Please enter your name.");
    if (!/^\S+@\S+\.\S+$/.test(email.trim()))
      return setError("Please enter a valid email address.");
    const problem = checkPassword(password);
    if (problem) return setError(problem);

    setPending("email");
    const { error: authError } = await authClient.signUp.email({
      name: name.trim(),
      email: email.trim(),
      password,
      callbackURL: nextPath,
    });
    if (authError) {
      setPending(null);
      if (authError.code?.startsWith("USER_ALREADY_EXISTS")) {
        setExists(true);
        return;
      }
      setError(authError.message ?? "We could not create your account. Please try again.");
      return;
    }
    finish();
  };

  if (linkSentTo) {
    return (
      <div className="rounded-3xl bg-cream/60 border border-earth/15 p-6 md:p-8 text-center">
        <div className="text-xs tracking-[0.3em] uppercase text-clay">Check your inbox</div>
        <p className="mt-4 text-earth">
          We&apos;ve sent a sign-in link to <strong className="break-all">{linkSentTo}</strong>.
        </p>
        <p className="mt-2 text-sm text-foreground/70">
          Open it on this device to continue{nextPath.startsWith("/checkout") ? " to checkout" : ""}
          . It expires in 10 minutes. Check spam if you don&apos;t see it.
        </p>
        <button
          type="button"
          onClick={() => setLinkSentTo(null)}
          className={`mt-6 text-sm text-earth/70 ${textBtn}`}
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-cream/60 border border-earth/15 p-6 md:p-8">
      <div
        role="tablist"
        aria-label="Account"
        className="mb-6 grid grid-cols-2 rounded-full border border-earth/20 p-1"
      >
        {(
          [
            ["signin", "Sign in"],
            ["signup", "Create account"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            onClick={() => switchMode(value)}
            className={`rounded-full py-2.5 text-[11px] tracking-widest uppercase transition-colors ${
              mode === value ? "bg-earth text-cream" : "text-earth/70 hover:text-earth"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {notice && !error && (
        <p
          role="status"
          className="mb-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          {notice}
        </p>
      )}

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
        <span className="text-[11px] tracking-[0.3em] uppercase text-earth/50">or with email</span>
        <span className="h-px flex-1 bg-earth/15" />
      </div>

      <form
        onSubmit={mode === "signin" ? handleSignIn : handleSignUp}
        noValidate
        className="grid gap-5"
      >
        {mode === "signup" && (
          <div>
            <label className={authLabelCls} htmlFor="name">
              Your name
            </label>
            <input
              id="name"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Aarushi Sharma"
              className={authInputCls}
            />
          </div>
        )}

        <div>
          <label className={authLabelCls} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setExists(false);
            }}
            placeholder="you@example.com"
            className={authInputCls}
          />
        </div>

        <PasswordField
          id="password"
          label={mode === "signup" ? "Create a password" : "Password"}
          value={password}
          onChange={setPassword}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          showRules={mode === "signup"}
        />

        {mode === "signin" && (
          <div className="-mt-2 text-right text-xs text-earth/70">
            <Link href={forgotHref} className={textBtn}>
              Forgot password?
            </Link>
          </div>
        )}

        {exists && (
          <div
            role="alert"
            className="rounded-2xl border border-clay/30 bg-clay/5 px-4 py-3 text-sm text-earth"
          >
            <p>An account with this email already exists.</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-earth/80">
              <button type="button" onClick={() => switchMode("signin")} className={textBtn}>
                Sign in instead
              </button>
              <button
                type="button"
                onClick={handleMagicLink}
                disabled={pending !== null}
                className={textBtn}
              >
                Email me a sign-in link
              </button>
              <Link href={forgotHref} className={textBtn}>
                Reset password
              </Link>
            </div>
          </div>
        )}

        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}

        <button type="submit" disabled={pending !== null} className={primaryBtn}>
          {pending === "email"
            ? mode === "signup"
              ? "Creating account…"
              : "Signing in…"
            : mode === "signup"
              ? "Create account"
              : "Sign in"}
        </button>
      </form>

      <div className="mt-6 border-t border-earth/10 pt-5 text-center">
        <p className="text-xs text-earth/60">Rather not use a password?</p>
        <button
          type="button"
          onClick={handleMagicLink}
          disabled={pending !== null}
          className="mt-2 text-sm text-earth hover:text-clay underline underline-offset-4 disabled:opacity-60"
        >
          {pending === "link" ? "Sending link…" : "Email me a sign-in link"}
        </button>
      </div>
    </div>
  );
}
