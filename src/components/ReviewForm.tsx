"use client";

import { useState, useTransition } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { authClient } from "@/lib/auth-client";
import { submitReview } from "@/server/actions/reviews";

const WORDS = ["", "Not for me", "Could be better", "Good", "Very good", "Love it"];

const field =
  "w-full min-h-[48px] rounded-2xl border border-earth/20 bg-cream/70 px-4 text-[15px] text-earth placeholder:text-muted-foreground/70 transition-[border-color,box-shadow] duration-300 focus:outline-none focus:border-clay focus:shadow-[0_0_0_4px_oklch(0.58_0.14_42/0.12)]";

/**
 * "Write a review" for one piece, in a popup. Signed-in shoppers skip the
 * name and email, everyone else leaves both. Reviews wait for the studio's
 * approval in Bikriup before they show.
 */
export function ReviewForm({ slug, name: productName }: { slug: string; name: string }) {
  const { data: session } = authClient.useSession();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [pending, start] = useTransition();
  const shown = hover || rating;

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!rating) {
      setError("Tap the stars to rate it");
      return;
    }
    const form = Object.fromEntries(new FormData(e.currentTarget));
    setError("");
    start(async () => {
      const out = await submitReview({ ...form, slug, rating });
      if (out.ok) setDone(out.message);
      else setError(out.error);
    });
  };

  const thanks = (
    <div
      role="status"
      className="mt-2 flex items-start gap-3 rounded-2xl bg-sand p-5 animate-fade-up"
    >
      <span className="grid place-items-center shrink-0 w-9 h-9 rounded-full bg-sage text-cream">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          aria-hidden="true"
          className="w-4 h-4"
        >
          <path d="M5 12l5 5L20 7" className="animate-check-draw" />
        </svg>
      </span>
      <p className="text-sm leading-relaxed text-earth">{done}</p>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="mt-8 mk-btn-fill inline-flex items-center gap-2.5 min-h-[48px] px-6 rounded-full border border-earth/30 text-earth text-xs tracking-[0.16em] uppercase"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
            className="w-4 h-4"
          >
            <path d="M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4" />
          </svg>
          {done ? "Thank you for your review" : "Write a review"}
        </button>
      </DialogTrigger>

      <DialogContent
        // Above the fixed site header (z-50), which otherwise floats over the backdrop.
        overlayClassName="z-[95] bg-ink/70 backdrop-blur-sm"
        className="z-[100] max-w-[calc(100%-2rem)] sm:max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-[1.75rem] sm:rounded-[1.75rem] border-earth/10 bg-background p-6 sm:p-7 duration-300"
      >
        <div>
          <div className="text-[11px] tracking-[0.3em] uppercase text-clay-deep">
            Write a review
          </div>
          <DialogTitle className="mt-1.5 font-display font-normal text-3xl text-earth tracking-normal">
            Your {productName}
          </DialogTitle>
          <DialogDescription className="mt-1">
            How is it settling into your kitchen?
          </DialogDescription>
        </div>
        {done ? (
          thanks
        ) : (
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <fieldset>
              <legend className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground">
                Your rating
              </legend>
              <div className="mt-2 flex items-center gap-1" onMouseLeave={() => setHover(0)}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    onMouseEnter={() => setHover(n)}
                    aria-label={`${n} star${n === 1 ? "" : "s"}`}
                    aria-pressed={rating === n}
                    className="grid place-items-center w-11 h-11 rounded-full transition-transform duration-300 ease-[var(--ease-spring)] hover:scale-110 active:scale-90"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      className={`w-7 h-7 transition-colors duration-200 ${n <= shown ? "text-gold" : "text-earth/20"}`}
                      fill="currentColor"
                    >
                      <path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.5l1.1-6.5L2.6 9.4l6.5-.9L12 2.6z" />
                    </svg>
                  </button>
                ))}
                <span key={shown} className="ml-2 font-hand text-xl text-clay-deep animate-fade-up">
                  {WORDS[shown]}
                </span>
              </div>
            </fieldset>

            <label className="block">
              <span className="sr-only">Title</span>
              <input
                name="title"
                maxLength={120}
                placeholder="Sum it up in a line (optional)"
                className={field}
              />
            </label>
            <label className="block">
              <span className="sr-only">Your review</span>
              <textarea
                name="body"
                required
                minLength={3}
                maxLength={2000}
                rows={4}
                placeholder="How is it cooking? What did you make first?"
                className={`${field} py-3 resize-y`}
              />
            </label>

            {session ? (
              <p className="text-xs text-muted-foreground">
                Posting as <b className="text-earth">{session.user.name}</b> ({session.user.email})
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="sr-only">Your name</span>
                  <input
                    name="name"
                    required
                    maxLength={60}
                    autoComplete="name"
                    placeholder="Your name"
                    className={field}
                  />
                </label>
                <label className="block">
                  <span className="sr-only">Email</span>
                  <input
                    name="email"
                    type="email"
                    required
                    maxLength={120}
                    autoComplete="email"
                    placeholder="Email (not shown)"
                    className={field}
                  />
                </label>
              </div>
            )}
            <label className="block">
              <span className="sr-only">City</span>
              <input
                name="city"
                maxLength={60}
                autoComplete="address-level2"
                placeholder="City (optional)"
                className={field}
              />
            </label>
            <input
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="hidden"
            />

            {error && (
              <p role="alert" className="text-sm text-clay-deep animate-fade-up">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full inline-flex items-center justify-center gap-2.5 min-h-[52px] rounded-full bg-clay text-cream text-[13px] tracking-[0.16em] uppercase transition-[background-color,transform] duration-500 ease-[var(--ease-clay)] hover:bg-clay-deep hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0"
            >
              {pending ? "Sending…" : "Post review"}
            </button>
            <p className="text-[11px] text-muted-foreground">
              Reviews show once the studio approves them. Your email is never shown.
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
