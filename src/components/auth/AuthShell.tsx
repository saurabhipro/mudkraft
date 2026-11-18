import type { ReactNode } from "react";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

import { BasketPeek } from "./BasketPeek";

const PROMISES = [
  ["Thrown by hand", "Every pot is shaped and fired by our potters, not a factory line."],
  ["Paid securely", "Card, UPI and netbanking through Razorpay, or cash on delivery where we can."],
  ["Remembered for you", "Your address is filled in next time, and every order is easy to track."],
] as const;

/**
 * Shared frame for sign-in, sign-up, forgot and reset password: a photo-led
 * brand panel beside the form on desktop, stacked on phones. `forCheckout`
 * adds the progress strip and the basket glance.
 */
export function AuthShell({
  eyebrow,
  title,
  intro,
  forCheckout = false,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  intro: ReactNode;
  forCheckout?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-24 sm:px-6 md:px-10 md:pt-28">
        {forCheckout && (
          <ol
            aria-label="Checkout progress"
            className="mb-8 flex items-center justify-center gap-2 text-[10px] tracking-[0.25em] uppercase sm:gap-4 sm:text-[11px]"
          >
            {(
              [
                ["Basket", "done"],
                ["Account", "current"],
                ["Delivery & pay", "next"],
              ] as const
            ).map(([label, state], i) => (
              <li key={label} className="flex items-center gap-2 sm:gap-4">
                {i > 0 && <span aria-hidden="true" className="h-px w-6 bg-earth/25 sm:w-12" />}
                <span
                  aria-current={state === "current" ? "step" : undefined}
                  className={`flex items-center gap-2 ${state === "next" ? "text-earth/40" : "text-earth"}`}
                >
                  <span
                    className={`grid h-6 w-6 place-items-center rounded-full text-[10px] ${
                      state === "done"
                        ? "bg-clay text-cream"
                        : state === "current"
                          ? "bg-earth text-cream"
                          : "border border-earth/25"
                    }`}
                  >
                    {state === "done" ? "✓" : i + 1}
                  </span>
                  <span className={state === "current" ? "" : "hidden sm:inline"}>{label}</span>
                </span>
              </li>
            ))}
          </ol>
        )}

        <div className="grid overflow-hidden rounded-[2rem] border border-earth/15 bg-cream/60 shadow-[0_30px_80px_-40px_rgba(59,42,34,0.55)] lg:grid-cols-[1.05fr_1fr]">
          {/* ---- brand panel ---- */}
          <aside className="relative isolate flex min-h-[220px] flex-col justify-end overflow-hidden bg-earth p-6 text-cream sm:p-8 lg:min-h-[640px] lg:p-10">
            <img
              src="/media/kitchen-slow.jpg"
              alt=""
              className="absolute inset-0 -z-20 h-full w-full object-cover"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 bg-gradient-to-t from-earth via-earth/80 to-earth/20"
            />

            <div className="font-hand text-2xl text-gold lg:text-3xl">
              from our wheel to your kitchen
            </div>
            <p className="mt-2 max-w-sm font-display text-2xl leading-tight lg:text-4xl">
              Slow-cooked food tastes better in clay.
            </p>

            <ul className="mt-8 hidden gap-5 lg:grid">
              {PROMISES.map(([head, copy]) => (
                <li key={head} className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold"
                  />
                  <div>
                    <div className="text-sm font-medium text-cream">{head}</div>
                    <div className="mt-0.5 text-sm leading-relaxed text-cream/70">{copy}</div>
                  </div>
                </li>
              ))}
            </ul>

            {forCheckout && (
              <div className="mt-6 lg:mt-8">
                <BasketPeek />
              </div>
            )}
          </aside>

          {/* ---- form ---- */}
          <section className="bg-background/70 p-6 sm:p-10 lg:p-12">
            <div className="text-xs tracking-[0.35em] uppercase text-clay">{eyebrow}</div>
            <h1 className="mt-3 font-display text-4xl leading-[1.05] text-earth md:text-5xl">
              {title}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-foreground/75 md:text-base">{intro}</p>
            <div className="mt-8">{children}</div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
