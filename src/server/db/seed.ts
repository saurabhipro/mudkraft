/**
 * Idempotent database seed.
 *
 *     npm run db:seed
 *
 * Safe to re-run: everything upserts on a natural key. Product copy written by
 * the studio (description, story), merchandising state (status, stock) and the
 * admin's own password are deliberately NOT overwritten on a re-run — only the
 * cost inputs and the prices derived from them.
 */

// MUST be first: populates process.env before src/server/env validates it.
// Imports evaluate in source order — keep this line above the rest.
import "./load-env";

import { eq, sql } from "drizzle-orm";

import { auth, ROLE_ADMIN } from "../auth";
import { computePrice } from "../pricing/compute";
import { DEFAULT_ASSUMPTIONS } from "../pricing/config";
import { db } from "./index";
import { user } from "./schema/auth";
import { category, product } from "./schema/catalog";
import { pricingConfig } from "./schema/pricing";
import { CATEGORIES } from "./seed-data/catalog";
import { resolveCatalog } from "./seed-data/resolve";

const PRICING_VERSION = 1;
const MM_PER_CM = 10;
const GRAMS_PER_KG = 1000;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set. See .env.example.`);
  return value;
}

/**
 * Specs are derived from the cost inputs rather than authored, so they cannot
 * drift out of sync with the dimensions freight is actually billed on.
 */
function buildSpecs(sizeLabel: string, inputs: {
  productLengthMm: number;
  productWidthMm: number;
  productHeightMm: number;
  packedWeightGrams: number;
}): Array<{ label: string; value: string }> {
  const specs: Array<{ label: string; value: string }> = [];
  if (sizeLabel && sizeLabel.toUpperCase() !== "PC") {
    specs.push({ label: "Capacity", value: sizeLabel });
  }
  specs.push({
    label: "Dimensions",
    value: `${inputs.productLengthMm / MM_PER_CM} × ${inputs.productWidthMm / MM_PER_CM} × ${inputs.productHeightMm / MM_PER_CM} cm`,
  });
  specs.push({
    label: "Packed weight",
    value: `${(inputs.packedWeightGrams / GRAMS_PER_KG).toFixed(1)} kg`,
  });
  specs.push({ label: "Material", value: "Unglazed river clay" });
  specs.push({ label: "Origin", value: "Khurja, India" });
  return specs;
}

async function seedPricingConfig(): Promise<string> {
  const a = DEFAULT_ASSUMPTIONS;
  const [row] = await db
    .insert(pricingConfig)
    .values({
      version: PRICING_VERSION,
      label: "Initial — derived from kumbhaja_costing_1.xlsx",
      volumetricDivisor: a.volumetricDivisor,
      packingPaddingMm: a.packingPaddingMm,
      shippingGstBps: a.shippingGstBps,
      marginBps: a.marginBps,
      breakageBps: a.breakageBps,
      breakageIncludesShipping: a.breakageIncludesShipping,
      plannedDiscountBps: a.plannedDiscountBps,
      roundToPaise: a.roundToPaise,
      zones: a.zones,
      isActive: true,
      notes:
        "Zone A reproduces the source workbook exactly. Zones B–E slab rates and the " +
        "order-volume mix are ASSUMPTIONS, not a contracted Shiprocket rate card. " +
        "Product dimensions and weights are the workbook's own estimates.",
    })
    .onConflictDoUpdate({
      target: pricingConfig.version,
      set: {
        zones: a.zones,
        marginBps: a.marginBps,
        breakageBps: a.breakageBps,
        breakageIncludesShipping: a.breakageIncludesShipping,
        plannedDiscountBps: a.plannedDiscountBps,
      },
    })
    .returning({ id: pricingConfig.id });

  console.log(`  pricing_config v${PRICING_VERSION} active`);
  return row.id;
}

async function seedCategories(): Promise<Map<string, string>> {
  await db
    .insert(category)
    .values(CATEGORIES.map((c) => ({ slug: c.slug, name: c.name, sortOrder: c.sortOrder })))
    .onConflictDoUpdate({
      target: category.slug,
      set: { name: sql`excluded.name`, sortOrder: sql`excluded.sort_order` },
    });

  const rows = await db.select({ id: category.id, slug: category.slug }).from(category);
  console.log(`  ${rows.length} categories`);
  return new Map(rows.map((r) => [r.slug, r.id]));
}

async function seedProducts(pricingConfigId: string, categoryIds: Map<string, string>) {
  const items = resolveCatalog();
  const now = new Date();

  for (const item of items) {
    const categoryId = categoryIds.get(item.entry.categorySlug);
    if (!categoryId) {
      throw new Error(
        `Product "${item.entry.slug}" references unknown category "${item.entry.categorySlug}".`,
      );
    }

    const price = computePrice(item.costInputs, DEFAULT_ASSUMPTIONS);

    const values = {
      slug: item.entry.slug,
      name: item.entry.name,
      tag: item.entry.tag,
      note: item.entry.note,
      sizeLabel: item.sizeLabel,
      categoryId,
      sortOrder: item.entry.sortOrder,
      fulfilmentMode: item.entry.fulfilmentMode,

      mfgCostPaise: item.costInputs.mfgCostPaise,
      packingCostPaise: item.costInputs.packingCostPaise,
      productLengthMm: item.costInputs.productLengthMm,
      productWidthMm: item.costInputs.productWidthMm,
      productHeightMm: item.costInputs.productHeightMm,
      packedWeightGrams: item.costInputs.packedWeightGrams,
      measurementsVerified: item.measurementsVerified,

      pricePaise: price.pricePaise,
      compareAtPaise: price.mrpPaise,
      chargeableWeightGrams: price.chargeableWeightGrams,
      blendedShippingPaise: price.blendedShippingPaise,
      breakageProvisionPaise: price.breakageProvisionPaise,
      totalCostPaise: price.totalCostPaise,
      pricingConfigId,
      pricedAt: now,

      specs: buildSpecs(item.sizeLabel, item.costInputs),
      care: [...item.entry.care],
      status: item.entry.status,
      updatedAt: now,
    };

    await db
      .insert(product)
      .values(values)
      .onConflictDoUpdate({
        target: product.slug,
        set: {
          // Cost inputs and everything derived from them are owned by the seed.
          name: values.name,
          tag: values.tag,
          note: values.note,
          sizeLabel: values.sizeLabel,
          categoryId: values.categoryId,
          sortOrder: values.sortOrder,
          fulfilmentMode: values.fulfilmentMode,
          mfgCostPaise: values.mfgCostPaise,
          packingCostPaise: values.packingCostPaise,
          productLengthMm: values.productLengthMm,
          productWidthMm: values.productWidthMm,
          productHeightMm: values.productHeightMm,
          packedWeightGrams: values.packedWeightGrams,
          measurementsVerified: values.measurementsVerified,
          pricePaise: values.pricePaise,
          compareAtPaise: values.compareAtPaise,
          chargeableWeightGrams: values.chargeableWeightGrams,
          blendedShippingPaise: values.blendedShippingPaise,
          breakageProvisionPaise: values.breakageProvisionPaise,
          totalCostPaise: values.totalCostPaise,
          pricingConfigId: values.pricingConfigId,
          pricedAt: values.pricedAt,
          specs: values.specs,
          care: values.care,
          updatedAt: values.updatedAt,
          // description, story, status and stock_qty are intentionally absent:
          // those belong to whoever edits them in the admin panel.
        },
      });
  }

  console.log(`  ${items.length} products priced and upserted`);
}

async function seedAdmin() {
  const email = requireEnv("SEED_ADMIN_EMAIL");
  const password = requireEnv("SEED_ADMIN_PASSWORD");
  const name = process.env.SEED_ADMIN_NAME ?? "Mudkraft Studio";

  const existing = await db.select({ id: user.id }).from(user).where(eq(user.email, email));

  if (existing.length === 0) {
    // Routed through Better Auth rather than a direct insert so the password is
    // hashed with exactly the parameters the login path will verify against.
    await auth.api.signUpEmail({ body: { email, password, name } });
    console.log(`  created admin ${email}`);
  } else {
    console.log(`  admin ${email} already exists — password left unchanged`);
  }

  await db
    .update(user)
    .set({ role: ROLE_ADMIN, emailVerified: true, updatedAt: new Date() })
    .where(eq(user.email, email));
}

async function main() {
  console.log("Seeding Mudkraft…");
  const pricingConfigId = await seedPricingConfig();
  const categoryIds = await seedCategories();
  await seedProducts(pricingConfigId, categoryIds);
  await seedAdmin();
  console.log("Done.");
}

main().catch((error) => {
  console.error("\nSeed failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
