/**
 * Clean start for production: empties every data table in Neon, so the live site starts with no
 * products, orders, reviews, enquiries or accounts. Products now live in Bikriup.
 *
 *     npm run db:reset-data             (dry run: counts only)
 *     npm run db:reset-data -- --apply  (deletes — take a pg_dump first, see deploy/mudkraft/README)
 *
 * Kept: the tables themselves, the migration history and pricing_config (the price formula).
 * Refuses to run until the site reads from Bikriup (BIKRIUP_API_URL set), so the live
 * catalogue is never emptied while the site still depends on it.
 */

import "../src/server/db/load-env";

import { sql } from "drizzle-orm";

import { db } from "../src/server/db";

// Children before parents; TRUNCATE … CASCADE takes care of anything missed.
const TABLES = [
  "cart_item", "cart",
  "order_event", "order_item", "payment_transaction", "shipment", "delivery_verification", "order",
  "review", "workshop_enquiry",
  "product_image", "product", "category",
  "session", "account", "verification", "user",
];

async function count(table: string): Promise<number> {
  const rows = await db.execute(sql.raw(`SELECT COUNT(*)::int AS n FROM "${table}"`));
  return Number((rows as unknown as { rows: Array<{ n: number }> }).rows?.[0]?.n ?? 0);
}

async function main() {
  const apply = process.argv.includes("--apply");
  const force = process.argv.includes("--force");
  if (apply && !process.env.BIKRIUP_API_URL && !force) {
    throw new Error("BIKRIUP_API_URL is not set: the site still reads products from this database. Switch it to Bikriup first.");
  }
  const counts: Array<[string, number]> = [];
  for (const table of TABLES) counts.push([table, await count(table)]);
  const summary = counts.filter(([, n]) => n).map(([t, n]) => `${t} ${n}`).join(", ") || "nothing to remove";
  if (!apply) {
    console.log(`Would remove: ${summary}`);
    console.log("Run again with --apply to delete (after a pg_dump backup).");
    return;
  }
  await db.execute(sql.raw(`TRUNCATE ${TABLES.map((t) => `"${t}"`).join(", ")} RESTART IDENTITY CASCADE`));
  const left = await count("product");
  console.log(`Removed: ${summary}. Products left: ${left}.`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
