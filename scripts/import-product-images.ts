/**
 * Uploads the product photography to Cloudinary and links it to products.
 *
 *     npx tsx scripts/import-product-images.ts [--dry-run]
 *
 * For every source file two assets are created: the original styled photograph,
 * and a background-removed cutout (Cloudinary AI Background Removal add-on).
 * The original is the primary image — the styled shots are the brand's look;
 * the cutouts exist for grids and hero placements that need transparency.
 *
 * Each file uploads ONCE even when several products share it, so a shared photo
 * never burns two removal credits. Re-running is safe: an image already linked
 * to a product by public_id is skipped.
 */

import "../src/server/db/load-env";

import { eq } from "drizzle-orm";
import { v2 as cloudinary } from "cloudinary";

import { db } from "../src/server/db";
import { product, productImage } from "../src/server/db/schema/catalog";

const SOURCE_DIR = "E:/level40wellness/kumbhaja";
const FOLDER = "mudkraft/products";
const DRY_RUN = process.argv.includes("--dry-run");

const POLL_INTERVAL_MS = 4000;
const MAX_POLLS = 20;

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Product slug -> source files, in display order.
 *
 * Mapping decisions, all confirmed rather than inferred from filenames:
 *  - glass.jpeg photographs SIX tumblers, so it belongs to glass-set-6, not the
 *    single glass. cup.jpeg photographs FOUR mugs, matching cup-set-4.
 *  - water-tank.jpeg and water-tank-2.jpeg are the same vessel, lid off and lid
 *    on, so both go to the 10 L only. The 18 L is left unillustrated rather
 *    than shown as a pot it is not.
 *  - bhagona-4l has no photograph of its own. water-tank.jpeg is reused by
 *    explicit instruction; the alt text records that it is a stand-in so the
 *    substitution is never silently forgotten.
 */
const IMAGE_MAP: Array<{ slug: string; files: string[]; altOverride?: string }> = [
  { slug: "handi-2-5l", files: ["handi.jpeg"] },
  { slug: "kadhai-3l", files: ["kadhai.jpeg"] },
  { slug: "roaster", files: ["roaster.jpeg"] },
  { slug: "jug-1-5l", files: ["jug.jpeg"] },
  { slug: "dahi-handi-1-5l", files: ["dahi-handi.jpeg"] },
  { slug: "dahi-handi-750g", files: ["dahi-handi.jpeg"] },
  { slug: "water-tank-10l", files: ["water-tank.jpeg", "water-tank-2.jpeg"] },
  { slug: "water-bottle-1l", files: ["water-bottle.jpeg"] },
  { slug: "cup-set-4", files: ["cup.jpeg"] },
  { slug: "glass-set-6", files: ["glass.jpeg"] },
  {
    slug: "bhagona-4l",
    files: ["water-tank.jpeg"],
    altOverride:
      "Stand-in photograph — shows a similar wide-mouthed clay cooking pot, not the Bhagona itself. Replace once the Bhagona is photographed.",
  },
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface UploadedAsset {
  publicId: string;
  version: string;
  format: string | null;
  width: number | null;
  height: number | null;
}

function baseName(file: string): string {
  return file.replace(/\.[^.]+$/, "");
}

async function uploadOriginal(file: string): Promise<UploadedAsset> {
  const result = await cloudinary.uploader.upload(`${SOURCE_DIR}/${file}`, {
    public_id: `${FOLDER}/${baseName(file)}`,
    overwrite: true,
  });
  return {
    publicId: result.public_id,
    version: String(result.version),
    format: result.format ?? null,
    width: result.width ?? null,
    height: result.height ?? null,
  };
}

async function uploadCutout(file: string): Promise<UploadedAsset> {
  const publicId = `${FOLDER}/${baseName(file)}-cutout`;

  await cloudinary.uploader.upload(`${SOURCE_DIR}/${file}`, {
    public_id: publicId,
    overwrite: true,
    background_removal: "cloudinary_ai",
  });

  // Removal is asynchronous and replaces the asset in place (converting it to
  // PNG so transparency survives). Read the final version back rather than
  // using the one returned at upload time, which predates processing.
  for (let attempt = 0; attempt < MAX_POLLS; attempt += 1) {
    const current = (await cloudinary.api.resource(publicId)) as unknown as {
      version?: number;
      format?: string;
      width?: number;
      height?: number;
      info?: { background_removal?: Record<string, { status?: string }> };
    };
    const status = current.info?.background_removal?.cloudinary_ai?.status;

    if (status === "complete") {
      return {
        publicId,
        version: String(current.version ?? ""),
        format: current.format ?? null,
        width: current.width ?? null,
        height: current.height ?? null,
      };
    }
    if (status && status !== "pending") {
      throw new Error(`Background removal for ${file} reported status "${status}".`);
    }
    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error(`Background removal for ${file} did not finish within the timeout.`);
}

async function main() {
  console.log(DRY_RUN ? "DRY RUN — nothing will be uploaded or written.\n" : "");

  const slugs = [...new Set(IMAGE_MAP.map((entry) => entry.slug))];
  const products = await db
    .select({ id: product.id, slug: product.slug, name: product.name, sizeLabel: product.sizeLabel })
    .from(product);
  const bySlug = new Map(products.map((p) => [p.slug, p]));

  const missing = slugs.filter((slug) => !bySlug.has(slug));
  if (missing.length > 0) {
    throw new Error(`These slugs are not in the database: ${missing.join(", ")}`);
  }

  // Upload each distinct file once, even where two products share it.
  const uniqueFiles = [...new Set(IMAGE_MAP.flatMap((entry) => entry.files))];
  console.log(`${uniqueFiles.length} source files -> ${uniqueFiles.length * 2} Cloudinary assets\n`);

  const assets = new Map<string, { original: UploadedAsset; cutout: UploadedAsset }>();

  for (const file of uniqueFiles) {
    if (DRY_RUN) {
      console.log(`  would upload ${file} (original + cutout)`);
      continue;
    }
    process.stdout.write(`  ${file} … `);
    const original = await uploadOriginal(file);
    process.stdout.write("original ok, removing background … ");
    const cutout = await uploadCutout(file);
    console.log("cutout ok");
    assets.set(file, { original, cutout });
  }

  if (DRY_RUN) {
    console.log("\nPlanned links:");
    for (const entry of IMAGE_MAP) {
      const p = bySlug.get(entry.slug)!;
      console.log(`  ${p.name} ${p.sizeLabel} (${entry.slug}) <- ${entry.files.join(", ")}`);
    }
    return;
  }

  console.log("\nLinking to products:");
  let inserted = 0;
  let skipped = 0;

  for (const entry of IMAGE_MAP) {
    const target = bySlug.get(entry.slug)!;
    const existing = await db
      .select({ publicId: productImage.publicId })
      .from(productImage)
      .where(eq(productImage.productId, target.id));
    const alreadyLinked = new Set(existing.map((row) => row.publicId));

    let sortOrder = existing.length;

    for (const [fileIndex, file] of entry.files.entries()) {
      const pair = assets.get(file)!;
      const alt =
        entry.altOverride ?? `${target.name} ${target.sizeLabel} — handcrafted terracotta`.trim();

      for (const [variantIndex, asset] of [pair.original, pair.cutout].entries()) {
        if (alreadyLinked.has(asset.publicId)) {
          skipped += 1;
          continue;
        }

        await db.insert(productImage).values({
          productId: target.id,
          publicId: asset.publicId,
          version: asset.version,
          resourceType: "image",
          format: asset.format,
          width: asset.width,
          height: asset.height,
          alt,
          // The styled original leads; only the very first image of the first
          // file may be primary, because a partial unique index permits exactly
          // one primary row per product.
          isPrimary: existing.length === 0 && fileIndex === 0 && variantIndex === 0,
          sortOrder: sortOrder++,
        });
        inserted += 1;
      }
    }

    console.log(`  ${target.name} ${target.sizeLabel} (${entry.slug})`);
  }

  console.log(`\nInserted ${inserted} image rows, skipped ${skipped} already linked.`);
  console.log("Products with no photograph: water-tank-18l, glass, cup-set-6.");
}

main().catch((error) => {
  console.error("\nImport failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
