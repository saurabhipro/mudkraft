import type { PricingAssumptions, ZoneRate } from "./types";

/**
 * Zone slab rates, Delhi origin, surface.
 *
 * ⚠️ Zone A is taken from kumbhaja_costing_1.xlsx and reproduces that sheet
 * exactly. Zones B–E are INDICATIVE Shiprocket surface figures, not your plan's
 * rate card. Replace them with your actual contracted slabs before these prices
 * go live — every SKU moves when they change.
 *
 * `weightBps` is the assumed share of national order volume per zone. It is an
 * assumption about your customer mix, not a measured fact. Revisit it once you
 * have real order data; the whole blend pivots on it.
 */
export const DEFAULT_ZONES: ZoneRate[] = [
  { code: "A", label: "Local — Delhi NCR", firstSlabPaise: 3_000, addlSlabPaise: 2_200, weightBps: 1_500 },
  { code: "B", label: "Regional — neighbouring states", firstSlabPaise: 3_600, addlSlabPaise: 2_800, weightBps: 2_000 },
  { code: "C", label: "Metro to metro", firstSlabPaise: 4_200, addlSlabPaise: 3_400, weightBps: 3_500 },
  { code: "D", label: "Rest of India", firstSlabPaise: 4_800, addlSlabPaise: 4_000, weightBps: 2_500 },
  { code: "E", label: "Special — J&K, North East, Andaman", firstSlabPaise: 6_200, addlSlabPaise: 5_200, weightBps: 500 },
];

export const DEFAULT_ASSUMPTIONS: PricingAssumptions = {
  volumetricDivisor: 5_000,
  packingPaddingMm: 50,
  shippingGstBps: 1_800,
  marginBps: 5_000,
  breakageBps: 800,
  breakageIncludesShipping: true,
  plannedDiscountBps: 3_000,
  roundToPaise: 1_000, // round up to the nearest ₹10
  zones: DEFAULT_ZONES,
};

/**
 * The workbook's own assumptions, used to prove our formula reproduces its
 * Zone A output before we trust it to produce national prices.
 */
export const SHEET_PARITY_ASSUMPTIONS: PricingAssumptions = {
  ...DEFAULT_ASSUMPTIONS,
  breakageIncludesShipping: false,
  zones: [{ ...DEFAULT_ZONES[0], weightBps: 10_000 }],
};
