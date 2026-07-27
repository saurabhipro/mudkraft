/**
 * Prints the derived national price list and verifies the formula against the
 * source workbook.
 *
 *     npm run price:report
 *
 * The parity check is the important part: configured with the workbook's own
 * assumptions (Zone A only, breakage on goods alone) our formula must reproduce
 * its Sale (rounded) column exactly. If that fails, the national numbers below
 * it are not trustworthy either.
 */

import { DEFAULT_ASSUMPTIONS, SHEET_PARITY_ASSUMPTIONS } from "../src/server/pricing/config";
import { computePrice } from "../src/server/pricing/compute";
import { resolveCatalog } from "../src/server/db/seed-data/resolve";

const PAISE_PER_RUPEE = 100;
const GRAMS_PER_KG = 1000;

const rupees = (paise: number) => `₹${(paise / PAISE_PER_RUPEE).toLocaleString("en-IN")}`;
const pad = (s: string, n: number) => s.padEnd(n);
const padStart = (s: string, n: number) => s.padStart(n);

function parityCheck(): boolean {
  console.log("\n── Parity check against kumbhaja_costing_1.xlsx ".padEnd(78, "─"));
  console.log(
    `${pad("Product", 22)}${padStart("sheet", 9)}${padStart("ours", 9)}${padStart("", 8)}`,
  );

  let failures = 0;
  for (const item of resolveCatalog()) {
    if (item.sheetSalePriceInr === undefined) continue;

    // The workbook prices every SKU as if it shipped, so compare on that basis
    // regardless of how we have chosen to fulfil the product.
    const result = computePrice(
      { ...item.costInputs, fulfilmentMode: "ship_nationwide" },
      SHEET_PARITY_ASSUMPTIONS,
    );
    const ours = result.pricePaise / PAISE_PER_RUPEE;
    const matches = ours === item.sheetSalePriceInr;
    if (!matches) failures += 1;

    console.log(
      pad(`${item.entry.name} ${item.sizeLabel}`, 22) +
        padStart(String(item.sheetSalePriceInr), 9) +
        padStart(String(ours), 9) +
        padStart(matches ? "  ✓" : "  ✗ MISMATCH", 8),
    );
  }

  console.log(
    failures === 0
      ? "\n✓ Formula reproduces the workbook exactly at Zone A."
      : `\n✗ ${failures} SKU(s) diverge from the workbook — do not trust the prices below.`,
  );
  return failures === 0;
}

function nationalPriceList(): void {
  console.log("\n── Derived national price list ".padEnd(102, "─"));
  console.log(
    pad("Product", 22) +
      pad("Fulfilment", 20) +
      padStart("kg", 6) +
      padStart("freight", 10) +
      padStart("cost", 9) +
      padStart("PRICE", 9) +
      padStart("MRP", 9) +
      "  status",
  );

  for (const item of resolveCatalog()) {
    const r = computePrice(item.costInputs, DEFAULT_ASSUMPTIONS);
    const flag = item.measurementsVerified ? "" : " ⚠ unverified";

    console.log(
      pad(`${item.entry.name} ${item.sizeLabel}`, 22) +
        pad(item.entry.fulfilmentMode, 20) +
        padStart((r.chargeableWeightGrams / GRAMS_PER_KG).toFixed(1), 6) +
        padStart(rupees(r.blendedShippingPaise), 10) +
        padStart(rupees(r.totalCostPaise), 9) +
        padStart(rupees(r.pricePaise), 9) +
        padStart(rupees(r.mrpPaise), 9) +
        `  ${item.entry.status}${flag}`,
    );
  }
}

function zoneBreakdown(): void {
  console.log("\n── Freight by zone, nationally shipped SKUs ".padEnd(78, "─"));
  const zones = DEFAULT_ASSUMPTIONS.zones;
  console.log(
    pad("Product", 22) + zones.map((z) => padStart(z.code, 8)).join("") + padStart("blended", 10),
  );

  for (const item of resolveCatalog()) {
    if (item.entry.fulfilmentMode !== "ship_nationwide") continue;
    const r = computePrice(item.costInputs, DEFAULT_ASSUMPTIONS);
    console.log(
      pad(`${item.entry.name} ${item.sizeLabel}`, 22) +
        zones
          .map((z) => padStart(rupees(r.zoneShippingPaise[z.code] ?? 0), 8))
          .join("") +
        padStart(rupees(r.blendedShippingPaise), 10),
    );
  }

  console.log(
    `\nZone volume mix: ${zones.map((z) => `${z.code}=${z.weightBps / 100}%`).join("  ")}`,
  );
}

const parityPassed = parityCheck();
nationalPriceList();
zoneBreakdown();

console.log(
  "\n⚠ Zone B–E slab rates and the order-volume mix are assumptions, not your\n" +
    "  Shiprocket rate card. Product dimensions and weights come from the workbook,\n" +
    "  which states they are estimates. Verify both before these prices go live.",
);

if (!parityPassed) process.exit(1);
