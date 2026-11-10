"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { dismissWelcome, saveWelcome, welcomeQuiet } from "@/lib/welcome";
import { getWelcomeOffer, joinWelcome, type WelcomeOffer } from "@/server/actions/welcome";

/**
 * First-visit welcome: name, WhatsApp number and email for the shop's welcome code.
 * Details go to Bikriup's customers book. It waits 8 seconds or 40% of a page,
 * never shows on checkout or account pages, stays away for two weeks after
 * "No thanks" and for good after signing up. A desktop dialog, a sheet on phones.
 */

const SKIP = ["/checkout", "/admin", "/account", "/login", "/signup", "/order", "/verify"];
const DELAY_MS = 8000;
const SCROLL_SHARE = 0.4;

// The plinth's pieces stand side by side, never overlapping: a photo that is not a cutout
// is blended with multiply, and over another piece it would show through as a ghost.
// The middle one of three leads.
const GROW = [["flex-1"], ["flex-1", "flex-1"], ["flex-[0.9]", "flex-[1.2]", "flex-[0.9]"]];

type Done = { code: string | null; percent: number; alreadyUsed: boolean; name: string };

export function WelcomePopup() {
  const pathname = usePathname();
  const [offer, setOffer] = useState<NonNullable<WelcomeOffer> | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", optIn: true, website: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Done | null>(null);
  const [copied, setCopied] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const skipped = SKIP.some((p) => pathname.startsWith(p));

  // Arm once per visit, on a page where it may show.
  useEffect(() => {
    if (skipped || open || offer || welcomeQuiet()) return;
    let fired = false;
    const fire = () => {
      if (fired) return;
      fired = true;
      cleanup();
      getWelcomeOffer()
        .then((o) => {
          if (o && !welcomeQuiet()) {
            setOffer(o);
            setOpen(true);
          }
        })
        .catch(() => {});
    };
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max > 0 && window.scrollY / max >= SCROLL_SHARE) fire();
    };
    const timer = window.setTimeout(fire, DELAY_MS);
    window.addEventListener("scroll", onScroll, { passive: true });
    function cleanup() {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    }
    return cleanup;
  }, [skipped, open, offer]);

  // While open: no page scroll behind, Esc closes, Tab stays inside.
  useEffect(() => {
    if (!open) return;
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // The dialog itself takes focus: an input would throw the phone keyboard up at once.
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key !== "Tab" || !panel.current) return;
      const items = [...panel.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), input:not([tabindex='-1'])")];
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = before;
      document.removeEventListener("keydown", onKey);
    };
    // close only reads setters and storage; re-binding on every render is unnecessary
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, done]);

  function close() {
    if (!done) dismissWelcome();
    setOpen(false);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setErrors({});
    const result = await joinWelcome(form).catch(() => ({ ok: false as const, error: "Please try again in a minute." }));
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      setErrors(("fieldErrors" in result && result.fieldErrors) || {});
      return;
    }
    saveWelcome({ name: form.name.trim(), phone: form.phone, email: form.email.trim(), code: result.code });
    setDone({ code: result.code, percent: result.percent, alreadyUsed: result.alreadyUsed, name: form.name.trim().split(/\s+/)[0] });
  }

  async function copy() {
    if (!done?.code) return;
    try {
      await navigator.clipboard.writeText(done.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* the code is on screen to type */
    }
  }

  if (!open || !offer) return null;
  const pieces = offer.pieces;
  const input =
    "h-12 w-full rounded-xl border-[1.5px] border-border bg-white px-3.5 text-base font-normal text-earth placeholder:text-muted-foreground/80 focus:border-clay focus:outline-none focus:ring-[3px] focus:ring-clay/20 md:h-[46px] md:text-[14.5px]";

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center md:items-center md:p-6" data-no-motion>
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={close}
        className="absolute inset-0 cursor-default bg-[rgba(30,22,18,0.55)] backdrop-blur-[3px] animate-in fade-in duration-300"
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mk-welcome-title"
        tabIndex={-1}
        className="relative flex outline-none max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[1.75rem] bg-[#FBF6EF] shadow-[0_50px_100px_-30px_rgba(0,0,0,0.55)] animate-in slide-in-from-bottom-8 duration-500 ease-[var(--ease-clay)] md:max-w-[860px] md:flex-row md:rounded-[1.9rem] md:fade-in md:zoom-in-95"
      >
        {/* The plinth: three of the studio's own pieces and the offer. */}
        <div className="relative h-[150px] shrink-0 overflow-hidden bg-sand md:h-auto md:w-[380px]">
          <span aria-hidden="true" className="absolute left-1/2 top-2.5 h-[5px] w-11 -translate-x-1/2 rounded-full bg-earth/20 md:hidden" />
          <span aria-hidden="true" className="absolute inset-x-[10%] bottom-[8%] h-[24%] rounded-[50%] bg-[oklch(0.84_0.042_70)] md:bottom-[13%] md:h-[15%]" />
          <div className="absolute bottom-[14%] left-[16%] right-[24%] flex h-[60%] items-end justify-center gap-2 md:inset-x-[6%] md:bottom-[18%] md:h-[30%] md:gap-3">
            {pieces.map((piece, i) => (
              <img
                key={piece.src}
                src={piece.src}
                alt={i === 1 || pieces.length === 1 ? "Mudkraft clay pieces" : ""}
                className={`h-full min-w-0 object-contain object-bottom animate-in fade-in slide-in-from-bottom-4 duration-700 ${
                  piece.cutout ? "" : "mix-blend-multiply brightness-[1.06] contrast-[1.06]"
                } ${GROW[pieces.length - 1][i]} ${pieces.length === 3 && i !== 1 ? "max-h-[82%]" : ""}`}
                style={{ animationDelay: `${150 + i * 100}ms` }}
              />
            ))}
          </div>
          <div className="absolute left-7 right-7 top-7 hidden md:block">
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Mudkraft · Khurja</p>
            <p className="mt-2.5 font-hand text-[26px] leading-tight text-clay-deep">Seven generations of clay, one kiln.</p>
          </div>
          <span className="absolute right-4 top-5 flex h-[70px] w-[70px] rotate-[-8deg] flex-col items-center justify-center rounded-full bg-earth leading-none text-cream md:right-6 md:top-[118px] md:h-24 md:w-24">
            <span className="font-display text-[26px] font-medium md:text-[38px]">{offer.percent}%</span>
            <span className="mt-1 text-center text-[7.5px] uppercase leading-[1.25] tracking-[0.12em] opacity-85 md:text-[9px]">
              off{offer.once && <><br />first order</>}
            </span>
          </span>
          <p className="absolute inset-x-0 bottom-5 hidden justify-center gap-3 text-[11.5px] text-muted-foreground md:flex">
            <span>Hand-thrown</span>·<span>Wood-fired</span>·<span>No glaze</span>
          </p>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute left-3 top-5 grid h-11 w-11 place-items-center rounded-full bg-[#FBF6EF] text-earth md:hidden"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-7 pt-5 md:px-12 md:pb-9 md:pt-11">
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute right-4 top-4 hidden h-11 w-11 place-items-center rounded-full bg-[#F1E7DA] text-earth transition-colors hover:bg-earth hover:text-cream md:grid"
          >
            <CloseIcon />
          </button>

          {done ? (
            <div className="flex flex-1 flex-col justify-center" role="status">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-sage text-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-6 w-6">
                  <path d="M5 12.5l4.5 4.5L19 7" className="animate-check-draw" />
                </svg>
              </span>
              <h2 id="mk-welcome-title" className="mt-4 font-display text-[34px] font-normal leading-none text-earth md:text-[42px]">
                Welcome to the <em className="font-light text-clay">circle,</em> {done.name}.
              </h2>
              {done.code ? (
                <>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    Here is your code. Use it at checkout for {done.percent}% off{offer.once ? " your first order" : ""}.
                  </p>
                  <div className="mt-5 flex items-center justify-between gap-3 rounded-[1.1rem] border-2 border-dashed border-clay bg-white py-2 pl-5 pr-2">
                    <span className="font-display text-[30px] font-medium tracking-[0.12em] text-earth">{done.code}</span>
                    <button
                      type="button"
                      onClick={copy}
                      className={`min-h-[46px] shrink-0 rounded-xl px-4 text-[13.5px] font-semibold text-white transition-colors ${copied ? "bg-sage" : "bg-earth hover:bg-ink"}`}
                    >
                      {copied ? "Copied" : "Copy code"}
                    </button>
                  </div>
                  <p className="mt-2.5 text-xs text-muted-foreground">We have saved your details, so checkout fills itself and adds the code.</p>
                </>
              ) : (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {done.alreadyUsed
                    ? "Good to see you again. The welcome code has already been used with this number, but you'll still hear first about every new firing."
                    : "You're on the list. You'll hear first when a new firing comes out of the kiln."}
                </p>
              )}
              <button
                type="button"
                onClick={close}
                className="mt-7 min-h-[52px] rounded-full bg-clay-deep text-[15px] font-semibold text-white transition-colors hover:bg-earth"
              >
                Start shopping
              </button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="flex flex-1 flex-col">
              <p className="text-[10.5px] uppercase tracking-[0.2em] text-clay-deep md:text-[11px]">Welcome to Mudkraft</p>
              <h2 id="mk-welcome-title" className="mt-1.5 font-display text-[34px] font-normal leading-none text-earth md:mt-2.5 md:text-[44px]">
                Bring the earth <em className="font-light text-clay">home.</em>
              </h2>
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-muted-foreground md:mt-3 md:text-sm">
                Join the Mudkraft circle for{" "}
                <b className="font-semibold text-earth">
                  {offer.percent}% off {offer.once ? "your first order" : "your order"}
                </b>
                , and hear first when a new firing comes out of the kiln.
              </p>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <label className="flex flex-col gap-1.5 text-xs font-semibold text-earth md:col-span-2">
                  Your name
                  <input
                    className={input}
                    autoComplete="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    aria-invalid={Boolean(errors.name)}
                  />
                  {errors.name && <span className="font-normal text-red-800">{errors.name}</span>}
                </label>
                <label className="flex flex-col gap-1.5 text-xs font-semibold text-earth">
                  WhatsApp number
                  <span className="flex overflow-hidden rounded-xl border-[1.5px] border-border bg-white focus-within:border-clay focus-within:ring-[3px] focus-within:ring-clay/20">
                    <span className="grid place-items-center bg-[#F1E7DA] px-3 text-[15px] font-medium md:text-sm">+91</span>
                    <input
                      className="h-12 min-w-0 flex-1 bg-transparent px-3 text-base font-normal text-earth focus:outline-none md:h-[43px] md:text-[14.5px]"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      placeholder="98765 43210"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      aria-invalid={Boolean(errors.phone)}
                    />
                  </span>
                  {errors.phone && <span className="font-normal text-red-800">{errors.phone}</span>}
                </label>
                <label className="flex flex-col gap-1.5 text-xs font-semibold text-earth">
                  Email
                  <input
                    className={input}
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    aria-invalid={Boolean(errors.email)}
                  />
                  {errors.email && <span className="font-normal text-red-800">{errors.email}</span>}
                </label>
                {/* Honeypot: hidden from people and screen readers; bots fill it in. */}
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="absolute -left-[9999px] h-px w-px opacity-0"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                />
              </div>

              <label className="mt-3.5 flex items-start gap-2.5 text-[12.5px] leading-snug text-muted-foreground">
                <input
                  type="checkbox"
                  checked={form.optIn}
                  onChange={(e) => setForm({ ...form, optIn: e.target.checked })}
                  className="mt-px h-[18px] w-[18px] shrink-0 accent-[var(--clay)]"
                />
                Send me offers and new pieces on WhatsApp. Unsubscribe anytime.
              </label>

              {error && (
                <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3.5 py-2.5 text-[13px] text-red-800">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="mt-4 min-h-[52px] rounded-full bg-clay-deep text-[15px] font-semibold text-white transition-colors hover:bg-earth disabled:opacity-70"
              >
                {busy ? "Saving…" : `Get my ${offer.percent}% code`}
              </button>
              <button
                type="button"
                onClick={close}
                className="mt-2 min-h-9 self-center text-[12.5px] text-muted-foreground underline underline-offset-[3px] hover:text-earth md:mt-auto md:pt-4"
              >
                No thanks, just browsing
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="h-[18px] w-[18px]">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
