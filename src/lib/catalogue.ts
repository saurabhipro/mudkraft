/**
 * The printed product catalogue (public/brochure/), and the details from it
 * that the website repeats.
 */

export const BROCHURE = {
  href: "/brochure/Mudkraft-Catalogue-2026.pdf",
  fileName: "Mudkraft-Catalogue-2026.pdf",
} as const;

/** Catalogue item codes, keyed by product slug, as printed in the brochure. */
export const CATALOGUE_CODES: Record<string, string> = {
  "handi-2-5l": "MUD001",
  "kadhai-3l": "MUD002",
  "bhagona-4l": "MUD003",
  roaster: "MUD004",
  "jug-1-5l": "MUD005",
  "dahi-handi-1-5l": "MUD006",
  "dahi-handi-750g": "MUD007",
};

const LABEL_TO_SLUG: Record<string, string> = {
  handi25l: "handi-2-5l",
  kadhai3l: "kadhai-3l",
  bhagona4l: "bhagona-4l",
  roastertawaonesize: "roaster",
  jug15l: "jug-1-5l",
  dahihandi15l: "dahi-handi-1-5l",
  dahihandismall750g: "dahi-handi-750g",
};

/**
 * The catalogue slug of a product, whatever slug its shop gave it. Bikriup makes slugs from the name
 * and size ("bhagona-4-l"), so a piece is also recognised by its name and size.
 */
export function catalogueSlug(p: { slug: string; name: string; sizeLabel: string }): string | null {
  if (CATALOGUE_CODES[p.slug]) return p.slug;
  const label = `${p.name} ${p.sizeLabel}`.toLowerCase().replace(/[^a-z0-9]+/g, "");
  return LABEL_TO_SLUG[label] ?? null;
}

export const SALES_EMAIL = "sales@mudkraft.com";
export const SALES_PHONE_DISPLAY = "+91 99906 49990";
export const FACEBOOK_URL = "https://www.facebook.com/profile.php?id=61595958894218";
