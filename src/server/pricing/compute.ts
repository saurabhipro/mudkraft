import { BPS, type CostInputs, type PriceBreakdown, type PricingAssumptions, type ZoneCode, type ZoneRate } from "./types";

const MM_PER_CM = 10;
const GRAMS_PER_KG = 1_000;
const SLAB_GRAMS = 500;
const PAISE_PER_RUPEE = 100;

/** Courier charges are quoted and billed in whole rupees. */
function roundToRupee(paise: number): number {
  return Math.round(paise / PAISE_PER_RUPEE) * PAISE_PER_RUPEE;
}

function ceilToMultiple(value: number, multiple: number): number {
  if (multiple <= 0) return value;
  return Math.ceil(value / multiple) * multiple;
}

export function assertZonesValid(zones: ZoneRate[]): void {
  if (zones.length === 0) {
    throw new Error("Pricing config must define at least one delivery zone.");
  }
  const total = zones.reduce((sum, z) => sum + z.weightBps, 0);
  if (total !== BPS) {
    throw new Error(
      `Zone volume weights must sum to ${BPS} bps (100%), got ${total}. ` +
        `Zones: ${zones.map((z) => `${z.code}=${z.weightBps}`).join(", ")}`,
    );
  }
}

/**
 * Billable weight is the greater of the volumetric weight of the packed box and
 * the actual weight rounded up to the next half kilo — which is how couriers
 * bill, and why a light-but-bulky pot costs more to ship than it weighs.
 */
export function volumetricWeightGrams(inputs: CostInputs, a: PricingAssumptions): number {
  const pad = 2 * a.packingPaddingMm;
  const l = (inputs.productLengthMm + pad) / MM_PER_CM;
  const b = (inputs.productWidthMm + pad) / MM_PER_CM;
  const h = (inputs.productHeightMm + pad) / MM_PER_CM;
  const kg = Math.ceil((l * b * h) / a.volumetricDivisor);
  return kg * GRAMS_PER_KG;
}

export function chargeableWeightGrams(inputs: CostInputs, a: PricingAssumptions): number {
  const actualRoundedUp = Math.ceil(inputs.packedWeightGrams / SLAB_GRAMS) * SLAB_GRAMS;
  return Math.max(volumetricWeightGrams(inputs, a), actualRoundedUp);
}

/** Freight for one zone at a given billable weight, GST included. */
export function zoneShippingPaise(grams: number, zone: ZoneRate, a: PricingAssumptions): number {
  const slabs = Math.ceil(grams / SLAB_GRAMS);
  const additionalSlabs = Math.max(0, slabs - 1);
  const beforeGst = zone.firstSlabPaise + additionalSlabs * zone.addlSlabPaise;
  return roundToRupee((beforeGst * (BPS + a.shippingGstBps)) / BPS);
}

/**
 * Which zones a product's freight is averaged over depends on how it ships.
 * A pickup-only product has no freight at all; pricing one as if it crossed the
 * country would make an otherwise viable SKU unsellable.
 */
function applicableZones(inputs: CostInputs, a: PricingAssumptions): ZoneRate[] {
  switch (inputs.fulfilmentMode) {
    case "pickup_only":
      return [];
    case "local_delivery_only": {
      const local = a.zones.find((z) => z.code === "A");
      return local ? [{ ...local, weightBps: BPS }] : [];
    }
    case "ship_nationwide":
      return a.zones;
  }
}

/**
 * The single nationwide freight figure: each zone's cost weighted by that
 * zone's assumed share of orders. This is the "interpolation" that turns a set
 * of zone-dependent costs into one price valid everywhere.
 */
export function blendedShippingPaise(inputs: CostInputs, a: PricingAssumptions): number {
  const zones = applicableZones(inputs, a);
  if (zones.length === 0) return 0;

  const grams = chargeableWeightGrams(inputs, a);
  const weightedTotal = zones.reduce(
    (sum, zone) => sum + zoneShippingPaise(grams, zone, a) * zone.weightBps,
    0,
  );
  return roundToRupee(weightedTotal / BPS);
}

export function computePrice(inputs: CostInputs, a: PricingAssumptions): PriceBreakdown {
  assertZonesValid(a.zones);

  const volumetric = volumetricWeightGrams(inputs, a);
  const chargeable = chargeableWeightGrams(inputs, a);
  const shipping = blendedShippingPaise(inputs, a);

  const zoneShipping: Partial<Record<ZoneCode, number>> = {};
  for (const zone of applicableZones(inputs, a)) {
    zoneShipping[zone.code] = zoneShippingPaise(chargeable, zone, a);
  }

  const goodsPaise = inputs.mfgCostPaise + inputs.packingCostPaise;
  const breakageBasis = a.breakageIncludesShipping ? goodsPaise + shipping : goodsPaise;
  const breakage = roundToRupee((breakageBasis * a.breakageBps) / BPS);

  const totalCost = goodsPaise + shipping + breakage;
  const margin = roundToRupee((totalCost * a.marginBps) / BPS);
  const rawPrice = totalCost + margin;
  const price = ceilToMultiple(rawPrice, a.roundToPaise);

  // MRP carries enough headroom that the planned discount lands back on `price`.
  const mrp = ceilToMultiple((price * BPS) / (BPS - a.plannedDiscountBps), a.roundToPaise);

  return {
    volumetricWeightGrams: volumetric,
    chargeableWeightGrams: chargeable,
    zoneShippingPaise: zoneShipping,
    blendedShippingPaise: shipping,
    breakageProvisionPaise: breakage,
    totalCostPaise: totalCost,
    marginPaise: margin,
    rawPricePaise: rawPrice,
    pricePaise: price,
    mrpPaise: mrp,
  };
}
