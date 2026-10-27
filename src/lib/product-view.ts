import { cloudinaryUrl } from "./cloudinary";
import { formatPaise } from "./money";

/**
 * The shape the storefront's client components consume.
 *
 * Built on the server from a `StoreProduct` so that client bundles never import
 * anything database- or Cloudinary-secret-adjacent. Money arrives both
 * pre-formatted for display and as integer paise for arithmetic — the client
 * must never parse "₹1,390" back into a number.
 */
export interface ProductView {
  slug: string;
  name: string;
  tag: string;
  note: string;
  /** Display-ready, e.g. "₹1,390". */
  price: string;
  /** Integer paise, for cart totals. Re-verified server-side at checkout. */
  pricePaise: number;
  /** Struck-through MRP, display-ready. Null when there is none. */
  compareAt: string | null;
  /** Pieces left; 0 means sold out. Bikriup reports a large number when stock is plentiful. */
  stockQty: number;
  /** Whole-number percentage off the MRP; 0 when there is none. */
  discountPct: number;
  /** Primary (styled) photograph. Null when the product has no image yet. */
  img: string | null;
  /** Background-removed version, where one exists. */
  cutout: string | null;
  /** Every photograph, cover first (cutouts excluded) — the product page's gallery. */
  gallery: string[];
  category: string | null;
  /** Free-text size, e.g. "2.5 L". What the size picker shows between siblings. */
  sizeLabel: string;
  description: string;
  story: string;
  specs: Array<{ label: string; value: string }>;
  care: string[];
  fulfilmentMode: "ship_nationwide" | "local_delivery_only" | "pickup_only";
}

/** Minimal structural type so this module needn't import the server store. */
interface SourceProduct {
  slug: string;
  name: string;
  tag: string;
  note: string;
  description: string;
  story: string;
  pricePaise: number;
  compareAtPaise: number | null;
  categoryName: string | null;
  sizeLabel: string;
  specs: Array<{ label: string; value: string }>;
  care: string[];
  fulfilmentMode: "ship_nationwide" | "local_delivery_only" | "pickup_only";
  stockQty?: number;
  images: Array<{
    publicId: string;
    version: string | null;
    isPrimary: boolean;
  }>;
}

/**
 * Cutouts are stored beside their original under the same name with this
 * suffix — see scripts/import-product-images.ts. The convention lives here so
 * only one place needs changing if it ever moves to a column.
 */
const CUTOUT_SUFFIX = "-cutout";

export function toProductView(product: SourceProduct): ProductView {
  const primary = product.images.find((image) => image.isPrimary) ?? product.images[0] ?? null;
  const cutout = product.images.find((image) => image.publicId.endsWith(CUTOUT_SUFFIX)) ?? null;

  return {
    slug: product.slug,
    name: product.name,
    tag: product.tag,
    note: product.note,
    price: formatPaise(product.pricePaise),
    pricePaise: product.pricePaise,
    stockQty: product.stockQty ?? 99,
    discountPct:
      product.compareAtPaise && product.compareAtPaise > product.pricePaise
        ? Math.round((1 - product.pricePaise / product.compareAtPaise) * 100)
        : 0,
    compareAt: product.compareAtPaise ? formatPaise(product.compareAtPaise) : null,
    img: primary ? cloudinaryUrl({ publicId: primary.publicId, version: primary.version }) : null,
    cutout: cutout ? cloudinaryUrl({ publicId: cutout.publicId, version: cutout.version }) : null,
    gallery: product.images
      .filter((image) => !image.publicId.endsWith(CUTOUT_SUFFIX))
      .map((image) => cloudinaryUrl({ publicId: image.publicId, version: image.version })),
    category: product.categoryName,
    sizeLabel: product.sizeLabel,
    description: product.description,
    story: product.story,
    specs: product.specs,
    care: product.care,
    fulfilmentMode: product.fulfilmentMode,
  };
}

/**
 * The card and hero layouts are designed around transparent artwork — object-fit
 * contain over a radial gradient, with a drop shadow. Prefer the cutout there
 * and fall back to the styled original.
 */
export function displayImage(product: ProductView): string | null {
  return product.cutout ?? product.img;
}

/**
 * One product in several sizes. The catalogue has no variant model: each size
 * is its own product row (its own slug, price and stock), so the storefront
 * groups rows that share a name and category and offers them as sizes.
 */
export interface ProductFamily {
  key: string;
  name: string;
  category: string | null;
  /** Smallest first. Always at least one. */
  sizes: ProductView[];
}

/** "750 GM" -> 750, "1.5 L" -> 1500; anything unrecognised sorts last. */
function sizeInGrams(label: string): number {
  const match = label.match(/([\d.]+)\s*(l|ltr|litre|liter|g|gm|kg)?/i);
  if (!match) return Number.POSITIVE_INFINITY;
  const value = Number.parseFloat(match[1]);
  const unit = (match[2] ?? "").toLowerCase();
  if (unit === "g" || unit === "gm") return value;
  return value * 1000;
}

/** Groups products into families, keeping the order of each family's first row. */
export function groupFamilies(products: ProductView[]): ProductFamily[] {
  const families = new Map<string, ProductFamily>();
  for (const p of products) {
    const key = `${p.category ?? ""}::${p.name.toLowerCase()}`;
    const family = families.get(key);
    if (family) family.sizes.push(p);
    else families.set(key, { key, name: p.name, category: p.category, sizes: [p] });
  }
  for (const family of families.values()) {
    family.sizes.sort((a, b) => sizeInGrams(a.sizeLabel) - sizeInGrams(b.sizeLabel));
  }
  return [...families.values()];
}
