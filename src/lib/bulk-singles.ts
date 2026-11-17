/**
 * Drinkware is sold in the shop as packs (sets of 4 or 6), but trade buyers order it by the piece.
 * On the bulk orders page each pack family is replaced by one single-piece entry.
 *
 * A single shows only while its family is live in the shop (some product whose name matches is
 * listed in Bikriup), so listing the Glass packs in Bikriup is what turns on "Glass · Single piece"
 * here too. Nothing to switch on in this file.
 */
export interface BulkSingle {
  /** Line key and the slug sent with the enquiry (Bikriup keeps the name when no product has it). */
  slug: string;
  name: string;
  /** Which shop products belong to this family; they leave the bulk picker when the single shows. */
  matches: RegExp;
  /** A single-piece photo; when absent the family's own shop photo is used. */
  img: string | null;
  /** Price of one piece, in rupees. */
  priceInr: number;
}

export const BULK_SINGLES: BulkSingle[] = [
  // The shop spells it "Kullad"; match kulhad / kullad / kulad alike.
  { slug: "bulk-kulhad-single", name: "Kullad", matches: /\bkul+h?ad/i, img: null, priceInr: 160 },
  {
    slug: "bulk-glass-single",
    name: "Glass",
    matches: /\bglass\b/i,
    img: "/media/bulk/glass-single.webp",
    priceInr: 160,
  },
  {
    slug: "bulk-coffee-mug-single",
    name: "Coffee Mug",
    matches: /\bmug\b/i,
    img: "/media/bulk/mug-single.webp",
    priceInr: 160,
  },
];

export const SINGLE_LABEL = "Single piece";

/**
 * The bulk picker list: shop products, with every live pack family swapped for its single piece
 * (placed where the family's first product was). Returns the list and, for links that name a pack
 * (`?product=glass-set-4` from a product page), the slug of the single that replaced it.
 */
export function withSingles<
  T extends { slug: string; name: string; img: string | null; category: string },
>(
  items: T[],
  makeSingle: (single: BulkSingle, family: T[]) => T,
): { items: T[]; replaced: Map<string, string> } {
  const replaced = new Map<string, string>();
  const familyOf = (item: T) => BULK_SINGLES.find((s) => s.matches.test(item.name));
  const out: T[] = [];
  const added = new Set<string>();
  for (const item of items) {
    const single = familyOf(item);
    if (!single) {
      out.push(item);
      continue;
    }
    replaced.set(item.slug, single.slug);
    if (added.has(single.slug)) continue;
    added.add(single.slug);
    out.push(
      makeSingle(
        single,
        items.filter((i) => familyOf(i) === single),
      ),
    );
  }
  return { items: out, replaced };
}
