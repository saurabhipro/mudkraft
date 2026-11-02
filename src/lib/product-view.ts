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
  /** Alt text Bikriup holds for a photograph, keyed by its URL. Photos without one are not listed. */
  imageAlts: Record<string, string>;
  category: string | null;
  /** Free-text size, e.g. "2.5 L". What the size picker shows between siblings. */
  sizeLabel: string;
  /** Outside measurements, whole centimetres; null when the shop has not entered them. */
  widthCm: number | null;
  heightCm: number | null;
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
  widthMm?: number | null;
  heightMm?: number | null;
  specs: Array<{ label: string; value: string }>;
  care: string[];
  fulfilmentMode: "ship_nationwide" | "local_delivery_only" | "pickup_only";
  stockQty?: number;
  images: Array<{
    publicId: string;
    version: string | null;
    isPrimary: boolean;
    alt?: string;
  }>;
}

/**
 * Cutouts are stored beside their original under the same name with this
 * suffix — see scripts/import-product-images.ts. The convention lives here so
 * only one place needs changing if it ever moves to a column.
 */
const CUTOUT_SUFFIX = "-cutout";

/** Sizes are capacities: Bikriup may hold a bare "4" or "1.5", which means litres. */
export function withUnit(label: string): string {
  const t = label.trim();
  return /^\d+(\.\d+)?$/.test(t) ? `${t} L` : t;
}

const toCm = (mm: number | null | undefined) => (mm && mm > 0 ? Math.round(mm / 10) : null);

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
    imageAlts: Object.fromEntries(
      product.images
        // Bikriup fills a photo's alt with the product name when the shop wrote none; that says
        // less than the keyword fallback the pages use, so only a deliberate description counts.
        .filter((image) => image.alt?.trim() && image.alt.trim().toLowerCase() !== product.name.trim().toLowerCase())
        .map((image) => [cloudinaryUrl({ publicId: image.publicId, version: image.version }), image.alt!.trim()]),
    ),
    category: product.categoryName,
    sizeLabel: withUnit(product.sizeLabel),
    widthCm: toCm(product.widthMm),
    heightCm: toCm(product.heightMm),
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
 * One product type in several variants. The catalogue has no variant model: each
 * size is its own product row (its own slug, price and stock), so the storefront
 * groups rows that share a product type (Handi: Handi, Dahi Handi, Dahi Handi · Small)
 * and offers them as variants. Rows without a type group by name.
 */
export interface ProductFamily {
  key: string;
  name: string;
  category: string | null;
  /** Every category its variants sit in, so a type shows under each filter. */
  categories: string[];
  /** Grouped by name, smallest first within a name. Always at least one. */
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

/** Groups products into families by type, keeping the order of each family's first row. */
export function groupFamilies(products: ProductView[]): ProductFamily[] {
  const families = new Map<string, ProductFamily>();
  for (const p of products) {
    const type = p.tag.trim();
    const key = type ? `type::${type.toLowerCase()}` : `name::${p.category ?? ""}::${p.name.toLowerCase()}`;
    const family = families.get(key);
    if (family) {
      family.sizes.push(p);
      if (p.category && !family.categories.includes(p.category)) family.categories.push(p.category);
    } else {
      families.set(key, { key, name: type || p.name, category: p.category, categories: p.category ? [p.category] : [], sizes: [p] });
    }
  }
  for (const family of families.values()) {
    family.sizes.sort((a, b) => a.name.localeCompare(b.name) || sizeInGrams(a.sizeLabel) - sizeInGrams(b.sizeLabel));
  }
  return [...families.values()];
}

/** What a variant chip says: the size when every variant shares a name, else name and size. */
export function variantLabel(variant: ProductView, family: ProductView[]): string {
  const oneName = family.every((v) => v.name === variant.name);
  if (oneName) return variant.sizeLabel || "One size";
  return variant.sizeLabel ? `${variant.name} · ${variant.sizeLabel}` : variant.name;
}
