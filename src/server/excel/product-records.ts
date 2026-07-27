import { asc } from "drizzle-orm";

import { db } from "../db";
import { category, product } from "../db/schema/catalog";
import type { ProductExportRecord } from "./product-workbook";

/** Every product, whatever its status — an export is for working on, not for display. */
export async function getProductExportRecords(): Promise<ProductExportRecord[]> {
  const rows = await db.query.product.findMany({
    orderBy: [asc(product.sortOrder), asc(product.name)],
    with: { category: true },
  });

  return rows.map((row) => ({
    slug: row.slug,
    name: row.name,
    sizeLabel: row.sizeLabel,
    tag: row.tag,
    note: row.note,
    description: row.description,
    story: row.story,
    categorySlug: row.category?.slug ?? null,
    status: row.status,
    fulfilmentMode: row.fulfilmentMode,
    stockQty: row.stockQty,
    trackInventory: row.trackInventory,
    mfgCostPaise: row.mfgCostPaise,
    packingCostPaise: row.packingCostPaise,
    productLengthMm: row.productLengthMm,
    productWidthMm: row.productWidthMm,
    productHeightMm: row.productHeightMm,
    packedWeightGrams: row.packedWeightGrams,
    measurementsVerified: row.measurementsVerified,
    pricePaise: row.pricePaise,
    compareAtPaise: row.compareAtPaise,
    blendedShippingPaise: row.blendedShippingPaise,
    totalCostPaise: row.totalCostPaise,
    chargeableWeightGrams: row.chargeableWeightGrams,
  }));
}

export async function getCategorySlugs(): Promise<string[]> {
  const rows = await db
    .select({ slug: category.slug })
    .from(category)
    .orderBy(asc(category.sortOrder));
  return rows.map((row) => row.slug);
}
