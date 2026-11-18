/**
 * Adds the clay Glass and Coffee Mug packs (sets of 4 and 6) to the shop's Bikriup back office,
 * UNLISTED: they are saved as products but stay off the website until someone ticks "listed" in
 * Bikriup › Products after review. Listing them also turns on their single-piece entries on the
 * bulk orders page (src/lib/bulk-singles.ts).
 *
 *     BIKRIUP_API_URL=… BIKRIUP_SECRET_KEY=bk_sec_… npx tsx scripts/add-drinkware.ts [--dry-run]
 *
 * Production's secret key stays on the VM: upload the photos and write the request body here with
 * `--out drinkware.json`, copy the file to the VM, and post it there:
 *
 *     curl -fsS -X POST http://127.0.0.1:8787/api/v1/products/bulk -H "Content-Type: application/json" \
 *       -H "Authorization: Bearer $BIKRIUP_SECRET_KEY" --data @drinkware.json
 *
 * Photos come from scripts/fixtures/drinkware/ and are uploaded to Cloudinary (overwriting the same
 * public ids, so re-running is safe). Items are matched by slug, so running again updates them.
 * Every run saves them unlisted (Bikriup lists new items by default). Once they are live, re-run
 * with --keep-listing to update details without hiding them again, or with --images-only to swap
 * just the photos (price, stock, listing and the rest stay as they are in Bikriup).
 *
 * Prices follow the kulhad: ₹600 for 4, ₹900 for 6. Box sizes and weights are rough estimates
 * scaled from the kulhad set (taller pieces, so a taller box); weigh a packed set and correct them
 * in Bikriup before shipping, as Shiprocket rates are worked out from them.
 */

import "../src/server/db/load-env";

import { writeFileSync } from "node:fs";
import path from "node:path";
import { v2 as cloudinary } from "cloudinary";

const API = (process.env.BIKRIUP_API_URL ?? "").replace(/\/$/, "");
const KEY = process.env.BIKRIUP_SECRET_KEY ?? "";
const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
const DRY = process.argv.includes("--dry-run");
const IMAGES_ONLY = process.argv.includes("--images-only");
const KEEP_LISTING = IMAGES_ONLY || process.argv.includes("--keep-listing");
const OUT = process.argv.includes("--out") ? process.argv[process.argv.indexOf("--out") + 1] : "";

const PHOTOS = path.join(__dirname, "fixtures", "drinkware");
const FOLDER = "mudkraft/products";

const CARE = [
  "Rinse with warm water — no detergent.",
  "Air-dry upside down between uses.",
  "Handle gently; unglazed clay chips at the rim.",
];

interface Pack {
  slug: string;
  name: string;
  code: string;
  pieces: 4 | 6;
  price: number;
  /** Photo in fixtures/drinkware/, showing as many pieces as the pack holds. */
  photo: "glass-set4" | "glass-set" | "mug-set";
  note: string;
  dims: { length: number; width: number; height: number };
  weight_g: number;
}

const PACKS: Pack[] = [
  {
    slug: "glass-set-4",
    name: "Glass",
    code: "MK011",
    pieces: 4,
    price: 600,
    photo: "glass-set4",
    note: "A tumbler of cool earth",
    dims: { length: 180, width: 180, height: 120 },
    weight_g: 1000,
  },
  {
    slug: "glass-set-6",
    name: "Glass",
    code: "MK012",
    pieces: 6,
    price: 900,
    photo: "glass-set",
    note: "A table's worth of clay",
    dims: { length: 270, width: 180, height: 120 },
    weight_g: 1500,
  },
  {
    slug: "coffee-mug-set-4",
    name: "Coffee Mug",
    code: "MK013",
    pieces: 4,
    price: 600,
    photo: "mug-set",
    note: "Morning coffee, held in clay",
    dims: { length: 220, width: 220, height: 120 },
    weight_g: 1100,
  },
  {
    slug: "coffee-mug-set-6",
    name: "Coffee Mug",
    code: "MK014",
    pieces: 6,
    price: 900,
    photo: "mug-set",
    note: "Six mugs for the whole table",
    dims: { length: 330, width: 220, height: 120 },
    weight_g: 1650,
  },
];

cloudinary.config({
  cloud_name: CLOUD,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/** Uploads one photo and its cutout; returns the plain URLs Bikriup keeps (cover first). */
async function uploadPhoto(name: Pack["photo"], alt: string) {
  const out: Array<{ url: string; alt: string }> = [];
  for (const [file, id] of [
    [`${name}.jpg`, `${name}-1`],
    [`${name}-cutout.png`, `${name}-1-cutout`],
  ]) {
    const r = await cloudinary.uploader.upload(path.join(PHOTOS, file), {
      public_id: `${FOLDER}/${id}`,
      overwrite: true,
    });
    out.push({
      url: `https://res.cloudinary.com/${CLOUD}/image/upload/v${r.version}/${r.public_id}`,
      alt,
    });
  }
  return out;
}

async function main() {
  if (!DRY && !OUT && (!API || !KEY)) throw new Error("Set BIKRIUP_API_URL and BIKRIUP_SECRET_KEY");
  if (!CLOUD) throw new Error("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not set");

  const photos = new Map<Pack["photo"], Array<{ url: string; alt: string }>>();
  if (!DRY) {
    photos.set(
      "glass-set",
      await uploadPhoto("glass-set", "Handmade clay glasses, a set of terracotta tumblers"),
    );
    photos.set(
      "glass-set4",
      await uploadPhoto("glass-set4", "Four handmade clay glasses, a set of terracotta tumblers"),
    );
    photos.set("mug-set", await uploadPhoto("mug-set", "Handmade clay coffee mugs with handles"));
  }

  const full = PACKS.map((p) => ({
    slug: p.slug,
    name: p.name,
    code: p.code,
    brand: "Mudkraft",
    category: "Drinkware",
    // The storefront groups cards by type, so the type is the product (like "Handi"), not the pack.
    type: p.name,
    size_label: `Set of ${p.pieces}`,
    // Same group for both sizes, so the shop shows one page with a 4 / 6 choice.
    style_group: `drinkware-${p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    description: p.note,
    price: p.price,
    mrp: p.price,
    gst_rate: 5,
    hsn: "6912",
    specs: [{ label: "Pieces", value: String(p.pieces) }],
    care: CARE,
    dimensions_mm: p.dims,
    weight_g: p.weight_g,
    fulfilment: "ship",
    // Hidden until reviewed. Bikriup lists a new item unless told otherwise.
    ...(KEEP_LISTING ? {} : { listed: false }),
    ...(photos.get(p.photo) ? { images: photos.get(p.photo) } : {}),
  }));
  // gst_rate goes along so Bikriup does not fall back to its price slabs for the rate.
  const products = IMAGES_ONLY
    ? full.map(({ slug, gst_rate, images }) => ({ slug, gst_rate, ...(images ? { images } : {}) }))
    : full;

  if (DRY) {
    console.log(JSON.stringify(products, null, 2));
    return;
  }
  if (OUT) {
    writeFileSync(OUT, JSON.stringify({ products }));
    console.log(`wrote ${products.length} products to ${OUT}`);
    return;
  }

  const res = await fetch(`${API}/products/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ products }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`/products/bulk: ${res.status} ${data.error ?? ""}`);
  console.log(`created ${data.created}, updated ${data.updated}`);
  for (const e of data.errors ?? []) console.warn(`  ${e.slug}: ${e.error}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
