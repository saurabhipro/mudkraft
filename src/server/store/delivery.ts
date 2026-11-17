import { unstable_cache } from "next/cache";
import { cache } from "react";

import { DEFAULT_DELIVERY, type DeliveryTerms } from "@/lib/delivery";
import { rupeesToPaise } from "@/lib/money";

import { bikriup, bikriupEnabled } from "../bikriup";

type BkShop = { price_display?: "one" | "breakup"; delivery_fee?: number; free_delivery_above?: number };

/**
 * The shop's delivery terms from Bikriup's /shop. Bikriup reports a fee of 0 both for a courier-priced
 * (Shiprocket) shop and for one-price, so a zero fee without "one" is read as per PIN, never as free.
 */
async function readTerms(): Promise<DeliveryTerms> {
  if (!bikriupEnabled()) return DEFAULT_DELIVERY;
  try {
    const shop = await bikriup<BkShop>("/shop");
    if (shop.price_display === "one") return { mode: "included" };
    const fee = Number(shop.delivery_fee) || 0;
    if (fee > 0) {
      return { mode: "flat", feePaise: rupeesToPaise(fee), freeAbovePaise: rupeesToPaise(Number(shop.free_delivery_above) || 0) };
    }
    return { mode: "per_pin" };
  } catch (error) {
    console.error("[delivery] Bikriup /shop lookup failed; stating per-PIN delivery", error);
    return DEFAULT_DELIVERY;
  }
}

/** Ten minutes: a change in Bikriup's delivery settings reaches the site and the feed within that. */
export const getDeliveryTerms = cache(
  unstable_cache(readTerms, ["bikriup-delivery-terms"], { revalidate: 600 }),
);
