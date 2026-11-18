"use client";

import { Mail } from "lucide-react";
import { useState } from "react";

import { authInputCls, authLabelCls } from "@/components/auth/PasswordField";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { authClient } from "@/lib/auth-client";

const EMAIL_RE = /^\S+@\S+\.\S+$/;

/**
 * Passwordless sign-in: asks for an email only, sends the one-tap link, and
 * confirms inside the popup. A new email gets an account on first click.
 */
export function MagicLinkDialog({
  open,
  onOpenChange,
  nextPath,
  initialEmail = "",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nextPath: string;
  initialEmail?: string;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Re-seed from the form each time the popup opens, and start fresh.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setEmail((current) => initialEmail || current);
      setSentTo(null);
      setError(null);
    }
  }

  const send = async (event?: React.FormEvent) => {
    event?.preventDefault();
    setError(null);
    const address = email.trim();
    if (!EMAIL_RE.test(address)) return setError("Please enter a valid email address.");

    setPending(true);
    const { error: authError } = await authClient.signIn.magicLink({
      email: address,
      callbackURL: nextPath,
      errorCallbackURL: `/sign-in?next=${encodeURIComponent(nextPath)}`,
    });
    setPending(false);
    if (authError) {
      return setError(
        authError.status === 429
          ? "Too many requests. Please wait a minute and try again."
          : "We could not send the link just now. Please try again.",
      );
    }
    setSentTo(address);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md rounded-3xl border-earth/15 bg-cream p-6 sm:p-8 sm:rounded-3xl">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-earth text-cream">
          <Mail className="h-6 w-6" aria-hidden="true" />
        </div>

        {sentTo ? (
          <div className="text-center">
            <DialogTitle className="mt-2 font-display text-3xl font-normal text-earth">
              Check your inbox
            </DialogTitle>
            <DialogDescription className="mt-3 text-base text-earth/80">
              We&apos;ve sent a sign-in link to{" "}
              <strong className="break-all text-earth">{sentTo}</strong>.
            </DialogDescription>
            <p className="mt-2 text-sm text-foreground/65">
              Open it on this device to continue
              {nextPath.startsWith("/checkout") ? " to checkout" : ""}. It expires in 10 minutes —
              check spam if it isn&apos;t there.
            </p>
            {error && (
              <p role="alert" className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </p>
            )}
            <div className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-earth/70">
              <button
                type="button"
                onClick={() => send()}
                disabled={pending}
                className="underline underline-offset-2 hover:text-earth disabled:opacity-60"
              >
                {pending ? "Sending…" : "Send it again"}
              </button>
              <button
                type="button"
                onClick={() => setSentTo(null)}
                className="underline underline-offset-2 hover:text-earth"
              >
                Use a different email
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={send} noValidate>
            <div className="text-center">
              <DialogTitle className="mt-2 font-display text-3xl font-normal text-earth">
                Sign in with email
              </DialogTitle>
              <DialogDescription className="mt-2 text-sm text-foreground/70">
                No password needed. We&apos;ll email you a one-tap link — new here? It creates your
                account too.
              </DialogDescription>
            </div>

            <label className={`${authLabelCls} mt-6`} htmlFor="magic-email">
              Email
            </label>
            <input
              id="magic-email"
              type="email"
              autoComplete="email"
              autoFocus
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={authInputCls}
            />

            {error && (
              <p role="alert" className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="mt-6 w-full inline-flex items-center justify-center bg-earth text-cream px-6 py-4 rounded-full text-xs tracking-widest uppercase hover:bg-clay transition-colors disabled:opacity-60"
            >
              {pending ? "Sending link…" : "Send me the link"}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
