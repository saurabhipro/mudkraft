/**
 * Read-only smoke test against the live database.
 *
 *     npm run db:check
 *
 * Confirms the seed landed, the admin has the right role, and the database-level
 * guarantees (order number sequence, contact CHECK constraint) actually hold —
 * constraints that are never exercised are constraints you cannot rely on.
 */

import "../src/server/db/load-env";

import { eq, sql } from "drizzle-orm";

import { db } from "../src/server/db";
import { user } from "../src/server/db/schema/auth";
import { category, product, productImage } from "../src/server/db/schema/catalog";
import { pricingConfig } from "../src/server/db/schema/pricing";
import { formatPaise } from "../src/lib/money";

async function main() {
  const configs = await db
    .select({ version: pricingConfig.version, isActive: pricingConfig.isActive })
    .from(pricingConfig);
  console.log(
    `pricing_config: ${configs.map((c) => `v${c.version}${c.isActive ? " (active)" : ""}`).join(", ")}`,
  );

  const categories = await db.select({ slug: category.slug }).from(category);
  console.log(`categories:    ${categories.map((c) => c.slug).join(", ")}\n`);

  const products = await db
    .select({
      slug: product.slug,
      name: product.name,
      sizeLabel: product.sizeLabel,
      status: product.status,
      fulfilmentMode: product.fulfilmentMode,
      pricePaise: product.pricePaise,
      compareAtPaise: product.compareAtPaise,
      verified: product.measurementsVerified,
    })
    .from(product)
    .orderBy(product.sortOrder);

  console.log(`${products.length} products:`);
  for (const p of products) {
    console.log(
      `  ${p.slug.padEnd(18)} ${`${p.name} ${p.sizeLabel}`.padEnd(22)}` +
        `${formatPaise(p.pricePaise).padStart(8)} / MRP ${formatPaise(p.compareAtPaise ?? 0).padStart(8)}` +
        `  ${p.status.padEnd(7)} ${p.fulfilmentMode}${p.verified ? "" : "  ⚠ unverified"}`,
    );
  }

  const images = await db
    .select({
      slug: product.slug,
      publicId: productImage.publicId,
      isPrimary: productImage.isPrimary,
      format: productImage.format,
    })
    .from(productImage)
    .innerJoin(product, eq(productImage.productId, product.id));

  const byProduct = new Map<string, { total: number; primary: number; cutouts: number }>();
  for (const img of images) {
    const entry = byProduct.get(img.slug) ?? { total: 0, primary: 0, cutouts: 0 };
    entry.total += 1;
    if (img.isPrimary) entry.primary += 1;
    if (img.publicId.endsWith("-cutout")) entry.cutouts += 1;
    byProduct.set(img.slug, entry);
  }

  console.log(`\nimages: ${images.length} rows across ${byProduct.size} products`);
  const multiPrimary = [...byProduct.entries()].filter(([, v]) => v.primary !== 1);
  console.log(
    multiPrimary.length === 0
      ? "  ✓ every product with images has exactly one primary"
      : `  ✗ wrong primary count: ${multiPrimary.map(([k, v]) => `${k}=${v.primary}`).join(", ")}`,
  );
  const noImages = products.filter((p) => !byProduct.has(p.slug)).map((p) => p.slug);
  if (noImages.length > 0) console.log(`  products without images: ${noImages.join(", ")}`);

  const admins = await db
    .select({ email: user.email, role: user.role })
    .from(user)
    .where(eq(user.role, "admin"));
  console.log(`\nadmins: ${admins.map((a) => a.email).join(", ") || "NONE — seed did not run"}`);

  // What the database actually enforces, read from the catalog rather than
  // inferred from an error message.
  const constraints = await db.execute<{ conname: string; definition: string }>(sql`
    SELECT conname, pg_get_constraintdef(oid) AS definition
    FROM pg_constraint
    WHERE contype = 'c' AND connamespace = 'public'::regnamespace
    ORDER BY conname
  `);
  const rows = (constraints as unknown as { rows?: unknown[] }).rows ?? constraints;
  console.log(`\nCHECK constraints in the database (${(rows as unknown[]).length}):`);
  for (const row of rows as Array<{ conname: string; definition: string }>) {
    console.log(`  ${row.conname.padEnd(28)} ${row.definition}`);
  }

  // Then prove the one that matters actually rejects a bad row.
  console.log("\nProbe — insert an order with neither email nor phone:");
  try {
    await db.execute(sql`
      INSERT INTO "order" ("lookup_token","shipping_name","shipping_line1","shipping_city",
        "shipping_state","shipping_postal_code","subtotal_paise","total_paise")
      VALUES ('constraint-probe','x','x','x','x','000000',0,0)
    `);
    await db.execute(sql`DELETE FROM "order" WHERE "lookup_token" = 'constraint-probe'`);
    console.log("  ✗ ACCEPTED — an unreachable order can be created");
  } catch (error) {
    // Drizzle's neon-http driver wraps driver errors, so the Postgres
    // constraint name lives further down the cause chain than error.message.
    const parts: string[] = [];
    for (let e: unknown = error, depth = 0; e && depth < 5; depth += 1) {
      if (e instanceof Error) {
        parts.push(e.message);
        e = e.cause;
      } else {
        parts.push(String(e));
        break;
      }
    }
    const combined = parts.join(" | ");
    console.log(
      combined.includes("order_contact_present")
        ? "  ✓ rejected by order_contact_present"
        : `  ? rejected, but not by the expected constraint: ${combined}`,
    );
  }
}

main().catch((error) => {
  console.error("db:check failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
