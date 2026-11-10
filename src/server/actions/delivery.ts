"use server";

import { z } from "zod";

import { BikriupError, bikriup, bikriupEnabled } from "../bikriup";

/**
 * The delivery charge for a basket and PIN code, from Bikriup, which asks the courier from the
 * nearest warehouse that has every piece. `mode: "flat"` means the shop isn't on live rates and
 * the checkout keeps its "shipping included" wording.
 */
/** City and state for the PIN code, when Bikriup knows them (to fill the address in). */
export type Place = { city: string; state: string } | null;

export type DeliveryQuote =
  | { mode: "flat"; place?: Place }
  | {
      mode: "live";
      place?: Place;
      /** No PIN code yet. */
      pending: boolean;
      serviceable: boolean | null;
      error: string;
      deliveryPaise: number;
      totalPaise: number;
      /** Courier rates couldn't be fetched; the shop's flat fee is in use. */
      fallback: boolean;
      eta: string;
      from: string;
      parcels: { from: string; deliveryPaise: number; courier: string }[];
      cod: { available: boolean; feePaise: number; deliveryPaise: number; totalPaise: number };
    };

const quoteSchema = z.object({
  items: z
    .array(
      z.object({ slug: z.string().trim().min(1).max(80), qty: z.number().int().min(1).max(50) }),
    )
    .min(1)
    .max(50),
  pincode: z.string().trim().max(6).default(""),
  coupon: z.string().trim().max(40).default(""),
  phone: z.string().trim().max(20).default(""),
});

const paise = (rupees: number | undefined) => Math.round((rupees ?? 0) * 100);

interface BkQuote {
  delivery_mode?: "live" | "flat";
  delivery: number;
  total: number;
  delivery_pending?: boolean;
  serviceable?: boolean | null;
  delivery_error?: string;
  fallback?: boolean;
  delivery_note?: {
    etd: string;
    from: string;
    parcels: { from: string; delivery: number; courier?: string }[];
  };
  place?: { city: string; state: string } | null;
  cod?: { available: boolean; fee: number; delivery: number; total: number };
}

export async function deliveryQuote(input: unknown): Promise<DeliveryQuote> {
  if (!bikriupEnabled()) return { mode: "flat" };
  const parsed = quoteSchema.safeParse(input);
  if (!parsed.success) return { mode: "flat" };
  const d = parsed.data;
  try {
    const q = await bikriup<BkQuote>("/quote", {
      method: "POST",
      body: {
        items: d.items,
        pincode: /^[1-9]\d{5}$/.test(d.pincode) ? d.pincode : "",
        ...(d.coupon ? { coupon: d.coupon, phone: d.phone.replace(/\D/g, "").slice(-10) } : {}),
      },
    });
    const place = q.place?.state ? { city: q.place.city, state: q.place.state } : null;
    if (q.delivery_mode !== "live") return { mode: "flat", place };
    return {
      mode: "live",
      place,
      pending: Boolean(q.delivery_pending),
      serviceable: q.serviceable ?? null,
      error: q.delivery_error ?? "",
      deliveryPaise: paise(q.delivery),
      totalPaise: paise(q.total),
      fallback: Boolean(q.fallback),
      eta: q.delivery_note?.etd ?? "",
      from: q.delivery_note?.from ?? "",
      parcels: (q.delivery_note?.parcels ?? []).map((p) => ({
        from: p.from,
        deliveryPaise: paise(p.delivery),
        courier: p.courier ?? "",
      })),
      cod: {
        available: Boolean(q.cod?.available),
        feePaise: paise(q.cod?.fee),
        deliveryPaise: paise(q.cod?.delivery),
        totalPaise: paise(q.cod?.total),
      },
    };
  } catch (error) {
    // A bad coupon or a sold-out piece is reported by the checkout's own checks.
    if (!(error instanceof BikriupError && error.status < 500))
      console.error("[bikriup] delivery quote failed:", error);
    return { mode: "flat" };
  }
}

export type DeliveryCheck =
  | { mode: "flat" }
  | {
      mode: "live";
      serviceable: boolean;
      message: string;
      deliveryPaise: number;
      eta: string;
      cod: boolean;
    };

/** The product page's PIN check, for one piece. */
export async function checkDelivery(slug: string, pincode: string): Promise<DeliveryCheck> {
  if (!bikriupEnabled()) return { mode: "flat" };
  if (!/^[1-9]\d{5}$/.test(String(pincode).trim())) {
    return {
      mode: "live",
      serviceable: false,
      message: "Enter a 6-digit PIN code.",
      deliveryPaise: 0,
      eta: "",
      cod: false,
    };
  }
  try {
    const out = await bikriup<{
      mode: "live" | "flat";
      serviceable?: boolean;
      message?: string;
      delivery?: number;
      etd?: string;
      cod?: boolean;
    }>("/delivery-check", {
      method: "POST",
      body: { slug: String(slug).slice(0, 80), pincode: String(pincode).trim() },
    });
    if (out.mode !== "live") return { mode: "flat" };
    return {
      mode: "live",
      serviceable: Boolean(out.serviceable),
      message: out.message ?? "",
      deliveryPaise: paise(out.delivery),
      eta: out.etd ?? "",
      cod: Boolean(out.cod),
    };
  } catch (error) {
    if (error instanceof BikriupError && error.status < 500) {
      return {
        mode: "live",
        serviceable: false,
        message: error.message,
        deliveryPaise: 0,
        eta: "",
        cod: false,
      };
    }
    console.error("[bikriup] delivery check failed:", error);
    return { mode: "flat" };
  }
}
