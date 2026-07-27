import readXlsxFile from "read-excel-file/node";

import {
  COLUMN_BY_HEADER,
  EDITABLE_COLUMNS,
  FULFILMENT_MODES,
  PRODUCT_STATUSES,
  cellText,
  normaliseHeader,
  parseNumber,
  parseYesNo,
  type ParsedProductRow,
  type RowIssue,
} from "./product-sheet";

/**
 * Parses an uploaded products workbook into validated rows plus per-row issues.
 *
 * Deliberately tolerant about shape and strict about content: columns are
 * matched by header text so reordering or deleting a column is fine, but a bad
 * value is reported against its exact Excel row and column rather than being
 * coerced into something plausible.
 *
 * Computed columns are never read, whatever the file contains.
 */

export interface ParseResult {
  rows: ParsedProductRow[];
  issues: RowIssue[];
  /** Headers present in the file that we did not recognise. */
  unknownHeaders: string[];
  totalDataRows: number;
}

const HEADER_ROW_INDEX = 0;
const FIRST_DATA_ROW_EXCEL_NUMBER = 2;

const DATA_SHEET_NAME = "products";

export async function parseProductWorkbook(input: Buffer): Promise<ParseResult> {
  // The template and the export both carry a second "How to use" sheet, so
  // select by name and only fall back to the first sheet for hand-made files.
  const workbook = await readXlsxFile(input);
  const target =
    workbook.find((s) => s.sheet.trim().toLowerCase() === DATA_SHEET_NAME) ?? workbook[0];
  const sheet = target?.data ?? [];

  if (sheet.length === 0) {
    return {
      rows: [],
      issues: [{ row: 1, message: "The sheet is empty." }],
      unknownHeaders: [],
      totalDataRows: 0,
    };
  }

  const headers = (sheet[HEADER_ROW_INDEX] ?? []).map((cell) => cellText(cell));
  const columnIndexByKey = new Map<string, number>();
  const unknownHeaders: string[] = [];

  headers.forEach((header, index) => {
    if (!header) return;
    const spec = COLUMN_BY_HEADER.get(normaliseHeader(header));
    if (!spec) {
      unknownHeaders.push(header);
      return;
    }
    // First occurrence wins, so a duplicated column cannot shadow the original.
    if (!columnIndexByKey.has(spec.key)) columnIndexByKey.set(spec.key, index);
  });

  const issues: RowIssue[] = [];

  for (const required of EDITABLE_COLUMNS.filter((column) => column.required)) {
    if (!columnIndexByKey.has(required.key)) {
      issues.push({
        row: 1,
        column: required.header,
        message: `Required column "${required.header}" is missing from the sheet.`,
      });
    }
  }
  if (issues.length > 0) {
    return { rows: [], issues, unknownHeaders, totalDataRows: 0 };
  }

  const rows: ParsedProductRow[] = [];
  const seenSlugs = new Map<string, number>();
  let totalDataRows = 0;

  for (let index = HEADER_ROW_INDEX + 1; index < sheet.length; index += 1) {
    const raw = sheet[index] ?? [];
    const excelRow = index + FIRST_DATA_ROW_EXCEL_NUMBER - 1;

    const read = (key: string): unknown => {
      const columnIndex = columnIndexByKey.get(key);
      return columnIndex === undefined ? undefined : raw[columnIndex];
    };

    // Skip rows that are entirely blank — trailing empties are normal in Excel.
    const hasAnyValue = [...columnIndexByKey.values()].some(
      (columnIndex) => cellText(raw[columnIndex]) !== "",
    );
    if (!hasAnyValue) continue;

    totalDataRows += 1;
    const rowIssues: RowIssue[] = [];

    const slug = cellText(read("slug")).toLowerCase();
    if (!slug) {
      rowIssues.push({ row: excelRow, column: "Slug", message: "Slug is required." });
    } else if (!/^[a-z0-9-]+$/.test(slug)) {
      rowIssues.push({
        row: excelRow,
        column: "Slug",
        message: `"${slug}" may only contain lowercase letters, numbers and hyphens.`,
      });
    } else if (seenSlugs.has(slug)) {
      rowIssues.push({
        row: excelRow,
        column: "Slug",
        message: `Duplicate of the slug already used on row ${seenSlugs.get(slug)}.`,
      });
    }

    const name = cellText(read("name"));
    if (!name) {
      rowIssues.push({ row: excelRow, column: "Name", message: "Name is required." });
    }

    const status = cellText(read("status")).toLowerCase() || "draft";
    if (!PRODUCT_STATUSES.includes(status as (typeof PRODUCT_STATUSES)[number])) {
      rowIssues.push({
        row: excelRow,
        column: "Status",
        message: `"${status}" is not one of ${PRODUCT_STATUSES.join(", ")}.`,
      });
    }

    const fulfilment = cellText(read("fulfilment")).toLowerCase() || "ship_nationwide";
    if (!FULFILMENT_MODES.includes(fulfilment as (typeof FULFILMENT_MODES)[number])) {
      rowIssues.push({
        row: excelRow,
        column: "Fulfilment",
        message: `"${fulfilment}" is not one of ${FULFILMENT_MODES.join(", ")}.`,
      });
    }

    const numericFields: Array<{
      key: string;
      column: string;
      min: number;
      required: boolean;
    }> = [
      { key: "mfgCostInr", column: "Mfg cost (₹)", min: 0, required: true },
      { key: "packingCostInr", column: "Packing cost (₹)", min: 0, required: true },
      { key: "lengthCm", column: "Length (cm)", min: 0.1, required: true },
      { key: "widthCm", column: "Width (cm)", min: 0.1, required: true },
      { key: "heightCm", column: "Height (cm)", min: 0.1, required: true },
      { key: "packedWeightGrams", column: "Packed weight (g)", min: 1, required: true },
      { key: "stockQty", column: "Stock qty", min: 0, required: false },
    ];

    const numbers: Record<string, number> = {};
    for (const field of numericFields) {
      const parsed = parseNumber(read(field.key));
      if (parsed === null) {
        if (field.required) {
          rowIssues.push({
            row: excelRow,
            column: field.column,
            message: "A number is required here.",
          });
        }
        numbers[field.key] = field.key === "stockQty" ? 0 : 0;
        continue;
      }
      if (parsed < field.min) {
        rowIssues.push({
          row: excelRow,
          column: field.column,
          message: `Must be at least ${field.min}.`,
        });
      }
      numbers[field.key] = parsed;
    }

    const trackInventoryRaw = read("trackInventory");
    const trackInventory =
      cellText(trackInventoryRaw) === "" ? true : parseYesNo(trackInventoryRaw);
    if (trackInventory === null) {
      rowIssues.push({
        row: excelRow,
        column: "Track inventory",
        message: "Expected YES or NO.",
      });
    }

    const verifiedRaw = read("measurementsVerified");
    const measurementsVerified = cellText(verifiedRaw) === "" ? false : parseYesNo(verifiedRaw);
    if (measurementsVerified === null) {
      rowIssues.push({
        row: excelRow,
        column: "Measurements verified",
        message: "Expected YES or NO.",
      });
    }

    if (rowIssues.length > 0) {
      issues.push(...rowIssues);
      continue;
    }

    seenSlugs.set(slug, excelRow);
    rows.push({
      slug,
      name,
      sizeLabel: cellText(read("sizeLabel")),
      tag: cellText(read("tag")),
      note: cellText(read("note")),
      description: cellText(read("description")),
      story: cellText(read("story")),
      category: cellText(read("category")).toLowerCase() || null,
      status: status as (typeof PRODUCT_STATUSES)[number],
      fulfilment: fulfilment as (typeof FULFILMENT_MODES)[number],
      stockQty: Math.round(numbers.stockQty ?? 0),
      trackInventory: trackInventory ?? true,
      mfgCostInr: numbers.mfgCostInr,
      packingCostInr: numbers.packingCostInr,
      lengthCm: numbers.lengthCm,
      widthCm: numbers.widthCm,
      heightCm: numbers.heightCm,
      packedWeightGrams: Math.round(numbers.packedWeightGrams),
      measurementsVerified: measurementsVerified ?? false,
    });
  }

  return { rows, issues, unknownHeaders, totalDataRows };
}
