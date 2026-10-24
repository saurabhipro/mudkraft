/**
 * The printed product catalogue (public/brochure/), and the details from it
 * that the website repeats.
 *
 * Page images are pre-rendered from the PDF so the in-page preview opens fast;
 * the 4.3 MB PDF itself is only fetched when someone taps Download. When the
 * PDF is replaced, re-render the page-N / thumb-N webps and update BROCHURE.
 */

export const BROCHURE = {
  title: "Mudkraft catalogue 2026",
  href: "/brochure/Mudkraft-Catalogue-2026.pdf",
  fileName: "Mudkraft-Catalogue-2026.pdf",
  sizeLabel: "4.3 MB",
  pages: [
    "Cover",
    "Our story",
    "Benefits of clay",
    "Soil report",
    "Cookware",
    "Serveware",
    "Care guide",
    "Workshops & orders",
  ].map((label, i) => ({
    label,
    src: `/brochure/page-${i + 1}.webp`,
    thumb: `/brochure/thumb-${i + 1}.webp`,
  })),
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
