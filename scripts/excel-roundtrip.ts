/**
 * Verifies the Excel layer end to end against the live catalogue.
 *
 *     npx tsx scripts/excel-roundtrip.ts
 *
 * Generates the export and the template, parses both straight back, and checks
 * that what comes out matches what went in. Export and import share one column
 * spec, so a round trip is the cheapest way to prove that spec is coherent.
 * Writes nothing to the database.
 */

import "../src/server/db/load-env";

import { parseProductWorkbook } from "../src/server/excel/parse-products";
import { getCategorySlugs, getProductExportRecords } from "../src/server/excel/product-records";
import { buildProductExport, buildProductTemplate } from "../src/server/excel/product-workbook";

const PAISE = 100;
const MM_PER_CM = 10;

function assert(condition: boolean, message: string): boolean {
  console.log(`  ${condition ? "✓" : "✗"} ${message}`);
  return condition;
}

async function main() {
  let ok = true;

  const [records, categorySlugs] = await Promise.all([
    getProductExportRecords(),
    getCategorySlugs(),
  ]);
  console.log(`Catalogue: ${records.length} products, categories: ${categorySlugs.join(", ")}\n`);

  // ---- export -> parse ----------------------------------------------------
  console.log("Export round trip");
  const exportBuffer = await buildProductExport(records, categorySlugs);
  const parsedExport = await parseProductWorkbook(Buffer.from(exportBuffer));

  ok = assert(parsedExport.issues.length === 0, `export parses with no issues`) && ok;
  if (parsedExport.issues.length > 0) {
    for (const issue of parsedExport.issues.slice(0, 10)) {
      console.log(`      row ${issue.row} ${issue.column ?? ""}: ${issue.message}`);
    }
  }
  ok =
    assert(
      parsedExport.rows.length === records.length,
      `row count preserved (${parsedExport.rows.length}/${records.length})`,
    ) && ok;
  ok =
    assert(
      parsedExport.unknownHeaders.length === 0,
      `no unrecognised headers${parsedExport.unknownHeaders.length ? `: ${parsedExport.unknownHeaders.join(", ")}` : ""}`,
    ) && ok;

  // Field-level fidelity on every row, not just a spot check.
  const bySlug = new Map(parsedExport.rows.map((row) => [row.slug, row]));
  let mismatches = 0;
  for (const record of records) {
    const parsed = bySlug.get(record.slug);
    if (!parsed) {
      console.log(`      missing after round trip: ${record.slug}`);
      mismatches += 1;
      continue;
    }
    const checks: Array<[string, unknown, unknown]> = [
      ["name", record.name, parsed.name],
      ["status", record.status, parsed.status],
      ["fulfilment", record.fulfilmentMode, parsed.fulfilment],
      ["mfgCost", record.mfgCostPaise / PAISE, parsed.mfgCostInr],
      ["packingCost", record.packingCostPaise / PAISE, parsed.packingCostInr],
      ["length", (record.productLengthMm ?? 0) / MM_PER_CM, parsed.lengthCm],
      ["weight", record.packedWeightGrams ?? 0, parsed.packedWeightGrams],
      ["verified", record.measurementsVerified, parsed.measurementsVerified],
      ["stock", record.stockQty, parsed.stockQty],
    ];
    for (const [field, before, after] of checks) {
      if (before !== after) {
        console.log(`      ${record.slug}.${field}: ${String(before)} -> ${String(after)}`);
        mismatches += 1;
      }
    }
  }
  ok = assert(mismatches === 0, `all field values survive the round trip`) && ok;

  // ---- template -----------------------------------------------------------
  console.log("\nTemplate");
  const templateBuffer = await buildProductTemplate(categorySlugs);
  const parsedTemplate = await parseProductWorkbook(Buffer.from(templateBuffer));

  ok =
    assert(
      parsedTemplate.rows.length === 1,
      `template contains exactly one example row (${parsedTemplate.rows.length})`,
    ) && ok;
  ok =
    assert(
      parsedTemplate.issues.length === 0,
      `template example row is itself valid${parsedTemplate.issues.length ? `: ${parsedTemplate.issues[0].message}` : ""}`,
    ) && ok;
  if (parsedTemplate.rows[0]) {
    const example = parsedTemplate.rows[0];
    ok =
      assert(
        !example.category || categorySlugs.includes(example.category),
        `template example uses a real category ("${example.category}")`,
      ) && ok;
  }

  // ---- computed columns must be ignored ------------------------------------
  console.log("\nSafety");
  const tampered = await buildProductExport(
    records.map((record) => ({ ...record, pricePaise: 99_999_00 })),
    categorySlugs,
  );
  const parsedTampered = await parseProductWorkbook(Buffer.from(tampered));
  const leaked = JSON.stringify(parsedTampered.rows).includes("99999");
  ok = assert(!leaked, "a price edited in the sheet is not read by the importer") && ok;

  console.log(ok ? "\n✓ Excel layer verified." : "\n✗ Excel layer has problems.");
  if (!ok) process.exit(1);
}

main().catch((error) => {
  console.error("Round trip failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
