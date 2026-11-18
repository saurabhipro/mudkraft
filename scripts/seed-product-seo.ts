/**
 * Seeds every website product's Search & sharing fields in Bikriup (Product fields › SEO) with the
 * text the site writes today: the search title, a summary and the keywords. After this they are
 * the shop's own text, editable per size in Bikriup › Products › Search & sharing.
 *
 *     npx tsx scripts/seed-product-seo.ts --from products.json --out seo.json   # production
 *     BIKRIUP_API_URL=… BIKRIUP_SECRET_KEY=bk_sec_… npx tsx scripts/seed-product-seo.ts [--dry-run]
 *
 * Production's secret key stays on the VM, so there the products are read and the result posted
 * on the VM itself:
 *
 *     curl -fsS "http://127.0.0.1:8787/api/v1/products?group=0&limit=300" \
 *       -H "Authorization: Bearer $BIKRIUP_SECRET_KEY" > products.json
 *     # copy products.json here, run the script with --from/--out, copy seo.json back, then:
 *     curl -fsS -X POST http://127.0.0.1:8787/api/v1/products/bulk -H "Content-Type: application/json" \
 *       -H "Authorization: Bearer $BIKRIUP_SECRET_KEY" --data @seo.json
 *
 * The summary leaves out the price (the site's own summary has it), so the saved text never goes
 * stale when a price changes. The share photo and "hide from Google" stay automatic. An item that
 * already has its own title or summary is skipped unless --force is given. Only listed items are
 * read, as only those have website pages.
 */

import "../src/server/db/load-env";

import { readFileSync, writeFileSync } from "node:fs";

import { productSeo } from "../src/lib/categories";
import { productKeywords } from "../src/lib/keywords";
import { toProductView } from "../src/lib/product-view";
import {
  bikriup,
  bikriupEnabled,
  toStoreProductShape,
  type BkProduct,
} from "../src/server/bikriup";

const arg = (name: string) =>
  process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : "";
const DRY = process.argv.includes("--dry-run");
const FORCE = process.argv.includes("--force");
const FROM = arg("--from");
const OUT = arg("--out");

async function main() {
  const products: BkProduct[] = FROM
    ? (JSON.parse(readFileSync(FROM, "utf8")) as { products: BkProduct[] }).products
    : bikriupEnabled()
      ? (await bikriup<{ products: BkProduct[] }>("/products?group=0&limit=300")).products
      : [];
  if (!products.length)
    throw new Error(
      "No products: pass --from products.json, or set BIKRIUP_API_URL and BIKRIUP_SECRET_KEY.",
    );

  const items: Array<{
    slug: string;
    seo: { title: string; description: string; keywords: string[] };
  }> = [];
  for (const p of products) {
    if (!FORCE && (p.seo?.title || p.seo?.description)) {
      console.log(`skip  ${p.slug} (has its own search text)`);
      continue;
    }
    const view = toProductView(toStoreProductShape(p));
    const seo = productSeo(view);
    items.push({
      slug: p.slug,
      seo: { title: seo.title, description: seo.seedDescription, keywords: productKeywords(view) },
    });
    console.log(
      `seed  ${p.slug}\n      ${seo.title} (${seo.title.length})\n      ${seo.seedDescription} (${seo.seedDescription.length})`,
    );
  }
  const body = { products: items };
  if (OUT) writeFileSync(OUT, JSON.stringify(body, null, 2));
  if (OUT || DRY || !items.length) {
    console.log(
      `\n${items.length} of ${products.length} items ${OUT ? `written to ${OUT}` : "ready (dry run)"}.`,
    );
    return;
  }
  const res = await bikriup<{
    updated: number;
    created: number;
    errors: Array<{ slug: string; error: string }>;
  }>("/products/bulk", {
    method: "POST",
    body,
  });
  console.log(`\nUpdated ${res.updated}, created ${res.created}.`);
  if (res.created) console.warn("Some slugs were new to Bikriup and were created — check them.");
  for (const e of res.errors) console.error(`error ${e.slug}: ${e.error}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
