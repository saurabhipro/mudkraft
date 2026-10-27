/**
 * Narrows the shop to the cookware range: archives every other live product.
 *
 *     npx tsx scripts/focus-catalogue.ts            # dry run, prints the plan
 *     npx tsx scripts/focus-catalogue.ts --apply    # writes
 *
 * Archived rather than drafted on purpose: setProductStatus treats draft →
 * active as a launch and emails every customer, so a product brought back from
 * the archive later is not re-announced. Nothing is deleted — product rows,
 * images and past orders all stay; archived products simply leave the shop.
 *
 * Writes the database directly (like import-product-images.ts), so the site's
 * cache does not know about it. Press "Re-price all products" in /admin
 * afterwards, which revalidates every product page, or redeploy.
 */

import "../src/server/db/load-env";

import { inArray } from "drizzle-orm";

import { db } from "../src/server/db";
import { product } from "../src/server/db/schema/catalog";

const APPLY = process.argv.includes("--apply");

/** Stays live. Everything else that is currently active gets archived. */
const KEEP_ACTIVE = ["handi-1-5l", "handi-2-5l", "kadhai-3l", "bhagona-4l"];

async function main() {
  console.log(APPLY ? "" : "DRY RUN — nothing will be written. Re-run with --apply.\n");

  const rows = await db
    .select({
      slug: product.slug,
      name: product.name,
      sizeLabel: product.sizeLabel,
      status: product.status,
    })
    .from(product)
    .orderBy(product.sortOrder);

  const missing = KEEP_ACTIVE.filter((slug) => !rows.some((r) => r.slug === slug));
  if (missing.length > 0) {
    // handi-1-5l comes from the seed; archiving before it exists would leave
    // the shop without a Handi size the site expects.
    throw new Error(`Not in the database yet: ${missing.join(", ")}. Run the seed first.`);
  }

  const toArchive = rows.filter((r) => r.status === "active" && !KEEP_ACTIVE.includes(r.slug));
  const toActivate = rows.filter((r) => KEEP_ACTIVE.includes(r.slug) && r.status !== "active");

  console.log("slug                 status     →  after");
  for (const r of rows) {
    const after = toArchive.includes(r) ? "archived" : toActivate.includes(r) ? "active" : r.status;
    const mark = after === r.status ? "" : "  *";
    console.log(`${r.slug.padEnd(20)} ${r.status.padEnd(10)} →  ${after}${mark}`);
  }

  if (toActivate.length > 0) {
    // Activating here would skip the launch email the admin panel sends; leave
    // that decision to the admin panel rather than make it silently.
    console.log(
      `\nNot active and NOT changed by this script: ${toActivate.map((r) => r.slug).join(", ")}.` +
        "\nActivate them from /admin.",
    );
  }

  if (!APPLY) {
    console.log(`\nWould archive ${toArchive.length} product(s).`);
    return;
  }
  if (toArchive.length === 0) {
    console.log("\nNothing to archive.");
    return;
  }

  await db
    .update(product)
    .set({ status: "archived", updatedAt: new Date() })
    .where(
      inArray(
        product.slug,
        toArchive.map((r) => r.slug),
      ),
    );

  console.log(
    `\nArchived ${toArchive.length} product(s). Now press "Re-price all products" in /admin.`,
  );
}

main().catch((error) => {
  console.error("\nFailed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
