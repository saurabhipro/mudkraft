"use client";

import { useState, type FormEvent } from "react";

import { subscribeNewsletter } from "@/server/actions/newsletter";

/** The home page's "Letters from the kiln" signup: saves the address and emails a thank-you. */
export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ already: boolean } | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    setBusy(true);
    const out = await subscribeNewsletter({ email, website }).catch(() => ({
      ok: false as const,
      error: "Please try again in a minute.",
    }));
    setBusy(false);
    if (!out.ok) {
      setError(out.error);
      return;
    }
    setDone({ already: out.already });
  }

  if (done) {
    return (
      <div
        role="status"
        className="mt-10 mx-auto max-w-lg rounded-[2rem] bg-cream/10 border border-cream/30 px-6 py-5"
      >
        <p className="font-display text-2xl">
          {done.already ? "You're already on the list." : "Thank you for subscribing."}
        </p>
        <p className="mt-1.5 text-sm text-cream/82">
          {done.already
            ? "Your first letter is on its way with the next firing."
            : `A welcome note is on its way to ${email.trim()}.`}
        </p>
      </div>
    );
  }

  return (
    <>
      <form
        noValidate
        onSubmit={submit}
        className="mt-10 mx-auto max-w-lg flex flex-col sm:flex-row gap-2 p-2 rounded-[2rem] sm:rounded-full bg-cream/10 border border-cream/30"
      >
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="your@email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={Boolean(error)}
          className="flex-1 min-w-0 min-h-[52px] px-5 bg-transparent text-cream placeholder:text-cream/70 focus:outline-none"
        />
        {/* Honeypot: hidden from people and screen readers; bots fill it in. */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute -left-[9999px] h-px w-px opacity-0"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
        <button
          type="submit"
          disabled={busy}
          className="mk-btn-fill min-h-[52px] px-7 rounded-full bg-cream text-ink text-xs tracking-[0.16em] uppercase font-medium disabled:opacity-70"
        >
          {busy ? "Saving…" : "Subscribe"}
        </button>
      </form>
      {error && (
        <p role="alert" className="mt-3 text-sm text-[oklch(0.9_0.07_85)]">
          {error}
        </p>
      )}
    </>
  );
}
