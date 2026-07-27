import { eq } from "drizzle-orm";

import { db } from "../db";
import { pricingConfig } from "../db/schema/pricing";
import { DEFAULT_ASSUMPTIONS } from "./config";
import type { PricingAssumptions, ZoneRate } from "./types";

/**
 * Loads the active rate card from the database.
 *
 * Every code path that computes a price must use this rather than the
 * compiled-in defaults, or an admin could edit the rate card and find some SKUs
 * priced under the old rules and some under the new.
 */
export async function loadActiveAssumptions(): Promise<PricingAssumptions> {
  const row = await db.query.pricingConfig.findFirst({
    where: eq(pricingConfig.isActive, true),
  });
  if (!row) return DEFAULT_ASSUMPTIONS;

  return {
    volumetricDivisor: row.volumetricDivisor,
    packingPaddingMm: row.packingPaddingMm,
    shippingGstBps: row.shippingGstBps,
    marginBps: row.marginBps,
    breakageBps: row.breakageBps,
    breakageIncludesShipping: row.breakageIncludesShipping,
    plannedDiscountBps: row.plannedDiscountBps,
    roundToPaise: row.roundToPaise,
    zones: row.zones as ZoneRate[],
  };
}

export async function getActivePricingConfigId(): Promise<string | null> {
  const row = await db.query.pricingConfig.findFirst({
    where: eq(pricingConfig.isActive, true),
    columns: { id: true },
  });
  return row?.id ?? null;
}
