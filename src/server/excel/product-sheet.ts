/**
 * The one definition of the product spreadsheet.
 *
 * Export, template and import all read this list, so the three can never drift
 * out of step — add a column here and all three pick it up.
 *
 * Columns are either EDITABLE or COMPUTED. Computed columns are written into
 * the export and the template for context, and are ignored entirely on import:
 * price is derived from the cost inputs and the active rate card, so accepting
 * a price typed into Excel would produce a number the pricing engine silently
 * overwrites on the next re-price.
 */

export const YES = "YES";
export const NO = "NO";

export const PRODUCT_STATUSES = ["draft", "active", "archived"] as const;
export const FULFILMENT_MODES = [
  "ship_nationwide",
  "local_delivery_only",
  "pickup_only",
] as const;

export type ColumnKind = "text" | "longText" | "number" | "yesno" | "enum";

export interface SheetColumnSpec {
  key: string;
  header: string;
  width: number;
  editable: boolean;
  required?: boolean;
  kind: ColumnKind;
  enumValues?: readonly string[];
  /** Shown in the template's guidance sheet. */
  help: string;
  example: string | number;
}

export const PRODUCT_COLUMNS: SheetColumnSpec[] = [
  {
    key: "slug",
    header: "Slug *",
    width: 22,
    editable: true,
    required: true,
    kind: "text",
    help: "Unique URL identifier. Matching is done on this. Lowercase letters, numbers and hyphens only.",
    example: "handi-2-5l",
  },
  {
    key: "name",
    header: "Name *",
    width: 20,
    editable: true,
    required: true,
    kind: "text",
    help: "Product name shown to customers.",
    example: "Handi",
  },
  {
    key: "sizeLabel",
    header: "Size label",
    width: 14,
    editable: true,
    kind: "text",
    help: 'Shown next to the name, e.g. "2.5 L" or "750 g".',
    example: "2.5 L",
  },
  {
    key: "tag",
    header: "Tag",
    width: 22,
    editable: true,
    kind: "text",
    help: 'Short qualifier on the product card, e.g. "Cookware · 2.5 L".',
    example: "Cookware · 2.5 L",
  },
  {
    key: "note",
    header: "Note",
    width: 28,
    editable: true,
    kind: "text",
    help: "One evocative line used on listing cards.",
    example: "Dal that tastes of the earth",
  },
  {
    key: "description",
    header: "Description",
    width: 45,
    editable: true,
    kind: "longText",
    help: "Main product copy.",
    example: "A lidded cooking handi for dals and slow curries.",
  },
  {
    key: "story",
    header: "Story",
    width: 45,
    editable: true,
    kind: "longText",
    help: "Secondary narrative paragraph.",
    example: "Season it before its first meal; it darkens with use.",
  },
  {
    key: "category",
    header: "Category",
    width: 14,
    editable: true,
    kind: "text",
    help: "Category slug: water, tea, cookware or serveware. Leave blank for none.",
    example: "cookware",
  },
  {
    key: "status",
    header: "Status",
    width: 12,
    editable: true,
    kind: "enum",
    enumValues: PRODUCT_STATUSES,
    help: "draft, active or archived. Only active products appear on the storefront.",
    example: "active",
  },
  {
    key: "fulfilment",
    header: "Fulfilment",
    width: 22,
    editable: true,
    kind: "enum",
    enumValues: FULFILMENT_MODES,
    help: "ship_nationwide, local_delivery_only or pickup_only. Affects the freight built into the price.",
    example: "ship_nationwide",
  },
  {
    key: "stockQty",
    header: "Stock qty",
    width: 11,
    editable: true,
    kind: "number",
    help: "Whole number, 0 or more.",
    example: 12,
  },
  {
    key: "trackInventory",
    header: "Track inventory",
    width: 15,
    editable: true,
    kind: "yesno",
    help: "YES or NO.",
    example: YES,
  },
  {
    key: "mfgCostInr",
    header: "Mfg cost (₹)",
    width: 13,
    editable: true,
    kind: "number",
    help: "What the piece costs you to make, in rupees.",
    example: 350,
  },
  {
    key: "packingCostInr",
    header: "Packing cost (₹)",
    width: 15,
    editable: true,
    kind: "number",
    help: "Packing material cost per unit, in rupees.",
    example: 100,
  },
  {
    key: "lengthCm",
    header: "Length (cm)",
    width: 12,
    editable: true,
    kind: "number",
    help: "Product dimension, not the box. Cushioning is added automatically.",
    example: 20,
  },
  {
    key: "widthCm",
    header: "Width (cm)",
    width: 12,
    editable: true,
    kind: "number",
    help: "Product dimension, not the box.",
    example: 20,
  },
  {
    key: "heightCm",
    header: "Height (cm)",
    width: 12,
    editable: true,
    kind: "number",
    help: "Product dimension, not the box.",
    example: 16,
  },
  {
    key: "packedWeightGrams",
    header: "Packed weight (g)",
    width: 16,
    editable: true,
    kind: "number",
    help: "Actual weight of the packed unit in grams.",
    example: 2600,
  },
  {
    key: "measurementsVerified",
    header: "Measurements verified",
    width: 20,
    editable: true,
    kind: "yesno",
    help: "YES only once a real packed unit has been weighed and measured.",
    example: NO,
  },

  // ---- computed: written for context, ignored on import ----
  {
    key: "priceInr",
    header: "Price (₹) — calculated",
    width: 20,
    editable: false,
    kind: "number",
    help: "Derived from the cost inputs and the active rate card. Edits here are ignored.",
    example: 1390,
  },
  {
    key: "mrpInr",
    header: "MRP (₹) — calculated",
    width: 20,
    editable: false,
    kind: "number",
    help: "Derived. Edits here are ignored.",
    example: 1990,
  },
  {
    key: "freightInr",
    header: "Freight (₹) — calculated",
    width: 22,
    editable: false,
    kind: "number",
    help: "Blended nationwide freight. Derived. Edits here are ignored.",
    example: 404,
  },
  {
    key: "totalCostInr",
    header: "Total cost (₹) — calculated",
    width: 24,
    editable: false,
    kind: "number",
    help: "Goods + freight + breakage. Derived. Edits here are ignored.",
    example: 922,
  },
  {
    key: "chargeableKg",
    header: "Chargeable kg — calculated",
    width: 24,
    editable: false,
    kind: "number",
    help: "Billable weight couriers charge on. Derived. Edits here are ignored.",
    example: 5,
  },
];

export const EDITABLE_COLUMNS = PRODUCT_COLUMNS.filter((column) => column.editable);
export const COMPUTED_COLUMNS = PRODUCT_COLUMNS.filter((column) => !column.editable);

/** Header text -> spec, for tolerant lookup when a sheet's columns are reordered. */
export const COLUMN_BY_HEADER = new Map(
  PRODUCT_COLUMNS.map((column) => [normaliseHeader(column.header), column]),
);

export function normaliseHeader(header: string): string {
  return header
    .toLowerCase()
    .replace(/\*/g, "")
    .replace(/—.*$/, "")
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

// --------------------------------------------------------------------- parsing

export interface ParsedProductRow {
  slug: string;
  name: string;
  sizeLabel: string;
  tag: string;
  note: string;
  description: string;
  story: string;
  category: string | null;
  status: (typeof PRODUCT_STATUSES)[number];
  fulfilment: (typeof FULFILMENT_MODES)[number];
  stockQty: number;
  trackInventory: boolean;
  mfgCostInr: number;
  packingCostInr: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  packedWeightGrams: number;
  measurementsVerified: boolean;
}

export interface RowIssue {
  /** 1-based row number as shown in Excel, so the message points at a real row. */
  row: number;
  column?: string;
  message: string;
}

export function parseYesNo(raw: unknown): boolean | null {
  if (typeof raw === "boolean") return raw;
  const text = String(raw ?? "").trim().toLowerCase();
  if (["yes", "y", "true", "1"].includes(text)) return true;
  if (["no", "n", "false", "0"].includes(text)) return false;
  return null;
}

export function parseNumber(raw: unknown): number | null {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  const text = String(raw ?? "").trim().replace(/[₹,\s]/g, "");
  if (text === "") return null;
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

export function cellText(raw: unknown): string {
  if (raw === null || raw === undefined) return "";
  if (raw instanceof Date) return raw.toISOString();
  return String(raw).trim();
}
