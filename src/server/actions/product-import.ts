"use server";

import { asc, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { requireAdmin } from "../auth-guard";
import { db } from "../db";
import { category, product } from "../db/schema/catalog";
import { parseProductWorkbook } from "../excel/parse-products";
import {
  FULFILMENT_MODES,
  PRODUCT_STATUSES,
  type ParsedProductRow,
  type RowIssue,
} from "../excel/product-sheet";
import { computePrice } from "../pricing/compute";
import { getActivePricingConfigId, loadActiveAssumptions } from "../pricing/load";
import { revalidateAllProducts } from "../store/revalidate";

const PAISE = 100;
const MM_PER_CM = 10;
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_ROWS = 2000;

export interface ImportChange {
  field: string;
  from: string;
  to: string;
}

export interface ImportPreviewRow {
  slug: string;
  name: string;
  action: "create" | "update";
  changes: ImportChange[];
  priceInr: number;
  previousPriceInr: number | null;
}

export type ImportPreviewResult =
  | {
      ok: true;
      rows: ImportPreviewRow[];
      /** Echoed back to `applyProductImport`; re-validated there, never trusted. */
      payload: ParsedProductRow[];
      issues: RowIssue[];
      unknownHeaders: string[];
      creates: number;
      updates: number;
      unchanged: number;
    }
  | { ok: false; error: string; issues?: RowIssue[] };

/**
 * Rows are re-validated on apply rather than trusted from the preview round
 * trip: the payload travels through the browser, so treating it as verified
 * would let a crafted request write arbitrary values.
 */
const parsedRowSchema = z.object({
  slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(120),
  sizeLabel: z.string().max(60),
  tag: z.string().max(120),
  note: z.string().max(200),
  description: z.string().max(5000),
  story: z.string().max(5000),
  category: z.string().max(60).nullable(),
  status: z.enum(PRODUCT_STATUSES),
  fulfilment: z.enum(FULFILMENT_MODES),
  stockQty: z.number().int().min(0).max(100_000),
  trackInventory: z.boolean(),
  mfgCostInr: z.number().min(0).max(1_000_000),
  packingCostInr: z.number().min(0).max(1_000_000),
  lengthCm: z.number().min(0.1).max(500),
  widthCm: z.number().min(0.1).max(500),
  heightCm: z.number().min(0.1).max(500),
  packedWeightGrams: z.number().int().min(1).max(200_000),
  measurementsVerified: z.boolean(),
});

function toCostInputs(row: ParsedProductRow) {
  return {
    mfgCostPaise: Math.round(row.mfgCostInr * PAISE),
    packingCostPaise: Math.round(row.packingCostInr * PAISE),
    productLengthMm: Math.round(row.lengthCm * MM_PER_CM),
    productWidthMm: Math.round(row.widthCm * MM_PER_CM),
    productHeightMm: Math.round(row.heightCm * MM_PER_CM),
    packedWeightGrams: row.packedWeightGrams,
  };
}

function diff(
  row: ParsedProductRow,
  existing: typeof product.$inferSelect,
  categorySlug: string | null,
): ImportChange[] {
  const comparisons: Array<[string, string, string]> = [
    ["Name", existing.name, row.name],
    ["Size label", existing.sizeLabel, row.sizeLabel],
    ["Tag", existing.tag, row.tag],
    ["Note", existing.note, row.note],
    ["Description", existing.description, row.description],
    ["Story", existing.story, row.story],
    ["Category", categorySlug ?? "", row.category ?? ""],
    ["Status", existing.status, row.status],
    ["Fulfilment", existing.fulfilmentMode, row.fulfilment],
    ["Stock qty", String(existing.stockQty), String(row.stockQty)],
    ["Track inventory", String(existing.trackInventory), String(row.trackInventory)],
    ["Mfg cost", String(existing.mfgCostPaise / PAISE), String(row.mfgCostInr)],
    ["Packing cost", String(existing.packingCostPaise / PAISE), String(row.packingCostInr)],
    [
      "Length (cm)",
      existing.productLengthMm === null ? "" : String(existing.productLengthMm / MM_PER_CM),
      String(row.lengthCm),
    ],
    [
      "Width (cm)",
      existing.productWidthMm === null ? "" : String(existing.productWidthMm / MM_PER_CM),
      String(row.widthCm),
    ],
    [
      "Height (cm)",
      existing.productHeightMm === null ? "" : String(existing.productHeightMm / MM_PER_CM),
      String(row.heightCm),
    ],
    [
      "Packed weight (g)",
      existing.packedWeightGrams === null ? "" : String(existing.packedWeightGrams),
      String(row.packedWeightGrams),
    ],
    [
      "Measurements verified",
      String(existing.measurementsVerified),
      String(row.measurementsVerified),
    ],
  ];

  return comparisons
    .filter(([, from, to]) => from !== to)
    .map(([field, from, to]) => ({ field, from, to }));
}

export async function previewProductImport(formData: FormData): Promise<ImportPreviewResult> {
  await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: "No file was uploaded." };
  }
  if (file.size === 0) {
    return { ok: false, error: "That file is empty." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "That file is larger than 5 MB." };
  }
  if (!/\.xlsx$/i.test(file.name)) {
    return { ok: false, error: "Please upload an .xlsx file. Older .xls files are not supported." };
  }

  let parsed;
  try {
    parsed = await parseProductWorkbook(Buffer.from(await file.arrayBuffer()));
  } catch (error) {
    return {
      ok: false,
      error: `That file could not be read as a spreadsheet. ${error instanceof Error ? error.message : ""}`.trim(),
    };
  }

  if (parsed.totalDataRows > MAX_ROWS) {
    return { ok: false, error: `That sheet has more than ${MAX_ROWS} rows.` };
  }

  const assumptions = await loadActiveAssumptions();
  const slugs = parsed.rows.map((row) => row.slug);

  const existingRows = slugs.length
    ? await db.query.product.findMany({
        where: inArray(product.slug, slugs),
        with: { category: true },
      })
    : [];
  const existingBySlug = new Map(existingRows.map((row) => [row.slug, row]));

  const validCategories = new Set(
    (await db.select({ slug: category.slug }).from(category)).map((row) => row.slug),
  );

  const issues = [...parsed.issues];
  const previews: ImportPreviewRow[] = [];
  let creates = 0;
  let updates = 0;
  let unchanged = 0;

  for (const row of parsed.rows) {
    if (row.category && !validCategories.has(row.category)) {
      issues.push({
        row: 0,
        column: "Category",
        message: `"${row.category}" (row for ${row.slug}) is not a known category. Valid: ${[...validCategories].join(", ")}.`,
      });
      continue;
    }

    const existing = existingBySlug.get(row.slug);
    const price = computePrice(
      { ...toCostInputs(row), fulfilmentMode: row.fulfilment },
      assumptions,
    );

    if (!existing) {
      creates += 1;
      previews.push({
        slug: row.slug,
        name: row.name,
        action: "create",
        changes: [],
        priceInr: price.pricePaise / PAISE,
        previousPriceInr: null,
      });
      continue;
    }

    const changes = diff(row, existing, existing.category?.slug ?? null);
    if (changes.length === 0) {
      unchanged += 1;
      continue;
    }

    updates += 1;
    previews.push({
      slug: row.slug,
      name: row.name,
      action: "update",
      changes,
      priceInr: price.pricePaise / PAISE,
      previousPriceInr: existing.pricePaise / PAISE,
    });
  }

  return {
    ok: true,
    rows: previews,
    payload: parsed.rows,
    issues,
    unknownHeaders: parsed.unknownHeaders,
    creates,
    updates,
    unchanged,
  };
}

export type ImportApplyResult =
  | { ok: true; created: number; updated: number }
  | { ok: false; error: string };

export async function applyProductImport(payload: unknown): Promise<ImportApplyResult> {
  await requireAdmin();

  const parsed = z.array(parsedRowSchema).max(MAX_ROWS).safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: "The import data failed validation. Please re-upload the file." };
  }
  if (parsed.data.length === 0) {
    return { ok: false, error: "There is nothing to import." };
  }

  const assumptions = await loadActiveAssumptions();
  const pricingConfigId = await getActivePricingConfigId();

  const categoryRows = await db
    .select({ id: category.id, slug: category.slug })
    .from(category)
    .orderBy(asc(category.slug));
  const categoryIdBySlug = new Map(categoryRows.map((row) => [row.slug, row.id]));

  const slugs = parsed.data.map((row) => row.slug);
  const existing = await db
    .select({ slug: product.slug })
    .from(product)
    .where(inArray(product.slug, slugs));
  const existingSlugs = new Set(existing.map((row) => row.slug));

  const now = new Date();
  let created = 0;
  let updated = 0;

  for (const row of parsed.data) {
    if (row.category && !categoryIdBySlug.has(row.category)) {
      return { ok: false, error: `Unknown category "${row.category}" on ${row.slug}.` };
    }

    const costColumns = toCostInputs(row);
    const price = computePrice({ ...costColumns, fulfilmentMode: row.fulfilment }, assumptions);
    const isNew = !existingSlugs.has(row.slug);

    const shared = {
      name: row.name,
      tag: row.tag,
      note: row.note,
      description: row.description,
      story: row.story,
      sizeLabel: row.sizeLabel,
      categoryId: row.category ? (categoryIdBySlug.get(row.category) ?? null) : null,
      fulfilmentMode: row.fulfilment,
      stockQty: row.stockQty,
      trackInventory: row.trackInventory,
      measurementsVerified: row.measurementsVerified,
      ...costColumns,
      pricePaise: price.pricePaise,
      compareAtPaise: price.mrpPaise,
      chargeableWeightGrams: price.chargeableWeightGrams,
      blendedShippingPaise: price.blendedShippingPaise,
      breakageProvisionPaise: price.breakageProvisionPaise,
      totalCostPaise: price.totalCostPaise,
      pricingConfigId,
      pricedAt: now,
      updatedAt: now,
    };

    if (isNew) {
      // New products always land as drafts regardless of the Status column, so
      // an import can never push an unreviewed, imageless product live.
      await db.insert(product).values({ slug: row.slug, ...shared, status: "draft" });
      created += 1;
    } else {
      await db
        .update(product)
        .set({ ...shared, status: row.status })
        .where(eq(product.slug, row.slug));
      updated += 1;
    }
  }

  revalidateAllProducts();
  return { ok: true, created, updated };
}
