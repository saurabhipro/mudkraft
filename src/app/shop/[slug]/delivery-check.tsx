"use client";

import { useState } from "react";

import { formatPaise } from "@/lib/money";
import { checkDelivery } from "@/server/actions/delivery";

/** "Will it reach me, when, for how much?" Hidden until Bikriup says the shop has live rates. */
export function DeliveryCheck({ slug }: { slug: string }) {
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ text: string; bad: boolean } | null>(null);

  const check = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const out = await checkDelivery(slug, pin).catch(() => ({ mode: "flat" as const }));
    setBusy(false);
    if (out.mode === "flat") {
      setNote({ text: "We deliver to your doorstep across India.", bad: false });
    } else if (!out.serviceable) {
      setNote({ text: out.message, bad: true });
    } else {
      setNote({
        text: `${out.eta ? `Arrives by ${out.eta} · ` : ""}${out.onePrice ? "delivery included" : `delivery ${formatPaise(out.deliveryPaise)}`} · ${out.cod ? "cash on delivery available" : "pay online only"}`,
        bad: false,
      });
    }
  };

  return (
    <form onSubmit={check} className="mt-4">
      <label
        htmlFor="delivery-pin"
        className="block text-[11px] tracking-[0.3em] uppercase text-earth/70"
      >
        Check delivery to your door
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id="delivery-pin"
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={6}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          placeholder="Your PIN code"
          className="min-h-[52px] min-w-0 flex-1 rounded-[3px] border border-gold/60 bg-ivory px-4 py-2.5 text-earth placeholder:text-earth/45 focus:outline-none focus:ring-2 focus:ring-gold/50"
        />
        <button
          type="submit"
          disabled={busy || pin.length !== 6}
          className="shrink-0 rounded-[3px] border-[1.5px] border-earth px-6 font-display text-sm font-semibold tracking-[0.26em] uppercase text-earth hover:bg-earth hover:text-gold-light transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-earth"
        >
          {busy ? "Checking…" : "Check"}
        </button>
      </div>
      {note && (
        <p
          role={note.bad ? "alert" : undefined}
          className={`mt-2 text-sm ${note.bad ? "text-red-800" : "text-earth"}`}
        >
          {note.text}
        </p>
      )}
    </form>
  );
}
