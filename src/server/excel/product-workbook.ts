import writeXlsxFile, { type Sheet, type SheetData } from "write-excel-file/node";

import {
  COMPUTED_COLUMNS,
  NO,
  PRODUCT_COLUMNS,
  PRODUCT_STATUSES,
  FULFILMENT_MODES,
  YES,
  type SheetColumnSpec,
} from "./product-sheet";

/**
 * Builds the products workbook for both export and template download.
 *
 * Computed columns are visually distinguished — grey header, muted text — and
 * labelled "calculated" so it is obvious in Excel that editing them achieves
 * nothing. The real guarantee is server-side: the importer never reads them.
 */

const EDITABLE_HEADER_BG = "#4A2C17";
const EDITABLE_HEADER_FG = "#FFFFFF";
const COMPUTED_HEADER_BG = "#DED5C8";
const COMPUTED_HEADER_FG = "#6B6157";
const COMPUTED_CELL_BG = "#F4F0EA";

export interface ProductExportRecord {
  slug: string;
  name: string;
  sizeLabel: string;
  tag: string;
  note: string;
  description: string;
  story: string;
  categorySlug: string | null;
  status: string;
  fulfilmentMode: string;
  stockQty: number;
  trackInventory: boolean;
  mfgCostPaise: number;
  packingCostPaise: number;
  productLengthMm: number | null;
  productWidthMm: number | null;
  productHeightMm: number | null;
  packedWeightGrams: number | null;
  measurementsVerified: boolean;
  pricePaise: number;
  compareAtPaise: number | null;
  blendedShippingPaise: number | null;
  totalCostPaise: number | null;
  chargeableWeightGrams: number | null;
}

const PAISE = 100;
const MM_PER_CM = 10;
const GRAMS_PER_KG = 1000;

function valueFor(column: SheetColumnSpec, record: ProductExportRecord): string | number | null {
  switch (column.key) {
    case "slug":
      return record.slug;
    case "name":
      return record.name;
    case "sizeLabel":
      return record.sizeLabel;
    case "tag":
      return record.tag;
    case "note":
      return record.note;
    case "description":
      return record.description;
    case "story":
      return record.story;
    case "category":
      return record.categorySlug ?? "";
    case "status":
      return record.status;
    case "fulfilment":
      return record.fulfilmentMode;
    case "stockQty":
      return record.stockQty;
    case "trackInventory":
      return record.trackInventory ? YES : NO;
    case "mfgCostInr":
      return record.mfgCostPaise / PAISE;
    case "packingCostInr":
      return record.packingCostPaise / PAISE;
    case "lengthCm":
      return record.productLengthMm === null ? null : record.productLengthMm / MM_PER_CM;
    case "widthCm":
      return record.productWidthMm === null ? null : record.productWidthMm / MM_PER_CM;
    case "heightCm":
      return record.productHeightMm === null ? null : record.productHeightMm / MM_PER_CM;
    case "packedWeightGrams":
      return record.packedWeightGrams;
    case "measurementsVerified":
      return record.measurementsVerified ? YES : NO;
    case "priceInr":
      return record.pricePaise / PAISE;
    case "mrpInr":
      return record.compareAtPaise === null ? null : record.compareAtPaise / PAISE;
    case "freightInr":
      return record.blendedShippingPaise === null ? null : record.blendedShippingPaise / PAISE;
    case "totalCostInr":
      return record.totalCostPaise === null ? null : record.totalCostPaise / PAISE;
    case "chargeableKg":
      return record.chargeableWeightGrams === null
        ? null
        : record.chargeableWeightGrams / GRAMS_PER_KG;
    default:
      return null;
  }
}

function headerRow(): SheetData[number] {
  return PRODUCT_COLUMNS.map((column) => ({
    value: column.header,
    type: String,
    fontWeight: "bold" as const,
    backgroundColor: column.editable ? EDITABLE_HEADER_BG : COMPUTED_HEADER_BG,
    color: column.editable ? EDITABLE_HEADER_FG : COMPUTED_HEADER_FG,
    align: "left" as const,
    wrap: true,
  }));
}

function bodyRow(record: ProductExportRecord): SheetData[number] {
  return PRODUCT_COLUMNS.map((column) => {
    const value = valueFor(column, record);
    const numeric = column.kind === "number" && !["trackInventory", "measurementsVerified"].includes(column.key);

    // `undefined`, not `null`: write-excel-file treats undefined as an empty
    // cell, whereas null is not a valid cell value.
    return {
      value:
        value === null || value === "" ? undefined : numeric ? Number(value) : String(value),
      type: numeric ? Number : String,
      backgroundColor: column.editable ? undefined : COMPUTED_CELL_BG,
      color: column.editable ? undefined : COMPUTED_HEADER_FG,
    };
  });
}

function exampleRow(): SheetData[number] {
  return PRODUCT_COLUMNS.map((column) => ({
    value: column.editable ? column.example : undefined,
    type: typeof column.example === "number" && column.editable ? Number : String,
    color: "#9A9086",
    fontStyle: "italic" as const,
    backgroundColor: column.editable ? undefined : COMPUTED_CELL_BG,
  }));
}

/** Second sheet: what each column means, so the file explains itself. */
function guidanceSheet(categorySlugs: string[]): Sheet<Buffer> {
  const head = ["Column", "Required", "Editable on import", "What it means", "Example"].map(
    (label) => ({
      value: label,
      type: String,
      fontWeight: "bold" as const,
      backgroundColor: EDITABLE_HEADER_BG,
      color: EDITABLE_HEADER_FG,
    }),
  );

  const rows: SheetData = [
    head,
    ...PRODUCT_COLUMNS.map((column) => [
      { value: column.header, type: String, fontWeight: "bold" as const },
      { value: column.required ? "Yes" : "No", type: String },
      { value: column.editable ? "Yes" : "No — ignored", type: String },
      { value: column.help, type: String, wrap: true },
      { value: String(column.example), type: String },
    ]),
    [],
    [
      {
        value: "Notes",
        type: String,
        fontWeight: "bold" as const,
      },
    ],
    [
      {
        value:
          "Rows are matched on Slug. A slug that does not exist creates a new DRAFT product; " +
          "an existing slug is updated in place.",
        type: String,
        wrap: true,
      },
    ],
    [
      {
        value:
          "Columns marked 'calculated' are recomputed from the cost inputs and the active rate " +
          "card every time you save. Anything typed into them is discarded.",
        type: String,
        wrap: true,
      },
    ],
    [
      {
        value: `Valid categories: ${categorySlugs.join(", ") || "(none defined yet)"}`,
        type: String,
      },
    ],
    [{ value: `Valid statuses: ${PRODUCT_STATUSES.join(", ")}`, type: String }],
    [{ value: `Valid fulfilment modes: ${FULFILMENT_MODES.join(", ")}`, type: String }],
    [
      {
        value: "Column order does not matter — columns are matched by their header text.",
        type: String,
      },
    ],
  ];

  return {
    sheet: "How to use",
    data: rows,
    columns: [{ width: 26 }, { width: 11 }, { width: 20 }, { width: 70 }, { width: 24 }],
  };
}

function productsSheet(rows: SheetData): Sheet<Buffer> {
  return {
    sheet: "Products",
    data: rows,
    columns: PRODUCT_COLUMNS.map((column) => ({ width: column.width })),
  };
}

export async function buildProductExport(
  records: ProductExportRecord[],
  categorySlugs: string[],
): Promise<Buffer> {
  const data: SheetData = [headerRow(), ...records.map(bodyRow)];
  return writeXlsxFile([productsSheet(data), guidanceSheet(categorySlugs)]).toBuffer();
}

export async function buildProductTemplate(categorySlugs: string[]): Promise<Buffer> {
  // Header plus a single greyed example row, so the expected shape is obvious
  // without anyone having to read the guidance sheet first.
  const data: SheetData = [headerRow(), exampleRow()];
  return writeXlsxFile([productsSheet(data), guidanceSheet(categorySlugs)]).toBuffer();
}

/** Shared so the export and the computed-column count stay in step. */
export const COMPUTED_COLUMN_COUNT = COMPUTED_COLUMNS.length;
