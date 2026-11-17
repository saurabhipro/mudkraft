import type { ProductView } from "@/lib/product-view";

/**
 * The <meta name="keywords"> for every page, kept in one list so they are reviewed and edited
 * together. Each page names what it is actually about, in the words people search with
 * (English, and Hindi in Latin script). Product pages build theirs from the product: productKeywords().
 *
 * Google ignores this tag for ranking; Bing and some smaller engines read it. Keep each list
 * short and true to its page: a long list repeated across pages reads as keyword stuffing.
 */

const BRAND = ["Mudkraft", "Mudkraft clay", "Khurja pottery"];

export const KEYWORDS: Record<string, string[]> = {
  "/": [
    ...BRAND,
    "handmade clay cookware",
    "mitti ke bartan",
    "unglazed clay pots",
    "clay handi",
    "clay kadai",
    "clay matka",
    "buy clay cookware online India",
  ],
  "/shop": [
    "buy clay cookware online",
    "mitti ke bartan online",
    "clay handi",
    "clay kadai",
    "dahi handi",
    "clay kullad",
    "clay water pot",
    "handmade clay serveware",
    "Mudkraft shop",
  ],
  "/clay-cookware": [
    "clay cookware",
    "unglazed clay cookware",
    "mitti ke bartan",
    "earthen cookware",
    "clay pots for cooking",
    "handmade clay cookware India",
    "Mudkraft",
  ],
  "/clay-handi": [
    "clay handi",
    "mitti ki handi",
    "unglazed clay handi",
    "clay handi for cooking",
    "clay pot for dal",
    "clay biryani handi",
    "buy clay handi online",
    "Mudkraft",
  ],
  "/clay-kadai": [
    "clay kadai",
    "clay kadhai",
    "mitti ki kadai",
    "unglazed clay kadai",
    "clay kadai for cooking",
    "buy clay kadai online",
    "Mudkraft",
  ],
  "/dahi-handi": [
    "dahi handi",
    "clay pot for curd",
    "mitti ki dahi handi",
    "curd setting pot",
    "unglazed clay dahi handi",
    "buy dahi handi online",
    "Mudkraft",
  ],
  "/clay-water-pot": [
    "clay water pot",
    "matka",
    "mitti ka matka",
    "clay water bottle",
    "clay jug",
    "earthen water pot",
    "buy matka online",
    "Mudkraft",
  ],
  "/benefits": [
    "benefits of clay cookware",
    "benefits of matka water",
    "is clay cookware healthy",
    "lab-tested clay",
    "lead-free clay cookware",
    "unglazed clay benefits",
  ],
  "/workshops": [
    "pottery workshop",
    "pottery class",
    "wheel throwing class",
    "Khurja pottery workshop",
    "learn pottery",
    "Mudkraft workshops",
  ],
  "/bulk-orders": [
    "bulk clay cookware",
    "wholesale clay pots",
    "clay kullad bulk order",
    "custom pottery order",
    "corporate gifting pottery",
    "clay serveware for cafes and hotels",
    "Mudkraft bulk orders",
  ],
  "/soil-report": [
    "clay lab report",
    "lead-free clay",
    "food-safe clay",
    "clay cookware safety test",
    "CGCRI clay test",
    "Mudkraft soil report",
  ],
  "/videos": ["pottery videos", "potter's wheel", "how clay pots are made", "Khurja pottery", "Mudkraft videos"],
  "/journal": [
    "clay cooking guide",
    "clay cookware care",
    "how to season a clay pot",
    "mitti ke bartan guide",
    "Mudkraft journal",
  ],
  "/journal/how-to-cook-dal-in-a-clay-handi": [
    "how to cook dal in a clay handi",
    "dal in clay pot",
    "mitti ki handi dal",
    "clay pot recipe",
    "clay handi cooking",
  ],
  "/journal/is-clay-cookware-safe": [
    "is clay cookware safe",
    "lead in clay pots",
    "food-safe clay cookware",
    "clay cookware lab test",
    "unglazed clay safety",
  ],
  "/journal/clay-vs-steel-vs-non-stick-for-dal": [
    "clay vs steel",
    "clay vs non-stick",
    "best pot for dal",
    "clay pot vs pressure cooker",
    "healthy cookware for dal",
  ],
  "/journal/mitti-ke-bartan-buying-guide": [
    "mitti ke bartan",
    "mitti ke bartan buying guide",
    "how to choose clay cookware",
    "clay handi size",
    "earthen cookware guide",
  ],
  "/journal/benefits-of-clay-water-pots": [
    "matka water benefits",
    "clay water pot benefits",
    "how matka cools water",
    "how to season a matka",
    "mitti ka matka",
  ],
  "/care/season-your-handi": [
    "how to season a clay handi",
    "season clay pot",
    "clay pot first use",
    "clay cookware care",
    "mitti ki handi seasoning",
  ],
  "/faq": ["Mudkraft FAQ", "clay cookware questions", "clay pot care", "clay cookware delivery", "is clay cookware safe"],
  "/shipping-returns": [
    "Mudkraft shipping",
    "Mudkraft returns",
    "clay cookware delivery India",
    "breakage replacement",
    "cash on delivery",
  ],
  "/trust": ["Mudkraft privacy policy", "Mudkraft trust", "secure payments", "data privacy"],
  "/terms": ["Mudkraft terms and conditions", "Mudkraft terms", "order terms", "returns policy"],
};

/** The page's keywords, or the site's own for a page not in the list. */
export function keywordsFor(path: string): string[] {
  return KEYWORDS[path] ?? KEYWORDS["/"];
}

const HINDI: Array<[RegExp, string[]]> = [
  [/dahi/i, ["mitti ki dahi handi", "clay pot for curd"]],
  [/handi/i, ["mitti ki handi", "clay pot for cooking"]],
  [/kadh?ai/i, ["mitti ki kadai", "clay kadhai"]],
  [/bhagona/i, ["mitti ka bhagona", "clay pot for rice"]],
  [/matka|cooler|surahi/i, ["mitti ka matka", "clay water pot"]],
  [/jug|bottle/i, ["clay water bottle", "mitti ki bottle"]],
  [/kul+h?ad|cup/i, ["mitti ka kullad", "clay chai cup"]],
  [/roaster|tawa/i, ["mitti ka tawa", "clay roti tawa"]],
];

/** A product page's keywords, from its name, size and type: e.g. "clay handi 2.5 L", "mitti ki handi". */
export function productKeywords(p: ProductView): string[] {
  const name = p.name.split("·")[0].trim();
  const base = /^clay\b/i.test(name) ? name : `clay ${name}`;
  const size = p.sizeLabel && !/^one size$/i.test(p.sizeLabel) ? p.sizeLabel : "";
  const hindi = HINDI.find(([re]) => re.test(`${p.tag} ${p.name}`))?.[1] ?? [];
  const words = [
    base,
    size ? `${base} ${size}` : null,
    `unglazed ${base}`,
    `handmade ${base}`,
    ...hindi,
    `buy ${base} online`,
    p.category ? `clay ${p.category}` : null,
    "Mudkraft",
  ];
  return [...new Set(words.filter((w): w is string => Boolean(w)).map((w) => w.replace(/\s+/g, " ").toLowerCase()))].map(
    (w) => (w === "mudkraft" ? "Mudkraft" : w),
  );
}
