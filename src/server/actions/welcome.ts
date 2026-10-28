"use server";

import { unstable_cache } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { toProductView } from "@/lib/product-view";

import { BikriupError, bikriup, bikriupEnabled } from "../bikriup";
import { getActiveProducts } from "../store/products";

/**
 * The welcome popup: a visitor's name, mobile and email go into Bikriup's customers
 * book (the same one the studio bills from), and they get the shop's welcome code.
 * The offer and the code are set in Bikriup › Website & API › Welcome offer.
 */

export type WelcomeOffer = {
  percent: number;
  once: boolean;
  /** Three pieces for the popup's plinth: one per product type, photographed. */
  pieces: Array<{ src: string; cutout: boolean; name: string }>;
} | null;

const readOffer = unstable_cache(
  async () => (await bikriup<{ welcome?: { percent: number; once: boolean } | null }>("/shop")).welcome ?? null,
  ["bikriup-welcome-offer"],
  { revalidate: 600 },
);

/** Whether there is an offer to show; the popup stays away when there is none. */
export async function getWelcomeOffer(): Promise<WelcomeOffer> {
  if (!bikriupEnabled()) return null;
  try {
    const offer = await readOffer();
    if (!offer) return null;
    const seen = new Set<string>();
    const pieces: NonNullable<WelcomeOffer>["pieces"] = [];
    for (const p of (await getActiveProducts()).map(toProductView)) {
      const type = (p.tag || p.name).toLowerCase();
      const src = p.cutout ?? p.img;
      if (!src || seen.has(type) || p.stockQty <= 0) continue;
      seen.add(type);
      pieces.push({ src, cutout: Boolean(p.cutout), name: p.name });
      if (pieces.length === 3) break;
    }
    return { ...offer, pieces };
  } catch (error) {
    console.error("[bikriup] welcome offer unavailable:", error);
    return null;
  }
}

const joinSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  phone: z
    .string()
    .transform((v) => v.replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, ""))
    .refine((v) => /^[6-9]\d{9}$/.test(v), "Enter a 10-digit mobile number"),
  email: z.union([z.literal(""), z.string().trim().toLowerCase().email("That email doesn't look right").max(80)]),
  optIn: z.boolean().default(false),
  /** Honeypot: people never see this field, bots fill it. */
  website: z.string().max(200).default(""),
});

export type JoinResult =
  | { ok: true; code: string | null; percent: number; alreadyUsed: boolean }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export async function joinWelcome(input: unknown): Promise<JoinResult> {
  if (!bikriupEnabled()) return { ok: false, error: "Signups are closed just now." };
  const parsed = joinSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { ok: false, error: "Please check the highlighted fields.", fieldErrors };
  }
  const d = parsed.data;
  try {
    const out = await bikriup<{ coupon: { code: string; percent: number } | null; coupon_used: boolean }>(
      "/customers",
      {
        method: "POST",
        body: { name: d.name, phone: d.phone, email: d.email, opt_in: d.optIn, website: d.website },
        forwardedFor: (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim(),
      },
    );
    return { ok: true, code: out.coupon?.code ?? null, percent: out.coupon?.percent ?? 0, alreadyUsed: out.coupon_used };
  } catch (error) {
    if (error instanceof BikriupError && error.status === 429) {
      return { ok: false, error: "Too many tries from here. Please try again in a while." };
    }
    if (error instanceof BikriupError && error.status < 500) return { ok: false, error: error.message };
    console.error("[bikriup] welcome signup failed:", error);
    return { ok: false, error: "We couldn't save that just now. Please try again in a minute." };
  }
}

const couponSchema = z.object({
  code: z.string().trim().min(1).max(40),
  phone: z.string().max(20).default(""),
  items: z
    .array(z.object({ slug: z.string().trim().min(1).max(200), qty: z.coerce.number().int().min(1).max(50) }))
    .min(1)
    .max(50),
});

export type CouponResult =
  | { ok: true; code: string; discountPaise: number; totalPaise: number }
  | { ok: false; error: string };

/** Checkout's "Apply": Bikriup prices the basket with the code (and checks it against the number). */
export async function checkCoupon(input: unknown): Promise<CouponResult> {
  if (!bikriupEnabled()) return { ok: false, error: "Codes can't be used just now." };
  const parsed = couponSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Enter a code." };
  const d = parsed.data;
  try {
    const q = await bikriup<{ discount: number; total: number; coupon: string }>("/quote", {
      method: "POST",
      body: { items: d.items, coupon: d.code, phone: d.phone.replace(/\D/g, "").slice(-10) },
    });
    return {
      ok: true,
      code: q.coupon,
      discountPaise: Math.round(q.discount * 100),
      totalPaise: Math.round(q.total * 100),
    };
  } catch (error) {
    if (error instanceof BikriupError && error.status < 500) return { ok: false, error: error.message };
    console.error("[bikriup] coupon check failed:", error);
    return { ok: false, error: "We couldn't check that code just now." };
  }
}
