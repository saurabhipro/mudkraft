import { POLICY } from "@/lib/policy";
import type { ProductView } from "@/lib/product-view";

/**
 * Landing pages for the searches people actually type ("clay handi", "mitti ke bartan", "matka").
 * Products are matched by their Bikriup product type (`tag`), with the name as a backup, so adding a
 * product of a known type in Bikriup puts it on the right page without a deploy.
 */
export interface CategoryFaq {
  q: string;
  a: string;
}

export interface CategoryPage {
  slug: string;
  /** Short name for links and breadcrumbs. */
  label: string;
  h1: string;
  /** Kept to about 60 characters; the root layout adds nothing to it. */
  title: string;
  /** `from` is the lowest price on the page, already formatted ("₹1,170"), or "" when unknown. */
  description: (from: string) => string;
  intro: string[];
  faqs: CategoryFaq[];
  match: (p: ProductView) => boolean;
}

const has = (p: ProductView, re: RegExp) => re.test(`${p.tag} ${p.name}`);

const SAFE_Q: CategoryFaq = {
  q: "Is unglazed clay safe for cooking?",
  a: "Our clay was tested by the Central Glass & Ceramic Research Institute: no lead, cadmium or arsenic was found, and the pH is a near-neutral 7.2. Nothing is glazed or painted, so your food only touches fired river clay. The numbers are on our soil report page.",
};

const FLAME_Q: CategoryFaq = {
  q: "Can I use it on a gas stove or induction?",
  a: "Yes on a low-to-medium gas flame or a wood fire once the pot is seasoned. Always start cold, warm it slowly, and never put a hot pot on a cold surface. Induction does not work, because clay is not magnetic.",
};

const SEASON_Q: CategoryFaq = {
  q: "How do I season a new clay pot?",
  a: "Soak the new pot in clean water for 12–24 hours, dry it in the shade, rub a thin layer of mustard or coconut oil inside, then cook a first batch of plain rice on the lowest flame. Our season-your-handi guide has every step with photos.",
};

const DELIVERY_Q: CategoryFaq = {
  q: "Do you deliver across India?",
  a: `Yes. ${POLICY.delivery}. Orders leave the studio within ${POLICY.dispatch}. ${POLICY.cod}`,
};

export const CATEGORY_PAGES: CategoryPage[] = [
  {
    slug: "clay-cookware",
    label: "Clay cookware",
    h1: "Clay Cookware: Handmade Unglazed Mitti Ke Bartan",
    title: "Clay Cookware Online – Unglazed Mitti Ke Bartan | Mudkraft",
    description: (from) =>
      `Buy handmade unglazed clay cookware online: handi, kadai, bhagona and more.${from ? ` From ${from}.` : ""} Lab-tested, wood-fired in Khurja. Doorstep delivery across India.`,
    intro: [
      "Mudkraft makes clay cookware the old way. Every handi, kadai and pot is thrown by hand from river clay in Khurja, dried in the sun and fired in a wood kiln for 48 hours. There is no glaze and no paint, so the only thing your food touches is fired clay.",
      "Clay holds heat gently and evenly, which suits slow dals, biryani and curries. Our clay was lab-tested for lead, cadmium and arsenic, and none was found. Choose a piece below, or read how to season and care for it.",
    ],
    faqs: [
      SAFE_Q,
      FLAME_Q,
      SEASON_Q,
      DELIVERY_Q,
    ],
    match: () => true,
  },
  {
    slug: "clay-handi",
    label: "Clay handi",
    h1: "Clay Handi for Cooking: Unglazed Mitti Ki Handi",
    title: "Clay Handi for Cooking – Mitti Ki Handi Online | Mudkraft",
    description: (from) =>
      `Buy a handmade unglazed clay handi (mitti ki handi) for dal, biryani and curries.${from ? ` From ${from}.` : ""} Wood-fired in Khurja, lab-tested. Doorstep delivery across India.`,
    intro: [
      "A mitti ki handi is the pot your grandmother cooked dal in. Ours is thrown by hand from river clay and fired for 48 hours in a wood kiln, with no glaze. It holds heat gently, so dal, rice, biryani and slow curries simmer evenly.",
      "Pick a size below. The bigger handi suits a family meal; the smaller one is good for two people or for serving at the table.",
    ],
    faqs: [
      { q: "Which size clay handi should I buy?", a: "As a rough guide, a 2.5 L handi suits a family dal or rice for four to five people, and a smaller handi suits one or two. If you cook for guests often, go one size up." },
      SAFE_Q,
      FLAME_Q,
      SEASON_Q,
      { q: "How do I clean a clay handi?", a: "Rinse with warm water and a soft brush. Skip dish soap, because the porous clay absorbs detergent. For stubborn residue use a paste of baking soda and water, then dry it fully in the sun." },
      DELIVERY_Q,
    ],
    match: (p) => has(p, /handi/i) && !has(p, /dahi/i),
  },
  {
    slug: "clay-kadai",
    label: "Clay kadai",
    h1: "Clay Kadai: Mitti Ki Kadai for Cooking",
    title: "Clay Kadai for Cooking – Mitti Ki Kadai Online | Mudkraft",
    description: (from) =>
      `Buy a handmade unglazed clay kadai (mitti ki kadai) for sabzi, paneer and curries.${from ? ` From ${from}.` : ""} Wood-fired in Khurja, lab-tested. Doorstep delivery across India.`,
    intro: [
      "A clay kadai gives slow, even heat for sabzi, paneer and thick curries. Ours is thrown by hand from river clay, wood-fired for 48 hours and left unglazed.",
      "Season it once before the first cook, start on a low flame, and it will serve you for years.",
    ],
    faqs: [SAFE_Q, FLAME_Q, SEASON_Q, DELIVERY_Q],
    match: (p) => has(p, /kadh?ai/i),
  },
  {
    slug: "dahi-handi",
    label: "Dahi handi",
    h1: "Clay Dahi Handi: Set Curd in Mitti",
    title: "Clay Dahi Handi – Set Curd in a Mitti Pot | Mudkraft",
    description: (from) =>
      `Buy a handmade unglazed clay dahi handi for setting and serving curd.${from ? ` From ${from}.` : ""} Wood-fired in Khurja, lab-tested. Doorstep delivery across India.`,
    intro: [
      "A dahi handi is a clay pot for setting and serving curd. The porous walls breathe, and many people like the thick set curd and the earthy finish that clay gives.",
      "Ours are thrown by hand from river clay, wood-fired and left unglazed. Choose the size that fits your household.",
    ],
    faqs: [
      { q: "How do I set curd in a clay handi?", a: "Soak the handi in water first, warm the milk, add a spoon of starter curd, cover and leave it in a warm corner. Clay takes a little longer to warm up than steel, so expect to wait slightly longer on cold days." },
      SAFE_Q,
      { q: "How do I clean it?", a: "Rinse with warm water and a soft brush, skip dish soap, and dry it fully in the sun before storing." },
      DELIVERY_Q,
    ],
    match: (p) => has(p, /dahi/i),
  },
  {
    slug: "clay-water-pot",
    label: "Clay matka & water pot",
    h1: "Clay Matka & Water Pot: Cool Water Without a Fridge",
    title: "Clay Matka & Water Pot – Earthen Water Pots | Mudkraft",
    description: (from) =>
      `Buy handmade unglazed clay matkas, jugs and water pots.${from ? ` From ${from}.` : ""} Water stays cooler by natural evaporation. Wood-fired in Khurja. Doorstep delivery across India.`,
    intro: [
      "An earthen water pot cools water without electricity. Thousands of tiny pores let a little water evaporate through the clay, and that evaporation keeps the water cooler than the room.",
      "Our matkas and jugs are thrown by hand from river clay, wood-fired and left unglazed, with no plastic anywhere. Season a new pot once, and it is ready for daily use.",
    ],
    faqs: [
      { q: "How cool does water stay in a matka?", a: "Cooler than the room, not ice-cold. The effect is strongest in dry heat with some airflow around the pot, so keep it on a stand in a shaded spot." },
      SEASON_Q,
      { q: "How do I clean a matka?", a: "Empty it every two to three days, scrub the inside with a soft brush or a lemon half dipped in coarse salt, rinse with plain water and sun-dry before refilling. Never use soap." },
      DELIVERY_Q,
    ],
    match: (p) => has(p, /matka|jug|water|surahi|bottle|cooler|drinkware/i),
  },
];

export function categoryBySlug(slug: string): CategoryPage | undefined {
  return CATEGORY_PAGES.find((c) => c.slug === slug);
}

/** The Hindi name people search for, added to a product's title when its own name does not carry it. */
const HINDI_NAMES: Array<[RegExp, string]> = [
  [/dahi/i, "Dahi Handi"],
  [/handi/i, "Mitti Ki Handi"],
  [/kadh?ai/i, "Mitti Ki Kadai"],
  [/matka|water|cooler|jug|surahi/i, "Matka"],
];

/** Keyword-led title and description for a product page, built from its data so every size is distinct. */
export function productSeo(p: ProductView): { title: string; description: string; label: string } {
  const size = p.sizeLabel && !/^one size$/i.test(p.sizeLabel) ? p.sizeLabel : "";
  const base = /^clay\b/i.test(p.name) ? p.name : `Clay ${p.name}`;
  const label = `${base}${size ? ` ${size}` : ""}`;
  const text = `${p.tag} ${p.name}`;
  const hindi = HINDI_NAMES.find(([re]) => re.test(text))?.[1];
  const hindiPart = hindi && !base.toLowerCase().includes(hindi.toLowerCase()) ? ` ${hindi}` : "";
  const dims = p.widthCm && p.heightCm ? `, ${p.widthCm} × ${p.heightCm} cm` : "";
  return {
    label,
    title: `${label} – Unglazed${hindiPart} | Mudkraft`,
    description: `Hand-thrown unglazed ${base.replace(/^clay /i, "clay ")}${size ? ` (${size}${dims})` : ""} from Khurja, wood-fired 48 hours and lab-tested. ${p.price}. Doorstep delivery across India.`.slice(0, 158),
  };
}
