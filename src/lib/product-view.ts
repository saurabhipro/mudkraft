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
  /** Integer paise of the MRP, for working out the discount. */
  compareAtPaise: number | null;
  /** Primary (styled) photograph. Null when the product has no image yet. */
  img: string | null;
  /** Background-removed version, where one exists. */
  cutout: string | null;
  category: string | null;
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
  specs: Array<{ label: string; value: string }>;
  care: string[];
  fulfilmentMode: "ship_nationwide" | "local_delivery_only" | "pickup_only";
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
    compareAt: product.compareAtPaise ? formatPaise(product.compareAtPaise) : null,
    compareAtPaise: product.compareAtPaise ?? null,
    img: primary ? cloudinaryUrl({ publicId: primary.publicId, version: primary.version }) : null,
    cutout: cutout ? cloudinaryUrl({ publicId: cutout.publicId, version: cutout.version }) : null,
    category: product.categoryName,
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
