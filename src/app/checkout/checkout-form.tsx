"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { clearCart, removeItem, syncStock, updateQty, useCart } from "@/lib/cart";
import { toItem, track } from "@/lib/analytics";
import { formatPaise } from "@/lib/money";
import { COD_EVERYWHERE, COD_REGION_LABEL, isCodEligible } from "@/lib/serviceability";
import { cartStock } from "@/server/actions/cart";
import { placeOrder, type CheckoutMethod } from "@/server/actions/checkout";
import { deliveryQuote, type DeliveryQuote } from "@/server/actions/delivery";
import { checkCoupon } from "@/server/actions/welcome";
import { readWelcome } from "@/lib/welcome";

const inputCls =
  "mt-2 w-full rounded-2xl border border-earth/40 bg-background px-4 py-3 text-earth " +
  "placeholder:text-earth/40 focus:outline-none focus:ring-2 focus:ring-earth/40";

const labelCls = "block text-xs tracking-widest uppercase text-earth/70";

/** States and union territories, so the shipping address stays consistent. */
const INDIAN_STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
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

/** "Nov 12, 2026" → "Thu, 12 Nov"; anything unreadable stays as it came. */
function niceDate(raw: string): string {
  const d = new Date(raw);
  if (!raw || Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

/** Parcels leave the studio the next working day (Sundays off). */
function nextWorkingDay(): string {
  const d = new Date(Date.now() + 864e5);
  if (d.getDay() === 0) d.setDate(d.getDate() + 1);
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

/** "Delhivery Surface 5kg" → "Delhivery Surface": the weight slab means nothing to a buyer. */
function courierName(raw: string): string {
  return raw.replace(/\s*\d+(\.\d+)?\s*kgs?$/i, "").trim();
}

const stepCls =
  "inline-grid h-8 w-8 shrink-0 place-items-center rounded-full bg-earth text-sm font-semibold text-cream";

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

  // Stock may have run out since a piece went into the basket: check once on arrival.
  const slugs = cart.map((item) => item.slug).join(",");
  useEffect(() => {
    if (!hydrated || !slugs) return;
    cartStock(slugs.split(","))
      .then(syncStock)
      .catch(() => {});
  }, [hydrated, slugs]);
  const soldOut = cart.filter((item) => item.max === 0);

  // One begin_checkout per visit to this page, once the basket has loaded.
  const [began, setBegan] = useState(false);
  useEffect(() => {
    if (!hydrated || began || cart.length === 0) return;
    setBegan(true);
    track("begin_checkout", {
      currency: "INR",
      value: cart.reduce((sum, i) => sum + i.pricePaise * i.qty, 0) / 100,
      items: cart.map((i) => toItem(i, i.qty)),
    });
  }, [hydrated, began, cart]);

  // A note is specific to the order being placed, so it never carries over.
  const [form, setForm] = useState({ ...defaults, note: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<CheckoutMethod | null>(null);

  // Signed up in the welcome popup: fill what is still empty, and bring the code along.
  const [welcomeCode, setWelcomeCode] = useState("");
  useEffect(() => {
    const w = readWelcome();
    if (!w) return;
    const t = window.setTimeout(() => {
      setForm((f) => ({
        ...f,
        name: f.name || w.name,
        phone: f.phone || w.phone,
        email: f.email || w.email,
      }));
      if (w.code) setWelcomeCode(w.code);
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  const subtotalPaise = cart.reduce((sum, item) => sum + item.pricePaise * item.qty, 0);

  // A code is priced by Bikriup for this exact basket; a changed basket drops the figure.
  const basketKey = cart.map((item) => `${item.slug}:${item.qty}`).join(",");
  const [codeInput, setCodeInput] = useState("");
  const [coupon, setCoupon] = useState<{
    code: string;
    discountPaise: number;
    totalPaise: number;
    basket: string;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const applied = coupon && coupon.basket === basketKey ? coupon : null;
  const totalPaise = applied ? applied.totalPaise : subtotalPaise;

  const applyCode = async (code: string) => {
    if (!code.trim() || cart.length === 0) return;
    setChecking(true);
    setCouponError(null);
    const basket = basketKey;
    const result = await checkCoupon({
      code,
      phone: form.phone,
      items: cart.map((item) => ({ slug: item.slug, qty: item.qty })),
    }).catch(() => ({ ok: false as const, error: "We couldn't check that code just now." }));
    setChecking(false);
    if (!result.ok) {
      setCoupon(null);
      setCouponError(result.error);
      return;
    }
    setCodeInput(result.code);
    setCoupon({
      code: result.code,
      discountPaise: result.discountPaise,
      totalPaise: result.totalPaise,
      basket,
    });
  };

  // The popup's code goes in by itself once the basket is known (and again if it changes).
  useEffect(() => {
    if (!hydrated || !welcomeCode || !basketKey || applied || couponError) return;
    if (coupon && coupon.code !== welcomeCode) return;
    const code = coupon?.code ?? welcomeCode;
    const t = window.setTimeout(() => {
      setCodeInput((v) => v || code);
      void applyCode(code);
    }, 0);
    return () => window.clearTimeout(t);
    // applyCode reads the latest basket and phone itself
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, welcomeCode, basketKey, applied, couponError]);

  // Step 1 asks for the PIN code first. Shops on live courier rates price delivery for it; while a
  // shop is still on flat delivery (or testing), checkout keeps saying shipping is included.
  const [delivery, setDelivery] = useState<DeliveryQuote>({ mode: "flat" });
  const [priced, setPriced] = useState(false);
  const autoFilled = useRef({ city: "", state: "" });
  const [moved, setMoved] = useState("");
  const pin = form.postalCode.trim();
  const pinReady = /^[1-9]\d{5}$/.test(pin);
  const pricingKey = `${basketKey}|${pin}|${applied?.code ?? ""}`;
  useEffect(() => {
    if (!hydrated || !basketKey) return;
    let stale = false;
    const t = window.setTimeout(async () => {
      const next = await deliveryQuote({
        items: cart.map((item) => ({ slug: item.slug, qty: item.qty })),
        pincode: pin,
        coupon: applied?.code ?? "",
        phone: form.phone,
      }).catch((): DeliveryQuote => ({ mode: "flat" }));
      if (stale) return;
      setPriced(true);
      // City and state come with the PIN code. Empty fields are filled, and so are fields we filled
      // for an earlier PIN; anything the buyer typed stays.
      const place = next.place;
      if (place) {
        const state =
          INDIAN_STATES.find(
            (s) => s.toLowerCase() === place.state.toLowerCase().replace(/\s*&\s*/g, " and "),
          ) ?? "";
        // Compared with what we filled last time; read now, as the updater runs later.
        const prev = autoFilled.current;
        setForm((f) => ({
          ...f,
          city: !f.city || f.city === prev.city ? place.city : f.city,
          state: !f.state || f.state === prev.state ? state || f.state : f.state,
        }));
        autoFilled.current = { city: place.city, state };
      }
      setDelivery((was) => {
        const before = was.mode === "live" && was.serviceable ? was : null;
        const after = next.mode === "live" && next.serviceable ? next : null;
        // Only a real change is called out; the first price simply appears in step 1.
        setMoved(
          before && after && before.deliveryPaise !== after.deliveryPaise
            ? `Delivery changed: ${formatPaise(before.deliveryPaise)} → ${formatPaise(after.deliveryPaise)}` +
                (before.from !== after.from
                  ? ` — your PIN code ships from ${after.from} instead.`
                  : ".")
            : "",
        );
        return next;
      });
    }, 350);
    return () => {
      stale = true;
      window.clearTimeout(t);
    };
    // The key holds everything priced; cart and form are read at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, pricingKey]);
  const live = delivery.mode === "live" ? delivery : null;
  const ready = live?.serviceable ? live : null;
  const canDeliver = !live || live.serviceable === true;
  // One price: delivery and cash on delivery ride on each piece's price, so neither gets a line.
  const one = Boolean(live?.onePrice);

  // Purely presentational — `placeOrder` re-checks the PIN before accepting COD.
  const codAvailable = live
    ? live.serviceable === true && live.cod.available
    : COD_EVERYWHERE || isCodEligible(form.postalCode);
  const [payBy, setPayBy] = useState<"gateway" | "cod">("gateway");
  const cod = payBy === "cod" && codAvailable;
  const grandPaise = ready ? (cod ? ready.cod.totalPaise : ready.totalPaise) : totalPaise;
  const arrives = ready ? niceDate(ready.eta) : "";
  const leaves = ready && arrives ? nextWorkingDay() : "";

  const submit = async (method: CheckoutMethod) => {
    setError(null);
    setFieldErrors({});
    setPending(method);
    track("add_payment_info", { payment_type: method, currency: "INR" });

    const result = await placeOrder({
      ...form,
      coupon: applied?.code ?? "",
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
      result.method === "gateway"
        ? `/checkout/pay/${result.token}`
        : `/checkout/done/${result.token}`,
    );
  };

  if (!hydrated) {
    return (
      <div className="rounded-3xl border-2 border-earth/30 bg-cream p-8 text-sm text-muted-foreground">
        Loading your basket…
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="rounded-3xl border-2 border-earth/30 bg-cream p-10 text-center">
        <div className="font-hand text-3xl text-clay">the basket waits, quietly</div>
        <p className="mt-3 text-sm text-muted-foreground">There is nothing to check out yet.</p>
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
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
      {/* ---- step 1: delivery to this PIN code, then step 2: details ---- */}
      <form
        className="lg:col-span-3 flex flex-col gap-6"
        onSubmit={(event) => event.preventDefault()}
        noValidate
      >
        <section className="rounded-3xl border-2 border-earth/30 bg-sand/60 p-6 md:p-8">
          <div className="flex items-center gap-3">
            <span className={stepCls}>1</span>
            <h2 className="font-display text-2xl text-earth">Check delivery to your door</h2>
          </div>
          <p className="mt-2 text-sm text-earth/80 md:pl-11">
            {live && one
              ? "Delivery is included in the price. Add your PIN code to see that we reach you, and when."
              : live
                ? "Delivery is charged at the courier's own rate for your PIN code and the parcel's weight. See it here, before anything else."
                : "Tell us where it's going. We deliver across India."}
          </p>
          <div className="mt-4 md:pl-11">
            <Field id="postalCode" label="PIN code" error={fieldErrors.postalCode}>
              <input
                id="postalCode"
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={6}
                value={form.postalCode}
                onChange={(e) => set("postalCode")(e.target.value.replace(/\D/g, ""))}
                placeholder="110001"
                className={`${inputCls} max-w-xs text-lg tracking-[0.15em]`}
              />
            </Field>

            {pinReady && !priced && <p className="mt-3 text-sm text-muted-foreground">Checking…</p>}

            {ready && (
              <div className="mt-5 grid gap-3 sm:grid-cols-3" aria-live="polite">
                <div className="rounded-2xl bg-cream px-4 py-3">
                  <div className={labelCls}>Arrives by</div>
                  <div className="mt-1 font-display text-2xl text-earth">
                    {arrives || "Confirmed on dispatch"}
                  </div>
                </div>
                <div className="rounded-2xl bg-cream px-4 py-3">
                  <div className={labelCls}>Delivery</div>
                  <div className="mt-1 font-display text-2xl text-earth">
                    {one ? "Included" : formatPaise(ready.deliveryPaise)}
                  </div>
                  <div className="text-xs text-earth/75">
                    {ready.cod.available
                      ? one
                        ? "Cash on delivery too, same price"
                        : `${formatPaise(ready.cod.deliveryPaise)} with cash on delivery`
                      : "Pay online for this PIN code"}
                  </div>
                </div>
                <div className="rounded-2xl bg-cream px-4 py-3">
                  <div className={labelCls}>Ships from</div>
                  <div className="mt-1 font-display text-2xl text-earth">
                    {ready.from || "Our studio"}
                  </div>
                  <div className="text-xs text-earth/75">
                    {ready.parcels.length > 1
                      ? `${ready.parcels.length} parcels`
                      : courierName(ready.parcels[0]?.courier ?? "") || "Tracked courier"}
                  </div>
                </div>
              </div>
            )}
            {ready && ready.parcels.length > 1 && (
              <p className="mt-3 text-sm text-earth/80">
                Your pieces are in different studios, so they come in {ready.parcels.length} parcels
                {one ? ` from ${ready.parcels.map((p) => p.from).join(" and ")}` : ""}
                {one
                  ? "."
                  : `: ${ready.parcels.map((p) => `${p.from} ${formatPaise(p.deliveryPaise)}`).join(" + ")}.`}
              </p>
            )}
            {moved && (
              <p
                aria-live="polite"
                className="mt-3 rounded-2xl border-[1.5px] border-clay bg-cream px-4 py-2.5 text-sm text-clay-deep"
              >
                {moved}
              </p>
            )}
            {live?.serviceable === false && (
              <p role="alert" className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">
                {live.error}
              </p>
            )}
            {!live && pinReady && priced && (
              <p className="mt-4 rounded-2xl bg-cream px-4 py-3 text-sm text-earth">
                We deliver to {pin}, right to your doorstep.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-3xl border-2 border-earth/30 bg-cream p-6 md:p-8">
          <div className="flex items-center gap-3">
            <span className={`${stepCls} ${live && !ready ? "bg-earth/45" : ""}`}>2</span>
            <h2 className="font-display text-2xl text-earth">Your details &amp; address</h2>
          </div>
          {signedIn && (
            <p className="mt-1 text-xs text-muted-foreground md:pl-11">
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
          <p className="mt-3 text-xs text-muted-foreground">
            {delivery.place ? "City and state were filled in from your PIN code." : "\u00a0"}
          </p>
        </section>
      </form>

      {/* ---- the order, how to pay, and the total ---- */}
      <aside className="lg:col-span-2 h-fit rounded-3xl border-2 border-earth/45 bg-cream p-6 md:p-8 shadow-[0_18px_40px_-24px_rgba(59,42,34,0.55)] lg:sticky lg:top-24">
        <h2 className="font-display text-2xl text-earth">Your order</h2>

        <ul className="mt-5 divide-y divide-earth/25 rounded-2xl border border-earth/30 bg-sand/60">
          {cart.map((item) => (
            <li key={item.slug} className="flex gap-4 p-4">
              {item.img ? (
                <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-[radial-gradient(circle_at_50%_40%,oklch(0.97_0.02_75),oklch(0.86_0.05_65))]">
                  <img
                    src={item.img}
                    alt={item.name}
                    className="h-full w-full object-contain p-1.5 mix-blend-multiply brightness-[1.06] contrast-[1.06]"
                  />
                </div>
              ) : (
                <div className="h-20 w-20 shrink-0 rounded-2xl bg-earth/10" aria-hidden="true" />
              )}
              <div className="min-w-0 flex-1">
                <div className="font-display text-lg leading-tight text-earth">{item.name}</div>
                {item.tag && <div className="mt-0.5 text-xs text-earth/75">{item.tag}</div>}
                <div className="mt-1 text-sm font-medium text-earth/85">
                  {formatPaise(item.pricePaise)} each
                </div>
                {item.max !== 0 && (
                  <div className="mt-2 flex items-center gap-3">
                    <div className="inline-flex items-center rounded-full border-2 border-earth/50 bg-background text-earth">
                      <button
                        type="button"
                        aria-label={`Fewer ${item.name}`}
                        onClick={() => updateQty(item.slug, -1)}
                        className="h-8 w-8 rounded-full text-lg leading-none hover:bg-earth hover:text-cream transition-colors"
                      >
                        −
                      </button>
                      <span
                        className="min-w-8 text-center text-sm font-semibold"
                        aria-live="polite"
                      >
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        aria-label={`More ${item.name}`}
                        onClick={() => updateQty(item.slug, 1)}
                        disabled={item.max !== undefined && item.qty >= item.max}
                        className="h-8 w-8 rounded-full text-lg leading-none hover:bg-earth hover:text-cream transition-colors disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-earth"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.slug)}
                      className="text-xs text-earth/75 underline underline-offset-2 hover:text-clay-deep"
                    >
                      Remove
                    </button>
                  </div>
                )}
                {item.max === 0 && (
                  <div className="mt-1 flex items-center gap-2 text-xs text-red-800">
                    Sold out
                    <button
                      type="button"
                      onClick={() => removeItem(item.slug)}
                      className="underline underline-offset-2 hover:text-clay-deep"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
              <div className="text-base font-semibold text-earth">
                {formatPaise(item.pricePaise * item.qty)}
              </div>
            </li>
          ))}
        </ul>

        {ready && arrives && (
          <ol
            className="mt-5 grid grid-cols-3 gap-1 text-center text-xs text-earth/75"
            aria-label="When it arrives"
          >
            <li className="border-t-[3px] border-clay pt-2">
              <b className="block text-earth">Today</b>Order placed
            </li>
            <li className="border-t-[3px] border-clay/40 pt-2">
              <b className="block text-earth">{leaves}</b>Leaves the studio
            </li>
            <li className="border-t-[3px] border-clay/40 pt-2">
              <b className="block text-earth">{arrives}</b>At your door
            </li>
          </ol>
        )}

        <form
          className="mt-6 border-t-2 border-earth/25 pt-5"
          onSubmit={(e) => {
            e.preventDefault();
            void applyCode(codeInput);
          }}
        >
          <label htmlFor="coupon" className={labelCls}>
            Welcome or offer code
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id="coupon"
              value={codeInput}
              onChange={(e) => {
                setCodeInput(e.target.value.toUpperCase());
                setCouponError(null);
              }}
              placeholder="WELCOME10"
              autoComplete="off"
              className="min-w-0 flex-1 rounded-2xl border border-earth/25 bg-background px-4 py-2.5 uppercase tracking-wider text-earth placeholder:normal-case placeholder:tracking-normal placeholder:text-earth/40 focus:outline-none focus:ring-2 focus:ring-earth/40"
            />
            {applied ? (
              <button
                type="button"
                onClick={() => {
                  setCoupon(null);
                  setCodeInput("");
                  setWelcomeCode("");
                }}
                className="shrink-0 rounded-full border border-earth/25 px-4 text-xs tracking-widest uppercase text-earth hover:bg-earth hover:text-cream transition-colors"
              >
                Remove
              </button>
            ) : (
              <button
                type="submit"
                disabled={checking || !codeInput.trim()}
                className="shrink-0 rounded-full bg-earth px-5 text-xs tracking-widest uppercase text-cream hover:bg-clay transition-colors disabled:opacity-50"
              >
                {checking ? "Checking…" : "Apply"}
              </button>
            )}
          </div>
          {couponError && (
            <p role="alert" className="mt-2 text-xs text-red-800">
              {couponError}
            </p>
          )}
        </form>

        <div
          className="mt-5 flex rounded-full bg-sand p-1"
          role="radiogroup"
          aria-label="How you pay"
        >
          {(
            [
              ["gateway", "Pay now"],
              ["cod", "Cash on delivery"],
            ] as const
          ).map(([id, label]) => {
            const on = (id === "cod") === cod;
            const off = id === "cod" && !codAvailable;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={on}
                disabled={off}
                onClick={() => setPayBy(id)}
                className={`flex-1 rounded-full px-3 py-2.5 text-xs tracking-widest uppercase transition-colors disabled:opacity-40 ${on ? "bg-earth text-cream" : "text-earth"}`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="mt-5 space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Pieces</span>
            <span>{formatPaise(subtotalPaise)}</span>
          </div>
          {applied && (
            <div className="flex justify-between text-clay-deep">
              <span>Code {applied.code}</span>
              <span>−{formatPaise(applied.discountPaise)}</span>
            </div>
          )}
          <div className="flex justify-between text-earth">
            <span>Delivery{ready ? ` to ${pin}` : ""}</span>
            <span className="font-medium">
              {one && live?.serviceable !== false
                ? "Included"
                : ready
                  ? formatPaise(ready.deliveryPaise)
                  : live
                    ? live.serviceable === false
                      ? "—"
                      : "Check your PIN code"
                    : "Included"}
            </span>
          </div>
          {ready && cod && !one && (
            <div className="flex justify-between text-earth">
              <span>Cash on delivery fee</span>
              <span className="font-medium">{formatPaise(ready.cod.feePaise)}</span>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-baseline justify-between border-t-2 border-earth/25 pt-5">
          <span className="text-xs tracking-[0.3em] uppercase text-muted-foreground">Total</span>
          <span className="font-display text-3xl text-earth">
            {live && !ready && !one
              ? `${formatPaise(totalPaise)} + delivery`
              : formatPaise(grandPaise)}
          </span>
        </div>
        <p className="mt-1 text-right text-[11px] text-muted-foreground">
          {one
            ? cod
              ? "Paid in cash to the courier · delivery included"
              : "Doorstep delivery included"
            : live && !ready
              ? "Delivery is added once we have your PIN code"
              : cod
                ? "Paid in cash to the courier"
                : live
                  ? "Paying now · delivery included"
                  : "Doorstep delivery"}
        </p>

        {soldOut.length > 0 && (
          <p role="alert" className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">
            {soldOut.length === 1 ? `${soldOut[0].name} has` : `${soldOut.length} pieces have`} sold
            out since you added {soldOut.length === 1 ? "it" : "them"}. Remove to continue.
          </p>
        )}

        {error && (
          <p role="alert" className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}

        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={() => submit(cod ? "cod" : "gateway")}
            disabled={pending !== null || soldOut.length > 0 || !canDeliver}
            className="w-full inline-flex items-center justify-center bg-earth text-cream px-6 py-4 rounded-full text-xs tracking-widest uppercase hover:bg-clay transition-colors disabled:opacity-60"
          >
            {pending === "gateway" || pending === "cod"
              ? "Placing order…"
              : live && !ready
                ? "Check delivery first"
                : cod
                  ? `Place order · pay ${formatPaise(grandPaise)} on delivery`
                  : `Pay now · ${formatPaise(grandPaise)}`}
          </button>

          <button
            type="button"
            onClick={() => submit("whatsapp")}
            disabled={pending !== null || soldOut.length > 0 || !canDeliver}
            className="w-full inline-flex items-center justify-center gap-2 border border-earth/25 bg-background text-earth px-6 py-4 rounded-full text-xs tracking-widest uppercase hover:bg-earth hover:text-cream transition-colors disabled:opacity-60"
          >
            {pending === "whatsapp" ? "Placing order…" : "Confirm on WhatsApp"}
          </button>
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
          {live
            ? ready
              ? ready.cod.available
                ? one
                  ? "Pay now or in cash when it arrives — the price is the same either way."
                  : `Cash on delivery costs ${formatPaise(ready.cod.feePaise)} more — the courier's fee for collecting cash. Delivery is their own rate, rounded up to the rupee; we add nothing on top.`
                : `Cash on delivery isn't offered at ${pin} — pay now or confirm on WhatsApp.`
              : "Add a PIN code we deliver to, and your payment options open up."
            : COD_EVERYWHERE
              ? "Pay later: pay cash on delivery when your order arrives."
              : codAvailable
                ? `Cash on delivery is available for your PIN code (${COD_REGION_LABEL}).`
                : `Cash on delivery is available in ${COD_REGION_LABEL} — enter a PIN code there to see it.`}
        </p>
      </aside>
    </div>
  );
}
