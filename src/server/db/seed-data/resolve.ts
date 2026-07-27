import type { CostInputs } from "../../pricing/types";
import { CATALOG, type CatalogEntry } from "./catalog";
import costing from "./costing.json";

const PAISE_PER_RUPEE = 100;

interface CostingRow {
  sourceRow: number;
  name: string;
  sizeLabel: string;
  mfgCostInr: number;
  packingCostInr: number;
  productLengthMm: number | null;
  productWidthMm: number | null;
  productHeightMm: number | null;
  packedWeightGrams: number | null;
  measurementsVerified: boolean;
  _sheetZoneAShippingInr: number | null;
  _sheetSalePriceInr: number | null;
}

const rowsBySourceRow = new Map<number, CostingRow>(
  (costing.products as CostingRow[]).map((row) => [row.sourceRow, row]),
);

export interface ResolvedProduct {
  entry: CatalogEntry;
  sizeLabel: string;
  costInputs: CostInputs;
  measurementsVerified: boolean;
  /** Present only for SKUs that came from the workbook; used for parity checks. */
  sheetZoneAShippingInr?: number;
  sheetSalePriceInr?: number;
}

/**
 * Joins the editorial catalog to the workbook's cost inputs and produces the
 * arguments the pricing formula needs. Throws rather than guessing: a SKU with
 * no usable cost basis must not be silently priced from zeros.
 */
export function resolveCatalog(): ResolvedProduct[] {
  return CATALOG.map((entry) => {
    if (entry.sourceRow !== undefined) {
      const row = rowsBySourceRow.get(entry.sourceRow);
      if (!row) {
        throw new Error(
          `Catalog entry "${entry.slug}" references costing row ${entry.sourceRow}, ` +
            `which is not in costing.json. Re-run scripts/import-costing.py.`,
        );
      }
      if (
        row.productLengthMm === null ||
        row.productWidthMm === null ||
        row.productHeightMm === null ||
        row.packedWeightGrams === null
      ) {
        throw new Error(
          `Costing row ${entry.sourceRow} ("${row.name}") is missing dimensions or ` +
            `weight. Freight is billed on volume, so it cannot be priced.`,
        );
      }

      return {
        entry,
        sizeLabel: row.sizeLabel,
        measurementsVerified: row.measurementsVerified,
        sheetZoneAShippingInr: row._sheetZoneAShippingInr ?? undefined,
        sheetSalePriceInr: row._sheetSalePriceInr ?? undefined,
        costInputs: {
          mfgCostPaise: Math.round(row.mfgCostInr * PAISE_PER_RUPEE),
          packingCostPaise: Math.round(row.packingCostInr * PAISE_PER_RUPEE),
          productLengthMm: row.productLengthMm,
          productWidthMm: row.productWidthMm,
          productHeightMm: row.productHeightMm,
          packedWeightGrams: row.packedWeightGrams,
          fulfilmentMode: entry.fulfilmentMode,
        },
      };
    }

    const estimated = entry.estimatedCost;
    if (!estimated) {
      throw new Error(
        `Catalog entry "${entry.slug}" has neither a sourceRow nor estimatedCost. ` +
          `Every product needs a cost basis.`,
      );
    }

    return {
      entry,
      sizeLabel: entry.tag.split("·").pop()?.trim() ?? "",
      // Scaled from another row, never measured.
      measurementsVerified: false,
      costInputs: {
        mfgCostPaise: Math.round(estimated.mfgCostInr * PAISE_PER_RUPEE),
        packingCostPaise: Math.round(estimated.packingCostInr * PAISE_PER_RUPEE),
        productLengthMm: estimated.productLengthMm,
        productWidthMm: estimated.productWidthMm,
        productHeightMm: estimated.productHeightMm,
        packedWeightGrams: estimated.packedWeightGrams,
        fulfilmentMode: entry.fulfilmentMode,
      },
    };
  });
}
