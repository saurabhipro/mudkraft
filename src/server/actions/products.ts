"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { requireAdmin } from "../auth-guard";
import { destroyAsset } from "../cloudinary";
import { db } from "../db";
import { product, productImage } from "../db/schema/catalog";
import { pricingConfig } from "../db/schema/pricing";
import { computePrice } from "../pricing/compute";
import { loadActiveAssumptions } from "../pricing/load";
import { revalidateAllProducts, revalidateProduct } from "../store/revalidate";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const productUpdateSchema = z.object({
  slug: z.string().min(1),
  name: z.string().trim().min(1, "Name is required").max(120),
  tag: z.string().trim().max(120).default(""),
  note: z.string().trim().max(200).default(""),
  description: z.string().trim().max(5000).default(""),
  story: z.string().trim().max(5000).default(""),
  sizeLabel: z.string().trim().max(60).default(""),
  status: z.enum(["draft", "active", "archived"]),
  fulfilmentMode: z.enum(["ship_nationwide", "local_delivery_only", "pickup_only"]),
  categoryId: z.string().uuid().nullable(),
  stockQty: z.coerce.number().int().min(0).max(100_000),
  trackInventory: z.coerce.boolean(),

  // Cost inputs, entered in rupees / centimetres / grams as a human would.
  mfgCostInr: z.coerce.number().min(0).max(1_000_000),
  packingCostInr: z.coerce.number().min(0).max(1_000_000),
  productLengthCm: z.coerce.number().min(0.1).max(500),
  productWidthCm: z.coerce.number().min(0.1).max(500),
  productHeightCm: z.coerce.number().min(0.1).max(500),
  packedWeightGrams: z.coerce.number().int().min(1).max(200_000),
  measurementsVerified: z.coerce.boolean(),
});

export async function updateProduct(input: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsed = productUpdateSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, error: "Please correct the highlighted fields.", fieldErrors };
  }

  const d = parsed.data;
  const assumptions = await loadActiveAssumptions();

  // Stored cost columns, kept separate from the pricing call's argument so the
  // update below has exactly one source for each column.
  const costColumns = {
    mfgCostPaise: Math.round(d.mfgCostInr * 100),
    packingCostPaise: Math.round(d.packingCostInr * 100),
    productLengthMm: Math.round(d.productLengthCm * 10),
    productWidthMm: Math.round(d.productWidthCm * 10),
    productHeightMm: Math.round(d.productHeightCm * 10),
    packedWeightGrams: d.packedWeightGrams,
  };

  const price = computePrice(
    { ...costColumns, fulfilmentMode: d.fulfilmentMode },
    assumptions,
  );
  const activeConfig = await db.query.pricingConfig.findFirst({
    where: eq(pricingConfig.isActive, true),
  });

  await db
    .update(product)
    .set({
      name: d.name,
      tag: d.tag,
      note: d.note,
      description: d.description,
      story: d.story,
      sizeLabel: d.sizeLabel,
      status: d.status,
      fulfilmentMode: d.fulfilmentMode,
      categoryId: d.categoryId,
      stockQty: d.stockQty,
      trackInventory: d.trackInventory,
      measurementsVerified: d.measurementsVerified,

      ...costColumns,

      pricePaise: price.pricePaise,
      compareAtPaise: price.mrpPaise,
      chargeableWeightGrams: price.chargeableWeightGrams,
      blendedShippingPaise: price.blendedShippingPaise,
      breakageProvisionPaise: price.breakageProvisionPaise,
      totalCostPaise: price.totalCostPaise,
      pricingConfigId: activeConfig?.id ?? null,
      pricedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(product.slug, d.slug));

  revalidateProduct(d.slug);
  return { ok: true };
}

const statusSchema = z.object({
  slug: z.string().min(1),
  status: z.enum(["draft", "active", "archived"]),
});

export async function setProductStatus(input: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsed = statusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid status change." };

  await db
    .update(product)
    .set({ status: parsed.data.status, updatedAt: new Date() })
    .where(eq(product.slug, parsed.data.slug));

  revalidateProduct(parsed.data.slug);
  return { ok: true };
}

const addImageSchema = z.object({
  productSlug: z.string().min(1),
  publicId: z.string().min(1).max(300),
  version: z.string().max(40).nullable().optional(),
  resourceType: z.enum(["image", "video"]).default("image"),
  format: z.string().max(20).nullable().optional(),
  width: z.coerce.number().int().positive().nullable().optional(),
  height: z.coerce.number().int().positive().nullable().optional(),
  alt: z.string().trim().max(300).default(""),
});

export async function addProductImage(input: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsed = addImageSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid image data." };
  const d = parsed.data;

  const row = await db.query.product.findFirst({
    where: eq(product.slug, d.productSlug),
    with: { images: true },
  });
  if (!row) return { ok: false, error: "Product not found." };

  await db.insert(productImage).values({
    productId: row.id,
    publicId: d.publicId,
    version: d.version ?? null,
    resourceType: d.resourceType,
    format: d.format ?? null,
    width: d.width ?? null,
    height: d.height ?? null,
    alt: d.alt,
    // First image uploaded becomes the primary one, so a product is never
    // left with images but nothing to show on the grid.
    isPrimary: row.images.length === 0,
    sortOrder: row.images.length,
  });

  revalidateProduct(d.productSlug);
  return { ok: true };
}

const imageRefSchema = z.object({
  imageId: z.string().uuid(),
  productSlug: z.string().min(1),
});

export async function removeProductImage(input: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsed = imageRefSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid image reference." };

  const image = await db.query.productImage.findFirst({
    where: eq(productImage.id, parsed.data.imageId),
  });
  if (!image) return { ok: false, error: "Image not found." };

  await db.delete(productImage).where(eq(productImage.id, parsed.data.imageId));

  // If we deleted the primary, promote another so the product keeps a thumbnail.
  if (image.isPrimary) {
    const remaining = await db.query.productImage.findMany({
      where: eq(productImage.productId, image.productId),
    });
    const next = remaining.sort((a, b) => a.sortOrder - b.sortOrder)[0];
    if (next) {
      await db.update(productImage).set({ isPrimary: true }).where(eq(productImage.id, next.id));
    }
  }

  // Remove from Cloudinary last: a failure here leaves an orphaned asset, which
  // is recoverable. Failing before the row delete would leave a broken image.
  try {
    await destroyAsset(image.publicId, image.resourceType);
  } catch (error) {
    console.error(`Cloudinary delete failed for ${image.publicId}:`, error);
  }

  revalidateProduct(parsed.data.productSlug);
  return { ok: true };
}

export async function setPrimaryImage(input: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsed = imageRefSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid image reference." };

  const image = await db.query.productImage.findFirst({
    where: eq(productImage.id, parsed.data.imageId),
  });
  if (!image) return { ok: false, error: "Image not found." };

  // Clear first: a partial unique index allows only one primary per product, so
  // setting the new one before clearing the old would violate the constraint.
  await db
    .update(productImage)
    .set({ isPrimary: false })
    .where(eq(productImage.productId, image.productId));
  await db
    .update(productImage)
    .set({ isPrimary: true })
    .where(eq(productImage.id, parsed.data.imageId));

  revalidateProduct(parsed.data.productSlug);
  return { ok: true };
}

/**
 * Re-prices the whole catalogue against the active assumptions. Run after
 * editing the rate card, or every stored price silently reflects a mix of old
 * and new rules.
 */
export async function recomputeAllPrices(): Promise<ActionResult & { updated?: number }> {
  await requireAdmin();

  const assumptions = await loadActiveAssumptions();
  const activeConfig = await db.query.pricingConfig.findFirst({
    where: eq(pricingConfig.isActive, true),
  });
  const rows = await db.select().from(product);
  const now = new Date();
  let updated = 0;

  for (const p of rows) {
    if (
      p.productLengthMm === null ||
      p.productWidthMm === null ||
      p.productHeightMm === null ||
      p.packedWeightGrams === null
    ) {
      // No dimensions means no billable weight, so no defensible price.
      continue;
    }

    const price = computePrice(
      {
        mfgCostPaise: p.mfgCostPaise,
        packingCostPaise: p.packingCostPaise,
        productLengthMm: p.productLengthMm,
        productWidthMm: p.productWidthMm,
        productHeightMm: p.productHeightMm,
        packedWeightGrams: p.packedWeightGrams,
        fulfilmentMode: p.fulfilmentMode,
      },
      assumptions,
    );

    await db
      .update(product)
      .set({
        pricePaise: price.pricePaise,
        compareAtPaise: price.mrpPaise,
        chargeableWeightGrams: price.chargeableWeightGrams,
        blendedShippingPaise: price.blendedShippingPaise,
        breakageProvisionPaise: price.breakageProvisionPaise,
        totalCostPaise: price.totalCostPaise,
        pricingConfigId: activeConfig?.id ?? null,
        pricedAt: now,
        updatedAt: now,
      })
      .where(eq(product.id, p.id));

    updated += 1;
  }

  revalidateAllProducts();
  return { ok: true, updated };
}
