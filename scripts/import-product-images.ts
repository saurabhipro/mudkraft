/**
 * Uploads the product photography to Cloudinary and links it to products.
 *
 *     npx tsx scripts/import-product-images.ts --dir "<photos folder>" [--replace] [--dry-run]
 *
 * Every source file is uploaded as an original. Only each product's main shot
 * (the first file in its entry) also gets a background-removed cutout
 * (Cloudinary AI Background Removal add-on): the storefront only ever shows
 * the cutout of the primary photo, so cutting out the extra angles would burn
 * removal credits for nothing.
 *
 * Each file uploads ONCE even when several products share it (the two Handi
 * sizes share their photographs). Re-running is safe: an image already linked
 * to a product by public_id is skipped.
 *
 * --replace first unlinks the products' existing images (database rows only).
 * The Cloudinary assets are left in place, since an old photo may still be
 * linked to another product, archived or not.
 *
 * Run from Windows: this repo's node_modules is the Windows build. A folder in
 * WSL is reachable as \\wsl$\<distro>\home\<user>\...
 */

import "../src/server/db/load-env";

import { eq, inArray } from "drizzle-orm";
import { v2 as cloudinary } from "cloudinary";

import { db } from "../src/server/db";
import { product, productImage } from "../src/server/db/schema/catalog";

const FOLDER = "mudkraft/products";
const DRY_RUN = process.argv.includes("--dry-run");
const REPLACE = process.argv.includes("--replace");

function argValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

const SOURCE_DIR = argValue("--dir");

const POLL_INTERVAL_MS = 4000;
const MAX_POLLS = 20;

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Source photo -> Cloudinary name. Names come from the product rather than the
 * file, because the folders reuse file names (01.jpg, 022.jpg in each).
 */
interface SourceFile {
  path: string;
  name: string;
}

const HANDI = "1.50 and 2.5 ltr cooking Handi";
const KADHAI = "3 liter kadahi";
const BHAGONA = "Bhagona 4 liter";

const handiPhotos: SourceFile[] = [
  { path: `${HANDI}/01.jpg`, name: "handi-1" },
  { path: `${HANDI}/033.jpg`, name: "handi-2" },
  { path: `${HANDI}/022.jpg`, name: "handi-3" },
];

/**
 * Product slug -> photos in display order; the first is the main shot (primary
 * image, and the only one cut out). Both Handi sizes are the same pot shape and
 * were photographed together, so they share one set.
 */
const IMAGE_MAP: Array<{ slug: string; files: SourceFile[] }> = [
  { slug: "handi-2-5l", files: handiPhotos },
  { slug: "handi-1-5l", files: handiPhotos },
  {
    slug: "kadhai-3l",
    files: [
      { path: `${KADHAI}/kadahi_3ltr.jpg`, name: "kadhai-1" },
      { path: `${KADHAI}/022.jpg`, name: "kadhai-2" },
      { path: `${KADHAI}/033.jpg`, name: "kadhai-3" },
    ],
  },
  {
    slug: "bhagona-4l",
    files: [
      { path: `${BHAGONA}/01.jpg`, name: "bhagona-1" },
      { path: `${BHAGONA}/022.jpg`, name: "bhagona-2" },
      { path: `${BHAGONA}/0333.jpg`, name: "bhagona-3" },
    ],
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

async function uploadOriginal(file: SourceFile): Promise<UploadedAsset> {
  const result = await cloudinary.uploader.upload(`${SOURCE_DIR}/${file.path}`, {
    public_id: `${FOLDER}/${file.name}`,
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

async function uploadCutout(file: SourceFile): Promise<UploadedAsset> {
  const publicId = `${FOLDER}/${file.name}-cutout`;

  await cloudinary.uploader.upload(`${SOURCE_DIR}/${file.path}`, {
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
      throw new Error(`Background removal for ${file.path} reported status "${status}".`);
    }
    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error(`Background removal for ${file.path} did not finish within the timeout.`);
}

async function main() {
  if (!SOURCE_DIR) throw new Error('Pass the photos folder: --dir "<path>"');
  console.log(DRY_RUN ? "DRY RUN — nothing will be uploaded or written.\n" : "");

  const slugs = [...new Set(IMAGE_MAP.map((entry) => entry.slug))];
  const products = await db
    .select({
      id: product.id,
      slug: product.slug,
      name: product.name,
      sizeLabel: product.sizeLabel,
    })
    .from(product);
  const bySlug = new Map(products.map((p) => [p.slug, p]));

  const missing = slugs.filter((slug) => !bySlug.has(slug));
  if (missing.length > 0) {
    throw new Error(`These slugs are not in the database: ${missing.join(", ")}`);
  }

  // Upload each distinct file once, even where two products share it. Only a
  // file that leads some product's list gets a cutout.
  const files = new Map<string, SourceFile>();
  const mainShots = new Set(IMAGE_MAP.map((entry) => entry.files[0].name));
  for (const entry of IMAGE_MAP) for (const file of entry.files) files.set(file.name, file);
  console.log(
    `${files.size} source files -> ${files.size + mainShots.size} Cloudinary assets ` +
      `(${mainShots.size} background removals)\n`,
  );

  const assets = new Map<string, { original: UploadedAsset; cutout: UploadedAsset | null }>();

  for (const file of files.values()) {
    const wantsCutout = mainShots.has(file.name);
    if (DRY_RUN) {
      console.log(`  would upload ${file.path} as ${file.name}${wantsCutout ? " (+ cutout)" : ""}`);
      continue;
    }
    process.stdout.write(`  ${file.path} … `);
    const original = await uploadOriginal(file);
    let cutout: UploadedAsset | null = null;
    if (wantsCutout) {
      process.stdout.write("original ok, removing background … ");
      cutout = await uploadCutout(file);
    }
    console.log("ok");
    assets.set(file.name, { original, cutout });
  }

  if (DRY_RUN) {
    console.log("\nPlanned links:");
    for (const entry of IMAGE_MAP) {
      const p = bySlug.get(entry.slug)!;
      console.log(
        `  ${p.name} ${p.sizeLabel} (${entry.slug}) <- ${entry.files.map((f) => f.name).join(", ")}`,
      );
    }
    if (REPLACE) console.log("\n--replace: their existing image rows would be unlinked first.");
    return;
  }

  if (REPLACE) {
    const ids = slugs.map((slug) => bySlug.get(slug)!.id);
    const removed = await db
      .delete(productImage)
      .where(inArray(productImage.productId, ids))
      .returning({ id: productImage.id });
    console.log(`\nUnlinked ${removed.length} existing image rows (Cloudinary assets kept).`);
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
    const alt = `${target.name} ${target.sizeLabel} — handcrafted terracotta`.trim();

    for (const [fileIndex, file] of entry.files.entries()) {
      const pair = assets.get(file.name)!;
      const variants = pair.cutout ? [pair.original, pair.cutout] : [pair.original];

      for (const [variantIndex, asset] of variants.entries()) {
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
          // The main shot's original leads; only the very first image of the
          // first file may be primary, because a partial unique index permits
          // exactly one primary row per product.
          isPrimary: existing.length === 0 && fileIndex === 0 && variantIndex === 0,
          sortOrder: sortOrder++,
        });
        inserted += 1;
      }
    }

    console.log(`  ${target.name} ${target.sizeLabel} (${entry.slug})`);
  }

  console.log(`\nInserted ${inserted} image rows, skipped ${skipped} already linked.`);
  console.log('Press "Re-price all products" in /admin to refresh the live pages.');
}

main().catch((error) => {
  console.error("\nImport failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
