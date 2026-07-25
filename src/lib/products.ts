import waterPotImg from "@/assets/water-pot-transparent.png.asset.json";
import kulhadSet from "@/assets/kulhad-set-transparent.png.asset.json";
import bottleJug from "@/assets/bottle-jug-transparent.png.asset.json";
import handiDuo from "@/assets/handi-duo-transparent.png.asset.json";
import handiSmall from "@/assets/handi-small-transparent.png.asset.json";
import sieveDome from "@/assets/sieve-dome-transparent.png.asset.json";

export type Category = "Water" | "Tea" | "Cookware" | "Serveware";

export type Product = {
  slug: string;
  name: string;
  tag: string;
  price: string;
  priceNum: number;
  img: string;
  note: string;
  category: Category;
  description: string;
  story: string;
  specs: Array<{ label: string; value: string }>;
  care: string[];
};

export const products: Product[] = [
  {
    slug: "surahi-matka",
    name: "Surahi Matka",
    tag: "Water Pot",
    price: "₹1,240",
    priceNum: 1240,
    img: waterPotImg.url,
    note: "Cools water the ancient way",
    category: "Water",
    description:
      "A slender-necked water pot turned on the wheel and slow-fired in an open kiln. The porous walls sweat gently through the day, cooling the water inside by evaporation — the way earth has cooled water for two thousand summers.",
    story:
      "Shaped from silt of the Ganges plains, each surahi carries the fingerprints of the potter who threw it. No two curves are the same.",
    specs: [
      { label: "Capacity", value: "≈ 5 litres" },
      { label: "Height", value: "32 cm" },
      { label: "Weight", value: "1.8 kg (empty)" },
      { label: "Material", value: "Unglazed river clay" },
      { label: "Origin", value: "Khurja, India" },
    ],
    care: [
      "Rinse with plain water before first use — never soap.",
      "Soak overnight for the first two days to open the pores.",
      "Refill daily; wipe the outside with a dry cloth.",
    ],
  },
  {
    slug: "kulhad-set",
    name: "Kulhad",
    tag: "Tea Cup · Set of 6",
    price: "₹680",
    priceNum: 680,
    img: kulhadSet.url,
    note: "For chai that tastes of earth",
    category: "Tea",
    description:
      "Six little clay cups that turn morning chai into a ritual. Unglazed, so the first sip carries the mineral warmth of the earth itself.",
    story:
      "Kulhads have poured tea on Indian railway platforms for a century. Ours are thrown by the same families who once supplied those stations.",
    specs: [
      { label: "Set of", value: "6 kulhads" },
      { label: "Capacity", value: "120 ml each" },
      { label: "Height", value: "7 cm" },
      { label: "Material", value: "Unglazed river clay" },
      { label: "Origin", value: "Khurja, India" },
    ],
    care: [
      "Rinse with warm water — no detergent.",
      "Air-dry upside down between uses.",
      "Traditionally single-use; ours are reusable if handled with care.",
    ],
  },
  {
    slug: "bottle-jug",
    name: "Bottle & Jug",
    tag: "Serveware · Duo",
    price: "₹1,480",
    priceNum: 1480,
    img: bottleJug.url,
    note: "Water that remembers the river",
    category: "Serveware",
    description:
      "A tall clay bottle and a lidded jug — a companion set for the table. Water rested in either takes on a soft, mineral sweetness by morning.",
    story:
      "Designed for slow meals: pour from the jug at lunch, keep the bottle by your bedside overnight.",
    specs: [
      { label: "Includes", value: "1 bottle + 1 jug" },
      { label: "Bottle", value: "1 L · 28 cm tall" },
      { label: "Jug", value: "1.2 L · 18 cm tall" },
      { label: "Material", value: "Unglazed river clay" },
      { label: "Origin", value: "Khurja, India" },
    ],
    care: [
      "Season by soaking in clean water for 24 hours before first use.",
      "Refresh water daily; rinse only with water.",
      "Store the lid separately when drying.",
    ],
  },
  {
    slug: "handi",
    name: "Handi",
    tag: "Cookware · Set of 2",
    price: "₹1,120",
    priceNum: 1120,
    img: handiDuo.url,
    note: "Slow food, slower fire",
    category: "Cookware",
    description:
      "A pair of lidded cooking handis — one large, one small — for dals, biryanis and slow curries. The clay holds heat long after the flame is off, finishing the cook on its own.",
    story:
      "Season the handi before its first meal. It will darken with use and reward you with softer rice and deeper dals.",
    specs: [
      { label: "Includes", value: "2 handis with lids" },
      { label: "Large", value: "2 L · serves 4" },
      { label: "Small", value: "1 L · serves 2" },
      { label: "Safe for", value: "Open flame · low to medium heat" },
      { label: "Origin", value: "Khurja, India" },
    ],
    care: [
      "Follow the seasoning ritual before first cook (see our Care Guide).",
      "Always warm the handi gradually — never a cold pot onto a high flame.",
      "Wash by hand with a soft brush; skip detergent.",
    ],
  },
  {
    slug: "chhoti-handi",
    name: "Chhoti Handi",
    tag: "Serving Bowl",
    price: "₹540",
    priceNum: 540,
    img: handiSmall.url,
    note: "Little vessel, full ritual",
    category: "Serveware",
    description:
      "A small lidded bowl — perfect for setting curd, serving pickles at the table, or resting a single portion of dal.",
    story:
      "The size of a shared secret. Set it in the middle of the table and watch hands reach for it.",
    specs: [
      { label: "Capacity", value: "400 ml" },
      { label: "Diameter", value: "12 cm" },
      { label: "With lid", value: "Yes" },
      { label: "Material", value: "Unglazed river clay" },
      { label: "Origin", value: "Khurja, India" },
    ],
    care: [
      "Rinse before first use; no soaking needed.",
      "Ideal for cold or room-temperature service.",
      "Not intended for direct-flame cooking.",
    ],
  },
  {
    slug: "steam-dome",
    name: "Steam Dome",
    tag: "Idli / Steamer",
    price: "₹860",
    priceNum: 860,
    img: sieveDome.url,
    note: "Breath of the kitchen",
    category: "Cookware",
    description:
      "A perforated clay dome with a matching lid — for steaming idlis, momos, or vegetables the gentle way. The porous body breathes as it cooks, keeping the food soft and never rubbery.",
    story:
      "A quiet piece of engineering the villages have known for generations, brought to your kitchen.",
    specs: [
      { label: "Diameter", value: "22 cm" },
      { label: "Includes", value: "Dome + lid" },
      { label: "Use over", value: "A wide pan of simmering water" },
      { label: "Material", value: "Unglazed river clay" },
      { label: "Origin", value: "Khurja, India" },
    ],
    care: [
      "Rinse before first use.",
      "Set on the pan only once the water is warm — never cold clay onto hot metal.",
      "Air-dry fully before storing to prevent mustiness.",
    ],
  },
];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}
