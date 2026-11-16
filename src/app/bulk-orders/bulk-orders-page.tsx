"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Field, inputCls } from "@/components/form-bits";
import { BROCHURE } from "@/lib/catalogue";
import { WHATSAPP_NUMBER, whatsappLink } from "@/lib/whatsapp";
import { sendTradeEnquiry, type TradeEnquiryInput } from "@/server/actions/enquiries";

/** One piece the buyer can add to a bulk list (built on the server from the live catalogue). */
export interface PickerItem {
  slug: string;
  name: string;
  sizeLabel: string;
  code: string;
  category: string;
  img: string | null;
}

interface Line {
  key: string;
  slug: string;
  code: string;
  name: string;
  img: string | null;
  qty: number;
}

type Kind = "bulk" | "custom";

const BUDGETS = ["Not sure yet", "Under ₹25,000", "₹25,000 – ₹1,00,000", "Over ₹1,00,000"];
const USES = ["Cookware", "Tea & drinkware", "Serveware", "Décor", "Something else"];
const FINISHES = ["Smoke-black", "Smoked brown", "Polished", "Not sure"];
const MAX_PICTURES = 3;

const labelOf = (i: { name: string; sizeLabel?: string }) =>
  [i.name, i.sizeLabel].filter(Boolean).join(" · ");
const clampQty = (n: number) =>
  Math.max(1, Math.min(100000, Math.round(Number.isFinite(n) ? n : 1)));

/** A reference picture made small enough to send: at most 1600 px, JPEG. */
async function shrinkPicture(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.82);
}

export function BulkOrdersPage({
  items,
  initialKind,
  startSlug,
}: {
  items: PickerItem[];
  initialKind: Kind;
  startSlug: string;
}) {
  const [kind, setKind] = useState<Kind>(initialKind);
  const [lines, setLines] = useState<Line[]>(() => {
    const p = items.find((i) => i.slug === startSlug);
    return p
      ? [{ key: p.slug, slug: p.slug, code: p.code, name: labelOf(p), img: p.img, qty: 10 }]
      : [];
  });
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    business: "",
    gstin: "",
    city: "",
    pincode: "",
    neededBy: "",
    budget: BUDGETS[0],
    message: "",
    useCase: USES[0],
    size: "",
    qty: "",
    finish: FINISHES[0],
    website: "",
  });
  const [pictures, setPictures] = useState<Array<{ name: string; data: string }>>([]);
  const [picErr, setPicErr] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");
  const errorRef = useRef<HTMLParagraphElement>(null);

  // The tab is part of the address, so a shared link opens the right form.
  useEffect(() => {
    const url = new window.URL(window.location.href);
    if (kind === "custom") url.searchParams.set("type", "custom");
    else url.searchParams.delete("type");
    window.history.replaceState(null, "", url);
  }, [kind]);

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm({ ...form, [k]: e.target.value });

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const have = new Set(lines.map((l) => l.key));
    return items
      .filter(
        (i) =>
          !have.has(i.slug) &&
          `${i.name} ${i.sizeLabel} ${i.code} ${i.category}`.toLowerCase().includes(q),
      )
      .slice(0, 6);
  }, [query, items, lines]);

  const addItem = (p: PickerItem) => {
    setLines([
      ...lines,
      { key: p.slug, slug: p.slug, code: p.code, name: labelOf(p), img: p.img, qty: 10 },
    ]);
    setQuery("");
  };
  // A piece from the printed catalogue that isn't on the website yet: kept as typed.
  const addTyped = () => {
    const t = query.trim();
    if (!t) return;
    const isCode = /^[A-Z]{1,6}[-/]?[A-Z0-9-]*\d{2,}$/i.test(t);
    setLines([
      ...lines,
      {
        key: `typed:${t.toLowerCase()}`,
        slug: "",
        code: isCode ? t.toUpperCase() : "",
        name: isCode ? "" : t,
        img: null,
        qty: 10,
      },
    ]);
    setQuery("");
  };
  const setQty = (key: string, qty: number) =>
    setLines(lines.map((l) => (l.key === key ? { ...l, qty: clampQty(qty) } : l)));
  const remove = (key: string) => setLines(lines.filter((l) => l.key !== key));
  const pieces = lines.reduce((n, l) => n + l.qty, 0);

  async function addPictures(files: FileList | null) {
    setPicErr("");
    if (!files?.length) return;
    const room = MAX_PICTURES - pictures.length;
    const next = [...pictures];
    for (const file of Array.from(files).slice(0, room)) {
      try {
        next.push({ name: file.name, data: await shrinkPicture(file) });
      } catch {
        setPicErr(`${file.name} couldn't be read. Use a JPG or PNG photo.`);
      }
    }
    if (files.length > room)
      setPicErr(`Up to ${MAX_PICTURES} pictures. Send more on WhatsApp after this.`);
    setPictures(next);
  }

  function whatsappHref() {
    const head =
      kind === "bulk"
        ? "Namaste Mudkraft! A bulk order enquiry:"
        : "Namaste Mudkraft! I'd like a custom piece made:";
    const body =
      kind === "bulk"
        ? lines.map((l) => `• ${l.code ? `${l.code} ` : ""}${l.name} × ${l.qty}`)
        : [
            form.message,
            `For: ${form.useCase} · Size: ${form.size || "—"} · Quantity: ${form.qty || "—"} · Finish: ${form.finish}`,
          ];
    return whatsappLink(
      [
        head,
        ...body,
        [form.city, form.pincode].filter(Boolean).length
          ? `Delivery: ${[form.city, form.pincode].filter(Boolean).join(" ")}`
          : "",
        form.neededBy ? `Needed by: ${form.neededBy}` : "",
        form.name ? `— ${form.name}${form.business ? `, ${form.business}` : ""}` : "",
      ].filter(Boolean),
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (kind === "bulk" && !lines.length) {
      setError("Add at least one piece to your list.");
      return;
    }
    if (kind === "custom" && !form.message.trim()) {
      setError("Tell us a little about the piece you have in mind.");
      return;
    }
    setStatus("sending");
    const input: TradeEnquiryInput = {
      kind,
      name: form.name,
      phone: form.phone,
      email: form.email,
      business: form.business,
      gstin: form.gstin,
      city: form.city,
      pincode: form.pincode,
      neededBy: form.neededBy,
      budget: form.budget === BUDGETS[0] ? "" : form.budget,
      message: form.message,
      website: form.website,
      items:
        kind === "bulk"
          ? lines.map((l) => ({ slug: l.slug, code: l.code, name: l.name, qty: l.qty }))
          : [],
      useCase: form.useCase,
      size: form.size,
      qty: Number(form.qty) || 0,
      finish: form.finish,
      pictures: kind === "custom" ? pictures.map((p) => p.data) : [],
    };
    try {
      const r = await sendTradeEnquiry(input);
      if (r.ok) {
        setStatus("sent");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setStatus("idle");
        setError(r.error);
      }
    } catch {
      setStatus("idle");
      setError("We couldn't send this just now. Please send it on WhatsApp instead.");
    }
  }

  const tab = (k: Kind, label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={kind === k}
      onClick={() => {
        setKind(k);
        setError("");
      }}
      className={`px-6 py-3 rounded-full text-xs tracking-[0.14em] uppercase transition-colors ${kind === k ? "bg-earth text-cream" : "text-earth hover:bg-cream/70"}`}
    >
      {label}
    </button>
  );

  const card = "bg-cream/70 backdrop-blur border border-border rounded-[1.5rem] p-6 md:p-8";
  const legend = "px-2 font-display text-2xl md:text-[1.75rem] text-earth";

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SiteHeader
        rightSlot={
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center text-xs tracking-widest uppercase bg-earth text-cream px-5 py-2.5 rounded-full hover:bg-clay transition-colors"
          >
            WhatsApp
          </a>
        }
      />

      <section className="pt-32 md:pt-40 pb-10 px-6 md:px-10 max-w-6xl mx-auto">
        <p className="text-xs tracking-[0.4em] uppercase text-clay mb-5">
          {kind === "bulk" ? "— for cafés, hotels, gifting & resellers" : "— made to your brief"}
        </p>
        <h1 className="font-display text-[clamp(2.75rem,6vw,4.75rem)] leading-none text-earth text-balance">
          Bulk &amp; <em className="text-clay">custom</em> orders
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          {kind === "bulk"
            ? "Pick pieces from the collection and tell us how many. Quote the item code from our catalogue if you have it. We'll share prices and sizes."
            : "A size we don't list, a shape for your menu, your logo pressed into the clay. Tell us what you have in mind and add a sketch or a photo."}
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <div
            role="tablist"
            aria-label="Enquiry type"
            className="inline-flex gap-1 p-1 rounded-full bg-sand"
          >
            {tab("bulk", "Bulk order")}
            {tab("custom", "Custom piece")}
          </div>
          <a
            href={BROCHURE.href}
            download={BROCHURE.fileName}
            className="text-sm text-earth underline underline-offset-4 decoration-clay/40 hover:decoration-clay"
          >
            Download the catalogue (PDF)
          </a>
        </div>
      </section>

      {status === "sent" ? (
        <section className="px-6 md:px-10 pb-24 max-w-6xl mx-auto">
          <div className={`${card} flex flex-col items-start gap-4`} role="status">
            <p className="text-xs tracking-[0.4em] uppercase text-clay">— enquiry sent</p>
            <h2 className="font-display text-4xl md:text-5xl text-earth">
              {kind === "bulk"
                ? "Thank you. Your list is with the studio."
                : "Thank you. Your brief is with the studio."}
            </h2>
            <p className="text-muted-foreground">
              {kind === "bulk"
                ? `${lines.length} piece${lines.length === 1 ? "" : "s"}, ${pieces} in total. `
                : ""}
              We&apos;ll reply on your mobile or email with prices and sizes.
            </p>
            <div className="flex flex-wrap gap-3 mt-2">
              <a
                href={whatsappHref()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center bg-[#1f8a4c] text-white px-6 py-3.5 rounded-full text-xs tracking-[0.14em] uppercase hover:opacity-90"
              >
                Also send on WhatsApp
              </a>
              <button
                type="button"
                onClick={() => {
                  setStatus("idle");
                  setLines([]);
                  setPictures([]);
                  setForm({ ...form, message: "", size: "", qty: "" });
                }}
                className="inline-flex items-center border border-earth text-earth px-6 py-3.5 rounded-full text-xs tracking-[0.14em] uppercase hover:bg-earth hover:text-cream transition-colors"
              >
                Start another
              </button>
            </div>
          </div>
        </section>
      ) : (
        <form
          onSubmit={submit}
          className="px-6 md:px-10 pb-24 max-w-6xl mx-auto flex flex-wrap items-start gap-7"
          noValidate
        >
          <div className="flex-[999_1_560px] min-w-0 flex flex-col gap-7">
            {kind === "bulk" ? (
              <fieldset className={`${card} relative z-20 flex flex-col gap-4`}>
                <legend className={legend}>1 · What do you need?</legend>
                <div className="relative">
                  <Field label="Add a piece">
                    <input
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key !== "Enter") return;
                        e.preventDefault();
                        if (matches[0]) addItem(matches[0]);
                        else addTyped();
                      }}
                      className={inputCls}
                      placeholder="Search by name or item code, e.g. MK-BP-101"
                      aria-describedby="pick-hint"
                      autoComplete="off"
                    />
                  </Field>
                  {query.trim() && (
                    <ul className="absolute z-10 left-0 right-0 mt-2 p-1.5 rounded-2xl border border-border bg-cream shadow-[var(--shadow-soft)]">
                      {matches.map((m) => (
                        <li key={m.slug}>
                          <button
                            type="button"
                            onClick={() => addItem(m)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-sand"
                          >
                            {m.img ? (
                              <img
                                src={m.img}
                                alt=""
                                className="w-10 h-10 object-contain rounded-lg bg-sand"
                              />
                            ) : (
                              <span className="w-10 h-10 rounded-lg bg-sand" />
                            )}
                            <span className="flex-1 min-w-0 text-earth">{labelOf(m)}</span>
                            {m.code && (
                              <span className="text-[11px] px-2.5 py-1 rounded-full bg-earth text-cream">
                                {m.code}
                              </span>
                            )}
                          </button>
                        </li>
                      ))}
                      <li>
                        <button
                          type="button"
                          onClick={addTyped}
                          className="w-full px-3 py-2.5 rounded-xl text-left text-sm text-clay-deep hover:bg-sand"
                        >
                          Add &ldquo;{query.trim()}&rdquo; as typed
                          {matches.length
                            ? ""
                            : " (not on the website yet: we'll match it to our catalogue)"}
                        </button>
                      </li>
                    </ul>
                  )}
                </div>
                <p id="pick-hint" className="text-sm text-muted-foreground -mt-1">
                  Not sure of a size or capacity? Add it anyway and mention it in the notes.
                </p>
                {lines.length > 0 && (
                  <ul className="flex flex-col gap-2.5">
                    {lines.map((l) => (
                      <li
                        key={l.key}
                        className="flex flex-wrap items-center gap-4 p-3 rounded-2xl border border-border bg-cream"
                      >
                        {l.img ? (
                          <img
                            src={l.img}
                            alt=""
                            className="w-16 h-16 object-contain rounded-xl bg-sand"
                          />
                        ) : (
                          <span className="w-16 h-16 rounded-xl bg-sand" aria-hidden="true" />
                        )}
                        <div className="flex-[1_1_180px] min-w-0">
                          <div className="text-earth font-medium">{l.name || l.code}</div>
                          {l.code && l.name && (
                            <span className="inline-block mt-1 text-[11px] px-2.5 py-0.5 rounded-full bg-earth text-cream">
                              {l.code}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            aria-label={`Fewer ${l.name || l.code}`}
                            onClick={() => setQty(l.key, l.qty - 1)}
                            className="w-10 h-10 rounded-full border border-border text-earth text-lg hover:bg-sand"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            inputMode="numeric"
                            min={1}
                            aria-label={`Quantity of ${l.name || l.code}`}
                            value={l.qty}
                            onChange={(e) => setQty(l.key, Number(e.target.value))}
                            className={`${inputCls.replace("w-full ", "")} w-20 text-center px-2 py-2`}
                          />
                          <button
                            type="button"
                            aria-label={`More ${l.name || l.code}`}
                            onClick={() => setQty(l.key, l.qty + 1)}
                            className="w-10 h-10 rounded-full border border-border text-earth text-lg hover:bg-sand"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          aria-label={`Remove ${l.name || l.code}`}
                          onClick={() => remove(l.key)}
                          className="p-2 text-muted-foreground hover:text-clay-deep"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            aria-hidden="true"
                          >
                            <path d="M6 6l12 12M18 6L6 18" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </fieldset>
            ) : (
              <fieldset className={`${card} flex flex-col gap-5`}>
                <legend className={legend}>1 · The piece</legend>
                <Chips
                  label="What is it for?"
                  options={USES}
                  value={form.useCase}
                  onChange={(v) => setForm({ ...form, useCase: v })}
                />
                <Field label="Describe it">
                  <textarea
                    rows={5}
                    value={form.message}
                    onChange={set("message")}
                    className={inputCls}
                    placeholder="Shape, use, capacity, any branding or a logo, how it will be served…"
                  />
                </Field>
                <div className="grid sm:grid-cols-3 gap-5">
                  <Field label="Size or capacity">
                    <input
                      value={form.size}
                      onChange={set("size")}
                      className={inputCls}
                      placeholder="e.g. 2 L, or 24 cm across"
                    />
                  </Field>
                  <Field label="Quantity">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      value={form.qty}
                      onChange={set("qty")}
                      className={inputCls}
                      placeholder="e.g. 50"
                    />
                  </Field>
                  <Field label="Budget per piece" hint="(optional)">
                    <input
                      value={form.budget === BUDGETS[0] ? "" : form.budget}
                      onChange={set("budget")}
                      className={inputCls}
                      placeholder="₹"
                    />
                  </Field>
                </div>
                <Chips
                  label="Finish"
                  options={FINISHES}
                  value={form.finish}
                  onChange={(v) => setForm({ ...form, finish: v })}
                />
                <div>
                  <span className="text-[11px] tracking-[0.3em] uppercase text-clay">
                    Reference pictures{" "}
                    <span className="normal-case tracking-normal text-muted-foreground">
                      (up to {MAX_PICTURES} · sketches or photos)
                    </span>
                  </span>
                  <div className="mt-2 grid grid-cols-3 gap-3">
                    {pictures.map((p, i) => (
                      <div
                        key={i}
                        className="relative aspect-square rounded-2xl overflow-hidden bg-sand"
                      >
                        <img
                          src={p.data}
                          alt={`Reference ${i + 1}: ${p.name}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          aria-label={`Remove ${p.name}`}
                          onClick={() => setPictures(pictures.filter((_, j) => j !== i))}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-cream text-earth shadow"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {pictures.length < MAX_PICTURES && (
                      <label className="relative aspect-square rounded-2xl border-[1.5px] border-dashed border-border flex flex-col items-center justify-center gap-2 text-sm text-clay-deep cursor-pointer hover:bg-cream/60 focus-within:border-clay">
                        <svg
                          viewBox="0 0 24 24"
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          aria-hidden="true"
                        >
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                        Add picture
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          multiple
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) => {
                            void addPictures(e.target.files);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    )}
                  </div>
                  <p
                    className="mt-2 text-xs text-muted-foreground"
                    role={picErr ? "alert" : undefined}
                  >
                    {picErr || "Pictures are made smaller on your device before sending."}
                  </p>
                </div>
              </fieldset>
            )}

            <fieldset className={`${card} grid sm:grid-cols-2 gap-5`}>
              <legend className={legend}>2 · Delivery &amp; business</legend>
              <Field label="Business name" hint="(optional)">
                <input
                  value={form.business}
                  onChange={set("business")}
                  className={inputCls}
                  placeholder="Café, hotel or company"
                  autoComplete="organization"
                />
              </Field>
              <Field label="GSTIN" hint="(optional, for a GST invoice)">
                <input
                  value={form.gstin}
                  onChange={set("gstin")}
                  className={`${inputCls} uppercase`}
                  maxLength={15}
                />
              </Field>
              <Field label="City">
                <input
                  value={form.city}
                  onChange={set("city")}
                  className={inputCls}
                  autoComplete="address-level2"
                />
              </Field>
              <Field label="Delivery PIN code">
                <input
                  value={form.pincode}
                  onChange={set("pincode")}
                  className={inputCls}
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6 digits"
                  autoComplete="postal-code"
                />
              </Field>
              <Field label="Needed by">
                <input
                  type="date"
                  value={form.neededBy}
                  onChange={set("neededBy")}
                  className={inputCls}
                />
              </Field>
              {kind === "bulk" && (
                <Field label="Budget">
                  <select value={form.budget} onChange={set("budget")} className={inputCls}>
                    {BUDGETS.map((b) => (
                      <option key={b}>{b}</option>
                    ))}
                  </select>
                </Field>
              )}
            </fieldset>

            <fieldset className={`${card} grid sm:grid-cols-2 gap-5`}>
              <legend className={legend}>3 · How do we reach you?</legend>
              <Field label="Your name">
                <input
                  required
                  value={form.name}
                  onChange={set("name")}
                  className={inputCls}
                  autoComplete="name"
                />
              </Field>
              <Field label="Mobile / WhatsApp">
                <input
                  type="tel"
                  value={form.phone}
                  onChange={set("phone")}
                  className={inputCls}
                  autoComplete="tel"
                  placeholder="10-digit mobile"
                />
              </Field>
              <Field label="Email" hint="(mobile or email is enough)" className="sm:col-span-2">
                <input
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  className={inputCls}
                  autoComplete="email"
                />
              </Field>
              {kind === "bulk" && (
                <Field label="Notes" className="sm:col-span-2">
                  <textarea
                    rows={4}
                    value={form.message}
                    onChange={set("message")}
                    className={inputCls}
                    placeholder="Sizes, finish, branding, packing, anything else"
                  />
                </Field>
              )}
              {/* Left empty by people; bots fill it in. */}
              <div aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
                <label>
                  Website
                  <input
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.website}
                    onChange={set("website")}
                  />
                </label>
              </div>
            </fieldset>
          </div>

          <aside
            aria-label={kind === "bulk" ? "Your list" : "How custom orders work"}
            className="flex-[1_1_300px] min-w-0 md:sticky md:top-28 bg-earth text-cream rounded-[1.5rem] p-7 md:p-8 flex flex-col gap-5"
          >
            {kind === "bulk" ? (
              <>
                <p className="text-xs tracking-[0.4em] uppercase text-gold">— your list</p>
                <div className="flex gap-8">
                  <div>
                    <div className="font-display text-6xl leading-none">{lines.length}</div>
                    <div className="text-sm opacity-80">pieces</div>
                  </div>
                  <div>
                    <div className="font-display text-6xl leading-none">{pieces}</div>
                    <div className="text-sm opacity-80">in total</div>
                  </div>
                </div>
                {lines.length > 0 && (
                  <ul className="flex flex-col gap-2 text-sm border-t border-cream/20 pt-4">
                    {lines.map((l) => (
                      <li key={l.key} className="flex justify-between gap-3">
                        <span className="min-w-0">{l.name || l.code}</span>
                        <span className="opacity-80 shrink-0">× {l.qty}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-sm leading-relaxed opacity-80">
                  No payment now. We&apos;ll come back with prices and sizes for these pieces.
                </p>
              </>
            ) : (
              <>
                <p className="text-xs tracking-[0.4em] uppercase text-gold">— how it works</p>
                <ol className="flex flex-col gap-4">
                  {[
                    "You send the brief and any pictures.",
                    "We reply with a price, a timeline and a sample if needed.",
                    "Once you approve, each piece is shaped and smoke-fired by hand.",
                    "Packed and shipped to your door.",
                  ].map((t, i) => (
                    <li key={t} className="flex gap-3.5">
                      <span className="font-display text-3xl leading-none text-gold">{i + 1}</span>
                      <span className="text-[15px] leading-relaxed">{t}</span>
                    </li>
                  ))}
                </ol>
              </>
            )}
            {error && (
              <p
                ref={errorRef}
                tabIndex={-1}
                role="alert"
                className="rounded-xl bg-cream/10 px-4 py-3 text-sm text-cream outline-none"
              >
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={status === "sending"}
              className="bg-cream text-earth py-4 rounded-full text-xs font-semibold tracking-[0.16em] uppercase hover:bg-gold transition-colors disabled:opacity-60"
            >
              {status === "sending" ? "Sending…" : kind === "bulk" ? "Send enquiry" : "Send brief"}
            </button>
            <a
              href={whatsappHref()}
              target="_blank"
              rel="noopener noreferrer"
              className="text-center text-sm text-cream underline underline-offset-4 decoration-cream/40 hover:decoration-cream"
            >
              or continue on WhatsApp
            </a>
          </aside>
        </form>
      )}

      <SiteFooter />
    </div>
  );
}

function Chips({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <fieldset>
      <legend className="text-[11px] tracking-[0.3em] uppercase text-clay">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            aria-pressed={value === o}
            onClick={() => onChange(o)}
            className={`px-4 py-2.5 rounded-full border text-sm transition-colors ${value === o ? "bg-earth border-earth text-cream" : "border-border bg-cream text-earth hover:bg-sand"}`}
          >
            {o}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
