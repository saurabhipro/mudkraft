export const SITE_URL = "https://www.mudkraft.com";

// Next replaces the layout's `openGraph`/`twitter` objects wholesale when a page
// declares its own, so pages that set them must re-supply the default share card.
// The Mudkraft share card (logo, a piece, the tagline): a JPEG, which WhatsApp previews reliably.
/** IndexNow key: public by design, served at /<key>.txt so Bing can confirm we own the site. */
export const INDEXNOW_KEY = "640047d4cc18a55eb06267b8be79e8e3";

export const OG_IMAGE = `${SITE_URL}/og.jpg`;
