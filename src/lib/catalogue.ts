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

export const SALES_EMAIL = "sales@mudkraft.com";
export const SALES_PHONE_DISPLAY = "+91 99906 49990";
export const FACEBOOK_URL = "https://www.facebook.com/profile.php?id=61595958894218";
