"use client";

import { Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { MagicLinkDialog } from "@/components/auth/MagicLinkDialog";
import { PasswordField, authInputCls, authLabelCls } from "@/components/auth/PasswordField";
import { authClient } from "@/lib/auth-client";
import { checkPassword } from "@/lib/password-policy";

type Mode = "signin" | "signup";
type Pending = "google" | "email" | null;

const primaryBtn =
  "w-full inline-flex items-center justify-center bg-earth text-cream px-6 py-4 rounded-full text-xs tracking-widest uppercase shadow-[0_10px_24px_-12px_rgba(59,42,34,0.7)] hover:bg-clay transition-colors disabled:opacity-60";
const secondaryBtn =
  "w-full inline-flex items-center justify-center gap-3 border border-earth/20 bg-background text-earth px-6 py-3.5 rounded-full text-xs tracking-widest uppercase hover:border-earth/50 hover:bg-sand/60 transition-colors disabled:opacity-60";
const textBtn = "underline underline-offset-2 hover:text-earth disabled:opacity-60";

const EMAIL_RE = /^\S+@\S+\.\S+$/;

function GoogleMark() {
  return (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}

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
  const [magicOpen, setMagicOpen] = useState(false);
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
    if (!EMAIL_RE.test(email.trim())) return setError("Please enter a valid email address.");
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

  return (
    <div>
      <div
        role="tablist"
        aria-label="Account"
        className="relative grid grid-cols-2 rounded-full bg-sand p-1 ring-1 ring-earth/10"
      >
        <span
          aria-hidden="true"
          className={`absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-earth shadow transition-transform duration-300 ${
            mode === "signup" ? "translate-x-full" : ""
          }`}
        />
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
            className={`relative z-10 rounded-full py-3 text-[11px] tracking-widest uppercase transition-colors ${
              mode === value ? "text-cream" : "text-earth/70 hover:text-earth"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {notice && !error && (
        <p
          role="status"
          className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          {notice}
        </p>
      )}

      <button
        type="button"
        onClick={handleGoogle}
        disabled={pending !== null}
        className={`mt-6 ${secondaryBtn}`}
      >
        <GoogleMark />
        {pending === "google" ? "Redirecting…" : "Continue with Google"}
      </button>

      <button
        type="button"
        onClick={() => setMagicOpen(true)}
        disabled={pending !== null}
        className={`mt-3 ${secondaryBtn}`}
      >
        <Mail className="h-4 w-4" aria-hidden="true" />
        Email me a sign-in link
      </button>
      <p className="mt-2 text-center text-[11px] text-earth/50">
        No password needed — we email you a one-tap link.
      </p>

      <MagicLinkDialog
        open={magicOpen}
        onOpenChange={setMagicOpen}
        nextPath={nextPath}
        initialEmail={email.trim()}
      />

      <div className="my-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-earth/15" />
        <span className="text-[10px] tracking-[0.3em] uppercase text-earth/45">
          or use a password
        </span>
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

        <div>
          <PasswordField
            id="password"
            label={mode === "signup" ? "Create a password" : "Password"}
            value={password}
            onChange={setPassword}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            showRules={mode === "signup"}
          />
          {mode === "signin" && (
            <div className="mt-2 text-right text-xs text-earth/65">
              <Link href={forgotHref} className={textBtn}>
                Forgot password?
              </Link>
            </div>
          )}
        </div>

        {exists && (
          <div
            role="alert"
            className="rounded-2xl border border-clay/30 bg-clay/5 px-4 py-3 text-sm text-earth"
          >
            <p className="font-medium">You already have an account with this email.</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-earth/80">
              <button type="button" onClick={() => switchMode("signin")} className={textBtn}>
                Sign in instead
              </button>
              <button type="button" onClick={() => setMagicOpen(true)} className={textBtn}>
                Email me a sign-in link
              </button>
              <Link href={forgotHref} className={textBtn}>
                Reset password
              </Link>
            </div>
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">
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

      <p className="mt-8 text-center text-[11px] leading-relaxed text-earth/50">
        By continuing you agree to our{" "}
        <Link href="/terms" className={textBtn}>
          terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className={textBtn}>
          privacy policy
        </Link>
        .
      </p>
    </div>
  );
}
