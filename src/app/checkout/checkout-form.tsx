"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { clearCart, useCart } from "@/lib/cart";
import { formatPaise } from "@/lib/money";
import { COD_REGION_LABEL, isCodEligible } from "@/lib/serviceability";
import { placeOrder, type CheckoutMethod } from "@/server/actions/checkout";

const inputCls =
  "mt-2 w-full rounded-2xl border border-earth/25 bg-background px-4 py-3 text-earth " +
  "placeholder:text-earth/40 focus:outline-none focus:ring-2 focus:ring-earth/40";

const labelCls = "block text-xs tracking-widest uppercase text-earth/70";

/** States and union territories, so the shipping address stays consistent. */
const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka",
  "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelCls} htmlFor={id}>
        {label}
      </label>
      {children}
      {error && (
        <p role="alert" className="mt-1.5 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

export interface CheckoutDefaults {
  name: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
}

export function CheckoutForm({
  defaults,
  signedIn,
  fromLastOrder,
}: {
  defaults: CheckoutDefaults;
  signedIn: boolean;
  /** True when the address below came from this customer's previous order. */
  fromLastOrder: boolean;
}) {
  const router = useRouter();
  const cart = useCart();

  /**
   * The cart lives in localStorage, so the server render and the first client
   * render both see it as empty. Without this guard the page would flash "your
   * basket is empty" at everyone before settling.
   */
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  // A note is specific to the order being placed, so it never carries over.
  const [form, setForm] = useState({ ...defaults, note: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<CheckoutMethod | null>(null);

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  const totalPaise = cart.reduce((sum, item) => sum + item.pricePaise * item.qty, 0);
  const count = cart.reduce((sum, item) => sum + item.qty, 0);

  // Purely presentational — `placeOrder` re-checks the PIN before accepting COD.
  const codAvailable = isCodEligible(form.postalCode);

  const submit = async (method: CheckoutMethod) => {
    setError(null);
    setFieldErrors({});
    setPending(method);

    const result = await placeOrder({
      ...form,
      method,
      items: cart.map((item) => ({ slug: item.slug, qty: item.qty })),
    });

    if (!result.ok) {
      setError(result.error);
      setFieldErrors(result.fieldErrors ?? {});
      setPending(null);
      return;
    }

    // The order now lives in the database; the browser copy has done its job.
    clearCart();
    router.push(
      result.method === "gateway" ? `/checkout/pay/${result.token}` : `/checkout/done/${result.token}`,
    );
  };

  if (!hydrated) {
    return (
      <div className="rounded-3xl border border-earth/15 bg-cream/40 p-8 text-sm text-muted-foreground">
        Loading your basket…
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="rounded-3xl border border-earth/15 bg-cream/40 p-10 text-center">
        <div className="font-hand text-3xl text-clay">the basket waits, quietly</div>
        <p className="mt-3 text-sm text-muted-foreground">
          There is nothing to check out yet.
        </p>
        <Link
          href="/#collection"
          className="mt-6 inline-flex items-center justify-center bg-earth text-cream px-6 py-3.5 rounded-full text-xs tracking-widest uppercase hover:bg-clay transition-colors"
        >
          Browse the collection
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      {/* ---- details ---- */}
      <form
        className="lg:col-span-3 rounded-3xl border border-earth/15 bg-cream/50 p-6 md:p-8"
        onSubmit={(event) => event.preventDefault()}
        noValidate
      >
        <h2 className="font-display text-2xl text-earth">Your details</h2>
        {signedIn && (
          <p className="mt-1 text-xs text-muted-foreground">
            {fromLastOrder ? "Pre-filled from your last order." : "Pre-filled from your account."}
          </p>
        )}

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field id="name" label="Full name" error={fieldErrors.name}>
            <input
              id="name"
              autoComplete="name"
              value={form.name}
              onChange={(e) => set("name")(e.target.value)}
              placeholder="Aarushi Sharma"
              className={inputCls}
            />
          </Field>

          <Field id="phone" label="Phone (WhatsApp)" error={fieldErrors.phone}>
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={(e) => set("phone")(e.target.value)}
              placeholder="98xxx xxxxx"
              className={inputCls}
            />
          </Field>

          <div className="sm:col-span-2">
            <Field id="email" label="Email" error={fieldErrors.email}>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => set("email")(e.target.value)}
                placeholder="you@example.com"
                className={inputCls}
              />
            </Field>
          </div>
        </div>

        <h2 className="mt-9 font-display text-2xl text-earth">Delivery address</h2>
        {fromLastOrder && (
          <p className="mt-1 text-xs text-muted-foreground">
            Where your last order went. Sending this one somewhere else? Just type over it.
          </p>
        )}

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field id="line1" label="Address" error={fieldErrors.line1}>
              <input
                id="line1"
                autoComplete="address-line1"
                value={form.line1}
                onChange={(e) => set("line1")(e.target.value)}
                placeholder="House / flat, street"
                className={inputCls}
              />
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field id="line2" label="Landmark, area (optional)" error={fieldErrors.line2}>
              <input
                id="line2"
                autoComplete="address-line2"
                value={form.line2}
                onChange={(e) => set("line2")(e.target.value)}
                placeholder="Near…"
                className={inputCls}
              />
            </Field>
          </div>

          <Field id="city" label="City" error={fieldErrors.city}>
            <input
              id="city"
              autoComplete="address-level2"
              value={form.city}
              onChange={(e) => set("city")(e.target.value)}
              placeholder="New Delhi"
              className={inputCls}
            />
          </Field>

          <Field id="postalCode" label="PIN code" error={fieldErrors.postalCode}>
            <input
              id="postalCode"
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={6}
              value={form.postalCode}
              onChange={(e) => set("postalCode")(e.target.value)}
              placeholder="110001"
              className={inputCls}
            />
          </Field>

          <div className="sm:col-span-2">
            <Field id="state" label="State" error={fieldErrors.state}>
              <select
                id="state"
                autoComplete="address-level1"
                value={form.state}
                onChange={(e) => set("state")(e.target.value)}
                className={inputCls}
              >
                <option value="">Select a state</option>
                {INDIAN_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field id="note" label="Anything we should know? (optional)" error={fieldErrors.note}>
              <textarea
                id="note"
                rows={3}
                value={form.note}
                onChange={(e) => set("note")(e.target.value)}
                placeholder="Gift wrap, delivery timing, a message to the potter…"
                className={`${inputCls} rounded-2xl`}
              />
            </Field>
          </div>
        </div>

        <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
          We deliver across India. Every price already includes shipping — there is nothing
          added at the end.
        </p>
      </form>

      {/* ---- summary and payment ---- */}
      <aside className="lg:col-span-2 h-fit rounded-3xl border border-earth/15 bg-cream/50 p-6 md:p-8 lg:sticky lg:top-24">
        <h2 className="font-display text-2xl text-earth">
          {count} {count === 1 ? "piece" : "pieces"}
        </h2>

        <ul className="mt-5 space-y-4">
          {cart.map((item) => (
            <li key={item.slug} className="flex gap-3">
              {item.img ? (
                <img
                  src={item.img}
                  alt=""
                  aria-hidden="true"
                  className="h-16 w-14 shrink-0 rounded-lg bg-background object-contain p-1"
                />
              ) : (
                <div className="h-16 w-14 shrink-0 rounded-lg bg-earth/5" aria-hidden="true" />
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate font-display text-base text-earth">{item.name}</div>
                <div className="text-xs text-muted-foreground">Qty {item.qty}</div>
              </div>
              <div className="text-sm text-earth">{formatPaise(item.pricePaise * item.qty)}</div>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex items-baseline justify-between border-t border-earth/15 pt-5">
          <span className="text-xs tracking-[0.3em] uppercase text-muted-foreground">Total</span>
          <span className="font-display text-3xl text-earth">{formatPaise(totalPaise)}</span>
        </div>
        <p className="mt-1 text-right text-[11px] text-muted-foreground">
          Shipping included · confirmed again before payment
        </p>

        {error && (
          <p role="alert" className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}

        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={() => submit("gateway")}
            disabled={pending !== null}
            className="w-full inline-flex items-center justify-center bg-earth text-cream px-6 py-4 rounded-full text-xs tracking-widest uppercase hover:bg-clay transition-colors disabled:opacity-60"
          >
            {pending === "gateway" ? "Placing order…" : "Pay now"}
          </button>

          {codAvailable && (
            <button
              type="button"
              onClick={() => submit("cod")}
              disabled={pending !== null}
              className="w-full inline-flex items-center justify-center border border-earth/25 bg-background text-earth px-6 py-4 rounded-full text-xs tracking-widest uppercase hover:bg-earth hover:text-cream transition-colors disabled:opacity-60"
            >
              {pending === "cod" ? "Placing order…" : "Cash on delivery"}
            </button>
          )}

          <button
            type="button"
            onClick={() => submit("whatsapp")}
            disabled={pending !== null}
            className="w-full inline-flex items-center justify-center gap-2 border border-earth/25 bg-background text-earth px-6 py-4 rounded-full text-xs tracking-widest uppercase hover:bg-earth hover:text-cream transition-colors disabled:opacity-60"
          >
            {pending === "whatsapp" ? "Placing order…" : "Confirm on WhatsApp"}
          </button>
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
          {codAvailable
            ? `Cash on delivery is available for your PIN code (${COD_REGION_LABEL}).`
            : `Cash on delivery is available in ${COD_REGION_LABEL} — enter a PIN code there to see it.`}
        </p>

        <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
          Prices are re-checked against the catalogue when you place the order, so what you pay is
          always what the piece costs today.
        </p>
      </aside>
    </div>
  );
}
