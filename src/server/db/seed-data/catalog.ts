import type { FulfilmentMode } from "@/server/pricing/types";

/**
 * Editorial layer over costing.json.
 *
 * costing.json holds only what the workbook measured. This file holds the
 * decisions a spreadsheet cannot express: URL slugs, category, whether a SKU
 * goes live, and how it ships. Keeping them apart means re-running the importer
 * never clobbers merchandising choices.
 */

export const CATEGORIES = [
  { slug: "water", name: "Water", sortOrder: 1 },
  { slug: "tea", name: "Tea", sortOrder: 2 },
  { slug: "cookware", name: "Cookware", sortOrder: 3 },
  { slug: "serveware", name: "Serveware", sortOrder: 4 },
] as const;

/**
 * Care guidance by product family. Generic but accurate for unglazed river
 * clay — deliberately not invented per-SKU prose. Product descriptions and
 * stories are intentionally left empty for the studio to write in the admin
 * panel rather than fabricated here.
 */
const CARE = {
  cookware: [
    "Season before the first cook — see our Care Guide.",
    "Warm the vessel gradually; never put cold clay onto a high flame.",
    "Wash by hand with a soft brush. No detergent.",
    "Air-dry completely before storing to prevent mustiness.",
  ],
  waterStorage: [
    "Rinse with plain water before first use — never soap.",
    "Soak overnight for the first two days to open the pores.",
    "Refill daily and wipe the outside with a dry cloth.",
  ],
  drinkware: [
    "Rinse with warm water — no detergent.",
    "Air-dry upside down between uses.",
    "Handle gently; unglazed clay chips at the rim.",
  ],
  serveware: [
    "Rinse before first use; no soaking needed.",
    "Best for cold or room-temperature service.",
    "Not intended for direct-flame cooking.",
  ],
} as const;

export interface CatalogEntry {
  /** Row in costing.json this maps to. Absent for SKUs not in the workbook. */
  sourceRow?: number;
  slug: string;
  name: string;
  categorySlug: (typeof CATEGORIES)[number]["slug"];
  tag: string;
  note: string;
  status: "draft" | "active";
  fulfilmentMode: FulfilmentMode;
  care: readonly string[];
  sortOrder: number;
  /**
   * Cost inputs for SKUs that are not in the workbook. Every value here is an
   * ESTIMATE derived from a workbook row, never a measurement.
   */
  estimatedCost?: {
    derivedFrom: string;
    mfgCostInr: number;
    packingCostInr: number;
    productLengthMm: number;
    productWidthMm: number;
    productHeightMm: number;
    packedWeightGrams: number;
  };
}

export const CATALOG: CatalogEntry[] = [
  // ---------------------------------------------------------------- cookware
  {
    sourceRow: 5,
    slug: "bhagona-4l",
    name: "Bhagona",
    categorySlug: "cookware",
    tag: "Cookware · 4 L",
    note: "Slow food, slower fire",
    status: "active",
    fulfilmentMode: "ship_nationwide",
    care: CARE.cookware,
    sortOrder: 1,
  },
  {
    sourceRow: 6,
    slug: "handi-2-5l",
    name: "Handi",
    categorySlug: "cookware",
    tag: "Cookware · 2.5 L",
    note: "Dal that tastes of the earth",
    status: "active",
    fulfilmentMode: "ship_nationwide",
    care: CARE.cookware,
    sortOrder: 2,
  },
  {
    sourceRow: 9,
    slug: "kadhai-3l",
    name: "Kadhai",
    categorySlug: "cookware",
    tag: "Cookware · 3 L",
    note: "Wide, shallow, patient",
    status: "active",
    fulfilmentMode: "ship_nationwide",
    care: CARE.cookware,
    sortOrder: 3,
  },
  {
    sourceRow: 14,
    slug: "roaster",
    name: "Roaster",
    categorySlug: "cookware",
    tag: "Cookware · Tawa",
    note: "For rotis with a kiln-warm edge",
    status: "active",
    fulfilmentMode: "ship_nationwide",
    care: CARE.cookware,
    sortOrder: 4,
  },

  // --------------------------------------------------------------- serveware
  {
    sourceRow: 7,
    slug: "jug-1-5l",
    name: "Jug",
    categorySlug: "serveware",
    tag: "Serveware · 1.5 L",
    note: "Water that remembers the river",
    status: "active",
    fulfilmentMode: "ship_nationwide",
    care: CARE.serveware,
    sortOrder: 5,
  },
  {
    sourceRow: 15,
    slug: "dahi-handi-1-5l",
    name: "Dahi Handi",
    categorySlug: "serveware",
    tag: "Serveware · 1.5 L",
    note: "For curd set the old way",
    status: "active",
    fulfilmentMode: "ship_nationwide",
    care: CARE.serveware,
    sortOrder: 6,
  },
  {
    sourceRow: 16,
    slug: "dahi-handi-750g",
    name: "Dahi Handi",
    categorySlug: "serveware",
    tag: "Serveware · 750 g",
    note: "Little vessel, full ritual",
    status: "active",
    fulfilmentMode: "ship_nationwide",
    care: CARE.serveware,
    sortOrder: 7,
  },

  // ------------------------------------------------------------------- water
  // Water tanks ship as pickup-only: at 15–26 chargeable kg, national freight
  // alone exceeds what the entire piece can retail for. Excluding freight from
  // the price is what keeps these SKUs viable rather than theoretical.
  {
    sourceRow: 11,
    slug: "water-tank-10l",
    name: "Water Tank",
    categorySlug: "water",
    tag: "Water · 10 L · Studio pickup",
    note: "Cools water the ancient way",
    status: "active",
    fulfilmentMode: "pickup_only",
    care: CARE.waterStorage,
    sortOrder: 8,
  },
  {
    sourceRow: 12,
    slug: "water-tank-18l",
    name: "Water Tank",
    categorySlug: "water",
    tag: "Water · 18 L · Studio pickup",
    note: "A season's worth of cool water",
    status: "active",
    fulfilmentMode: "pickup_only",
    care: CARE.waterStorage,
    sortOrder: 9,
  },

  // --------------------------------------------------------------- drinkware
  // Seeded as draft. The workbook's own competitive analysis concludes this
  // category cannot be won on a per-piece basis against Mitticool and the
  // marketplace 6-packs. Live only once positioning is settled.
  {
    sourceRow: 8,
    slug: "water-bottle-1l",
    name: "Water Bottle",
    categorySlug: "water",
    tag: "Water · 1 L",
    note: "The river, bottled",
    status: "draft",
    fulfilmentMode: "ship_nationwide",
    care: CARE.waterStorage,
    sortOrder: 10,
  },
  {
    sourceRow: 10,
    slug: "cup-set-4",
    name: "Kulhad",
    categorySlug: "tea",
    tag: "Tea Cup · Set of 4",
    note: "For chai that tastes of earth",
    status: "draft",
    fulfilmentMode: "ship_nationwide",
    care: CARE.drinkware,
    sortOrder: 11,
  },
  {
    sourceRow: 13,
    slug: "glass",
    name: "Glass",
    categorySlug: "tea",
    tag: "Drinkware · Single",
    note: "A tumbler of cool earth",
    status: "draft",
    fulfilmentMode: "ship_nationwide",
    care: CARE.drinkware,
    sortOrder: 12,
  },

  // ------------------------------------------- derived set variants (NOT in
  // the workbook). Competitors sell kulhads in sixes; a per-piece price loses
  // a comparison it should never have been entered into. Every number below is
  // scaled from a workbook row, so these seed as draft with
  // measurementsVerified = false until a real set is packed and weighed.
  {
    slug: "cup-set-6",
    name: "Kulhad",
    categorySlug: "tea",
    tag: "Tea Cup · Set of 6",
    note: "Six cups, one ritual",
    status: "draft",
    fulfilmentMode: "ship_nationwide",
    care: CARE.drinkware,
    sortOrder: 13,
    estimatedCost: {
      derivedFrom: "Costing row 10 (Cup 4 pc set), scaled 4 → 6 pieces; box re-laid as 3×2",
      mfgCostInr: 83, // 55 / 4 × 6, rounded
      packingCostInr: 30,
      productLengthMm: 210,
      productWidthMm: 140,
      productHeightMm: 60,
      packedWeightGrams: 1200,
    },
  },
  {
    slug: "glass-set-6",
    name: "Glass",
    categorySlug: "tea",
    tag: "Drinkware · Set of 6",
    note: "A table's worth of clay",
    status: "draft",
    fulfilmentMode: "ship_nationwide",
    care: CARE.drinkware,
    sortOrder: 14,
    estimatedCost: {
      derivedFrom: "Costing row 13 (Glass, per piece), ×6; box re-laid as 3×2",
      mfgCostInr: 330, // 55 × 6
      packingCostInr: 60,
      productLengthMm: 240,
      productWidthMm: 160,
      productHeightMm: 100,
      packedWeightGrams: 2400,
    },
  },
];
