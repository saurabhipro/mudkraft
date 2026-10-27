/**
 * One-way copy of the Mudkraft catalogue (and reviews) into the shop's Bikriup back office.
 * Reads this site's database only — nothing here writes to Neon.
 *
 *     BIKRIUP_API_URL=http://localhost:8787/api/v1 BIKRIUP_SECRET_KEY=bk_sec_… npm run bikriup:export
 *     … add --dry-run to print what would be sent.
 *
 * Items are matched by slug, so running it again updates prices and details instead of
 * duplicating. Stock is sent as it is here (Bikriup posts the difference as a count adjustment).
 */

import "../src/server/db/load-env";

import { db } from "../src/server/db";
import { CATALOGUE_CODES } from "../src/lib/catalogue";

const API = (process.env.BIKRIUP_API_URL ?? "").replace(/\/$/, "");
const KEY = process.env.BIKRIUP_SECRET_KEY ?? "";
const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
const DRY = process.argv.includes("--dry-run");

// Earthenware kitchen and tableware. Confirm the rate with the shop's CA.
const HSN = "6912";
const GST_RATE = 5;

const FULFILMENT = { ship_nationwide: "ship", local_delivery_only: "local", pickup_only: "pickup" } as const;

const rupees = (paise: number | null | undefined) => (paise ? Math.round(paise) / 100 : 0);

function familyKey(category: string | null, name: string) {
  return `${category ?? "item"}-${name}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// Bikriup keeps a plain URL; the site rebuilds its Cloudinary transformations from it.
function imageUrl(img: { publicId: string; version: string | null; resourceType: string }) {
  return `https://res.cloudinary.com/${CLOUD}/${img.resourceType}/upload/${img.version ? `v${img.version}/` : ""}${img.publicId}`;
}

async function post(path: string, body: unknown) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${path}: ${res.status} ${data.error ?? ""}`);
  return data;
}

async function main() {
  if (!DRY && (!API || !KEY)) throw new Error("Set BIKRIUP_API_URL and BIKRIUP_SECRET_KEY");
  if (!CLOUD) throw new Error("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not set");

  const rows = await db.query.product.findMany({ with: { category: true, images: true } });
  const products = rows
    .filter((p) => p.status !== "archived")
    .map((p) => {
      const images = p.images
        .slice()
        .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.sortOrder - b.sortOrder)
        .map((img) => ({ url: imageUrl(img), alt: img.alt }));
      return {
        slug: p.slug,
        name: p.name,
        code: CATALOGUE_CODES[p.slug],
        category: p.category?.name ?? "",
        // The card's small line ("Cookware · 4 L") and the hand-written note.
        type: p.tag,
        description: p.description || p.note,
        story: p.story,
        size_label: p.sizeLabel,
        style_group: familyKey(p.category?.name ?? null, p.name),
        price: rupees(p.pricePaise),
        mrp: rupees(p.compareAtPaise) || rupees(p.pricePaise),
        cost_price: rupees(p.totalCostPaise),
        stock_qty: p.trackInventory ? p.stockQty : 0,
        gst_rate: GST_RATE,
        hsn: HSN,
        specs: p.specs,
        care: p.care,
        dimensions_mm: { length: p.productLengthMm, width: p.productWidthMm, height: p.productHeightMm },
        weight_g: p.packedWeightGrams,
        fulfilment: FULFILMENT[p.fulfilmentMode],
        listed: p.status === "active",
        images,
      };
    });

  console.log(`${products.length} products (${products.filter((p) => p.listed).length} listed)`);
  if (DRY) {
    console.log(JSON.stringify(products.slice(0, 2), null, 2));
    return;
  }
  const out = await post("/products/bulk", { products });
  console.log(`created ${out.created}, updated ${out.updated}`);
  for (const e of out.errors ?? []) console.warn(`  ${e.slug}: ${e.error}`);

  const reviews = await db.query.review.findMany({ with: { product: true } });
  if (reviews.length) {
    const sent = await post("/reviews/import", {
      reviews: reviews.map((r) => ({
        product: r.product?.slug,
        name: r.authorName,
        city: r.authorCity,
        rating: r.rating,
        title: r.title,
        body: r.body,
        photo: r.photoPublicId ? `https://res.cloudinary.com/${CLOUD}/image/upload/${r.photoPublicId}` : "",
        status: r.status,
        verified: r.verifiedPurchase,
        created_at: r.createdAt.toISOString(),
      })),
    });
    console.log(`reviews imported ${sent.imported}`);
  } else {
    console.log("no reviews to copy");
  }
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err.message);
  process.exit(1);
});
