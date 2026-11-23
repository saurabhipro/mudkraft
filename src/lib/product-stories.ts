import type { ProductView } from "@/lib/product-view";

/**
 * The editorial story under each product: what to cook in it, why clay, and how to look after it.
 *
 * Bikriup holds the facts that change (price, size, stock, photos); this file holds the words that
 * belong to a kind of pot. A product finds its story by its type (`tag`) or name, the same way the
 * category pages match, so a new Handi size added in Bikriup gets the Handi story without a deploy.
 *
 * Cookware tells its story as uses + benefits + care. Water and tea pieces tell it as a bilingual
 * benefits sheet + sizes + first-use steps, the format customers know from matka sellers.
 */

export type StoryKind = "cook" | "water" | "tea";

/** Names an icon the page draws; kept as a word so this file stays free of React. */
export type StoryIcon =
  | "flame"
  | "droplets"
  | "soup"
  | "clock"
  | "shield"
  | "hand"
  | "cool"
  | "leaf"
  | "recycle"
  | "coffee";

export interface ProductUse {
  title: string;
  hindi: string;
  body: string;
  tags: string[];
}

export interface Benefit {
  icon: StoryIcon;
  title: string;
  /** Hindi line shown above the English title on the bilingual sheets. */
  hindi?: string;
  body: string;
}

export interface ProductStory {
  kind: StoryKind;
  /** The piece's everyday Hindi name. */
  hindiName: string;
  /** Water and tea: the Hindi heading of the benefits sheet ("मिट्टी के मटके के फ़ायदे"). */
  benefitsHindi?: string;
  /** Short tags for the collection card: what it is for. */
  tags: string[];
  /** Cookware: three or four dishes the piece is made for. */
  uses: ProductUse[];
  /** The one rule a potter would tell you, in English and Hindi. */
  rule?: { en: string; hi: string };
  /** Rows added under Specifications. */
  details: Array<{ label: string; value: string }>;
}

const COOK_DETAILS = [
  { label: "Material", value: "Khurja river clay, unglazed" },
  { label: "Cooks on", value: "Gas and chulha, low to medium flame. Not induction." },
];

const STORIES: Array<{ match: RegExp; story: ProductStory }> = [
  {
    // Before "handi", so a Dahi Handi does not take the Handi's story.
    match: /dahi/i,
    story: {
      kind: "cook",
      hindiName: "दही हांडी",
      tags: ["Set curd", "Phirni", "Raita"],
      uses: [
        {
          title: "Set curd",
          hindi: "दही जमाना",
          body: "Clay draws off the extra water as it sets, so the curd turns out thick and firm without a fridge.",
          tags: ["Overnight", "Room temperature"],
        },
        {
          title: "Phirni & kheer",
          hindi: "फिरनी और खीर",
          body: "Set it in the pot and chill. The clay keeps it cool and adds a faint earthy sweetness.",
          tags: ["Set & serve", "Chilled"],
        },
        {
          title: "Raita at the table",
          hindi: "रायता",
          body: "Serve straight from the pot it was set in. It stays cool longer than in steel or glass.",
          tags: ["Serve in it"],
        },
      ],
      rule: {
        en: "Keep it for curd and milk only, never for masala.",
        hi: "इसे केवल दही और दूध के लिए रखें",
      },
      details: [
        { label: "Material", value: "Khurja river clay, unglazed" },
        { label: "Made for", value: "Setting curd, chilled desserts, serving" },
      ],
    },
  },
  {
    match: /handi/i,
    story: {
      kind: "cook",
      hindiName: "हांडी",
      tags: ["Dal", "Biryani", "Curd"],
      uses: [
        {
          title: "Dal & curries",
          hindi: "दाल, राजमा, छोले",
          body: "Let it simmer slowly. The lentils break down into a creamy dal without constant stirring.",
          tags: ["Low flame", "Lid on"],
        },
        {
          title: "Biryani & pulao",
          hindi: "बिरयानी, पुलाव",
          body: "Seal the lid with a strip of dough for dum. The steam stays in and the grains stay separate.",
          tags: ["Dum", "Lid sealed"],
        },
        {
          title: "Set curd",
          hindi: "दही जमाना",
          body: "Clay draws off the extra water as the curd sets, so it turns out thick and firm.",
          tags: ["Overnight", "Room temperature"],
        },
        {
          title: "Kheer & milk",
          hindi: "खीर, दूध उबालना",
          body: "Milk reduces slowly with a faint smoky sweetness. Use a Handi kept only for milk.",
          tags: ["Low flame", "Milk-only pot"],
        },
      ],
      rule: { en: "Keep one Handi for milk, another for masala.", hi: "दूध के लिए अलग हांडी रखें" },
      details: [...COOK_DETAILS, { label: "In the box", value: "The Handi with its clay lid" }],
    },
  },
  {
    match: /kadh?ai/i,
    story: {
      kind: "cook",
      hindiName: "कढ़ाई",
      tags: ["Sabzi", "Fish curry", "Kadhi"],
      uses: [
        {
          title: "Dry sabzi",
          hindi: "सूखी सब्ज़ी",
          body: "The wide, shallow base cooks vegetables evenly and gives them room to brown without burning.",
          tags: ["Medium flame", "Open"],
        },
        {
          title: "Fish curry",
          hindi: "मछली करी",
          body: "The way coastal kitchens have always made it: a slow, tangy gravy that clay keeps from splitting.",
          tags: ["Low flame", "Lid on"],
        },
        {
          title: "Kadhi",
          hindi: "कढ़ी",
          body: "Gentle, even heat lets the besan and curd thicken slowly without catching at the bottom.",
          tags: ["Low flame", "Stir often"],
        },
        {
          title: "Serve at the table",
          hindi: "परोसना",
          body: "Take it straight from the stove to the table. The thick walls keep the food hot through dinner.",
          tags: ["Stays warm"],
        },
      ],
      rule: {
        en: "Never heat it empty. Add oil or water first.",
        hi: "खाली कढ़ाई को आँच पर न रखें",
      },
      details: [...COOK_DETAILS, { label: "In the box", value: "The Kadhai with its clay lid" }],
    },
  },
  {
    match: /bhagona|patila/i,
    story: {
      kind: "cook",
      hindiName: "भगोना",
      tags: ["Milk", "Rice", "Kheer"],
      uses: [
        {
          title: "Boil milk",
          hindi: "दूध उबालना",
          body: "Milk heats slowly and evenly, with less chance of scorching, and keeps longer in clay.",
          tags: ["Low flame", "Milk-only pot"],
        },
        {
          title: "Rice",
          hindi: "चावल",
          body: "The tall sides and snug lid hold the steam, so every grain cooks through soft and separate.",
          tags: ["Lid on"],
        },
        {
          title: "Kheer",
          hindi: "खीर",
          body: "Reduce milk and rice for hours without catching. Clay gives kheer its old, smoky sweetness.",
          tags: ["Slow cook"],
        },
        {
          title: "Soups & dal",
          hindi: "सूप और दाल",
          body: "Room for a family-sized pot of soup or dal that stays warm on the table with the lid on.",
          tags: ["Family size"],
        },
      ],
      rule: {
        en: "Keep one Bhagona for milk, another for everything else.",
        hi: "दूध के लिए अलग भगोना रखें",
      },
      details: [...COOK_DETAILS, { label: "In the box", value: "The Bhagona with its clay lid" }],
    },
  },
  {
    match: /roaster|tawa/i,
    story: {
      kind: "cook",
      hindiName: "रोटी सेंकने का बर्तन",
      tags: ["Roti", "Papad", "Bhutta"],
      uses: [
        {
          title: "Phulka & roti",
          hindi: "फुलका, रोटी",
          body: "Set the dome over the flame and the roti puffs on the warm clay, with a soft kiln-warm edge.",
          tags: ["Over the flame"],
        },
        {
          title: "Papad",
          hindi: "पापड़",
          body: "Roast papad evenly without oil and without black spots from an open flame.",
          tags: ["No oil"],
        },
        {
          title: "Bhutta",
          hindi: "भुट्टा",
          body: "Turn corn on the dome for an even roast, the way street-side bhutta is made.",
          tags: ["Turn often"],
        },
        {
          title: "Baingan for bharta",
          hindi: "बैंगन भर्ता",
          body: "Char a brinjal on the clay until soft for a smoky bharta, with less mess on the stove.",
          tags: ["Smoky"],
        },
      ],
      rule: { en: "Warm it slowly before the first roti.", hi: "पहली रोटी से पहले धीरे गरम करें" },
      details: [...COOK_DETAILS, { label: "In the box", value: "The Roaster with its clay lid" }],
    },
  },
  {
    match: /cooler|matka|tank/i,
    story: {
      kind: "water",
      hindiName: "मटका",
      benefitsHindi: "मिट्टी के मटके के फ़ायदे",
      tags: ["Cool water", "No electricity"],
      uses: [],
      details: [
        { label: "Material", value: "Khurja river clay, unglazed" },
        { label: "In the box", value: "The cooler with its clay lid and a fitted tap" },
      ],
    },
  },
  {
    match: /surahi/i,
    story: {
      kind: "water",
      hindiName: "सुराही",
      benefitsHindi: "मिट्टी की सुराही के फ़ायदे",
      tags: ["Cool water", "Table"],
      uses: [],
      details: [{ label: "Material", value: "Khurja river clay, unglazed" }],
    },
  },
  {
    match: /bottle/i,
    story: {
      kind: "water",
      hindiName: "बोतल",
      benefitsHindi: "मिट्टी की बोतल के फ़ायदे",
      tags: ["Cool water", "Desk & bedside"],
      uses: [],
      details: [{ label: "Material", value: "Khurja river clay, unglazed" }],
    },
  },
  {
    match: /jug|water/i,
    story: {
      kind: "water",
      hindiName: "जग",
      benefitsHindi: "मिट्टी के जग के फ़ायदे",
      tags: ["Cool water", "Table"],
      uses: [],
      details: [{ label: "Material", value: "Khurja river clay, unglazed" }],
    },
  },
  {
    match: /kull?h?ad|cup|glass/i,
    story: {
      kind: "tea",
      hindiName: "कुल्हड़",
      benefitsHindi: "मिट्टी के कुल्हड़ के फ़ायदे",
      tags: ["Chai", "Lassi", "Coffee"],
      uses: [],
      details: [{ label: "Material", value: "Khurja river clay, unglazed" }],
    },
  },
];

/** The seasoning steps cookware pages show before first use; also Bikriup's default care text. */
export const SEASONING_STEPS = [
  {
    title: "Soak in water",
    body: "Submerge it completely, lid too, so the clay drinks into every pore.",
  },
  {
    title: "Dry in the shade",
    body: "Upside-down on a cloth, out of direct sun, until it is one even colour.",
  },
  {
    title: "Oil the inside",
    body: "A thin layer of mustard or coconut oil forms the first seasoning.",
  },
] as const;

/**
 * What the product page shows when Bikriup's story and care are empty, as plain text the back
 * office can offer as a default: the potter's one rule as the story, the seasoning steps as care.
 */
export function siteDefaults(p: { name: string; tag: string; category: string }): {
  story: string;
  care: string;
} {
  const story = storyFor(p);
  const cookware = p.category.trim().toLowerCase() === "cookware";
  return {
    story: story?.rule?.en ?? "",
    care: cookware ? SEASONING_STEPS.map((s) => `${s.title}: ${s.body}`).join("\n") : "",
  };
}

export function storyFor(p: Pick<ProductView, "tag" | "name">): ProductStory | null {
  const text = `${p.tag} ${p.name}`;
  return STORIES.find((s) => s.match.test(text))?.story ?? null;
}

/** Why cook in clay: the same for every cooking pot. */
export const COOK_BENEFITS: Benefit[] = [
  {
    icon: "flame",
    title: "Slow, even heat",
    body: "Clay warms gently all over, so food cooks through without scorching at the base.",
  },
  {
    icon: "droplets",
    title: "Less oil needed",
    body: "The porous walls hold moisture and steam, keeping food moist with only a little oil.",
  },
  {
    icon: "soup",
    title: "An earthy flavour",
    body: "The soft mitti aroma slow-cooked village food is known for, and no metallic taste.",
  },
  {
    icon: "clock",
    title: "Stays warm longer",
    body: "Thick walls hold heat, so dinner stays warm on the table with the lid on.",
  },
  {
    icon: "shield",
    title: "Nothing to leach",
    body: "No glaze, no paint, no non-stick coat. Lab-tested and lead-free, and the report is public.",
  },
  {
    icon: "hand",
    title: "Made by hand",
    body: "Thrown on the wheel by a potter family in Khurja. No two pieces are exactly alike.",
  },
];

export const COOK_CARE = {
  do: [
    "Soak, shade-dry and oil it before the first use",
    "Start on a low flame, then raise to medium",
    "Wash in warm water with coconut coir",
    "Dry upside down before you store it",
  ],
  dont: [
    "Use soap: the clay soaks it up",
    "Put a hot pot on a cold, wet floor",
    "Cook on a high flame",
    "Use it on induction",
  ],
};

export const WATER_BENEFITS: Benefit[] = [
  {
    icon: "cool",
    hindi: "बिना बिजली, ठंडा पानी",
    title: "Cools without electricity",
    body: "Water seeps slowly into the walls and evaporates from the outside, carrying heat away. The pot stays cooler than the room all day.",
  },
  {
    icon: "soup",
    hindi: "मिट्टी का मीठा स्वाद",
    title: "The taste of a village matka",
    body: "Soft and earthy, never plastic or metallic. The reason people still keep a matka next to the fridge.",
  },
  {
    icon: "shield",
    hindi: "शुद्ध, रसायन-मुक्त",
    title: "No glaze, no plastic",
    body: "Raw Khurja clay with nothing painted on. Lab-tested and lead-free, and the soil report is on our site.",
  },
  {
    icon: "leaf",
    hindi: "पर्यावरण के अनुकूल",
    title: "Kind to the planet",
    body: "No power, no bottles, no refrigerant. When it is finally done, the clay goes back to the soil.",
  },
];

export const WATER_STEPS = [
  {
    title: "Rinse, fill, pour away",
    body: "Rinse with plain water, fill it once and pour that first fill away.",
  },
  {
    title: "Keep it in the shade",
    body: "Air around it helps it cool. A little dampness outside is normal: that is the clay working.",
  },
  {
    title: "Refill daily, scrub weekly",
    body: "Fresh water every day. Once a week, scrub inside with a soft brush and water, never soap.",
  },
];

export const TEA_BENEFITS: Benefit[] = [
  {
    icon: "coffee",
    hindi: "चाय में मिट्टी की खुशबू",
    title: "Chai that smells of rain",
    body: "Hot tea draws a soft earthy aroma from the clay, the smell of a roadside dhaba kulhad.",
  },
  {
    icon: "hand",
    hindi: "हाथ में आराम से",
    title: "Easy to hold",
    body: "Thick clay walls keep the heat in the tea and away from your fingers.",
  },
  {
    icon: "shield",
    hindi: "शुद्ध, रसायन-मुक्त",
    title: "No glaze, no wax",
    body: "Unlike paper cups, nothing lines the inside. Lab-tested, lead-free Khurja clay.",
  },
  {
    icon: "recycle",
    hindi: "पर्यावरण के अनुकूल",
    title: "No plastic, no paper",
    body: "Wash and reuse it at home, and when it finally breaks, it goes back to the soil.",
  },
];

export const TEA_STEPS = [
  {
    title: "Soak before the first use",
    body: "Leave the kullads in clean water for an hour, then let them dry.",
  },
  { title: "Rinse in warm water", body: "No soap: the clay soaks it up. A soft brush is enough." },
  { title: "Dry upside down", body: "Let them dry fully before you stack them away." },
];
