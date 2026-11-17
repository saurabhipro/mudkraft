import { formatPaise } from "@/lib/money";
import { POLICY } from "@/lib/policy";

/**
 * How the shop charges for delivery, as set in Bikriup › Your shops › Delivery. The feed, the
 * product schema and every page that states the delivery promise read it, so Google and the
 * buyer are never told two different things.
 *
 * - included: prices already carry delivery ("one price" in Bikriup); nothing is added at checkout.
 * - per_pin:  the courier's rate for the PIN code and weight, added at checkout (Shiprocket).
 * - flat:     a fixed fee per order, free above a threshold when one is set.
 */
export type DeliveryTerms =
  | { mode: "included" }
  | { mode: "per_pin" }
  | { mode: "flat"; feePaise: number; freeAbovePaise: number };

/** Used whenever Bikriup cannot be asked: it never promises a delivery price that may be wrong. */
export const DEFAULT_DELIVERY: DeliveryTerms = { mode: "per_pin" };

/** The delivery promise in one sentence, without a closing full stop (callers add their own). */
export function deliveryText(terms: DeliveryTerms): string {
  switch (terms.mode) {
    case "included":
      return "Doorstep delivery across India, included in the price — nothing is added at checkout";
    case "flat":
      return `Doorstep delivery across India for ${formatPaise(terms.feePaise)} per order${
        terms.freeAbovePaise > 0 ? `, free on orders above ${formatPaise(terms.freeAbovePaise)}` : ""
      }`;
    default:
      return POLICY.delivery;
  }
}

/**
 * Copy written against `POLICY.delivery` (FAQ answers, page text) with the live wording swapped in.
 * The written copy keeps reading naturally, and only this one sentence follows Bikriup.
 */
export function withDelivery(text: string, terms: DeliveryTerms): string {
  return text.replaceAll(POLICY.delivery, deliveryText(terms));
}
