import waterPotImg from "@/assets/water-pot-transparent.png.asset.json";
import kulhadSet from "@/assets/kulhad-set-transparent.png.asset.json";
import bottleJug from "@/assets/bottle-jug-transparent.png.asset.json";
import handiDuo from "@/assets/handi-duo-transparent.png.asset.json";
import handiSmall from "@/assets/handi-small-transparent.png.asset.json";
import sieveDome from "@/assets/sieve-dome-transparent.png.asset.json";

export type Review = {
  id: string;
  name: string;
  city: string;
  rating: 1 | 2 | 3 | 4 | 5;
  date: string; // YYYY-MM-DD
  title: string;
  body: string;
  photo?: string; // customer photo URL
  verified?: boolean;
};

// Reusable pool of "customer" photos — clay assets already in the site.
const customerPhotos = [
  waterPotImg.url,
  kulhadSet.url,
  bottleJug.url,
  handiDuo.url,
  handiSmall.url,
  sieveDome.url,
];

const commonReviews: Review[] = [
  {
    id: "r-anaya",
    name: "Anaya S.",
    city: "Bengaluru",
    rating: 5,
    date: "2026-05-14",
    title: "The water genuinely tastes different",
    body: "I was skeptical about the whole 'clay pot changes the water' thing, but after a week I can honestly tell the difference. Softer, cooler, no metallic aftertaste. The pot itself is beautiful — clearly hand-thrown, not factory perfect, and I love that.",
    photo: customerPhotos[0],
    verified: true,
  },
  {
    id: "r-rohan",
    name: "Rohan M.",
    city: "Pune",
    rating: 5,
    date: "2026-04-02",
    title: "Packed like it was going to the moon",
    body: "Arrived in Pune without a single crack — properly cushioned. Seasoning ritual on the site is easy to follow. Second order coming for my mother.",
    verified: true,
  },
  {
    id: "r-meera",
    name: "Meera K.",
    city: "Delhi",
    rating: 4,
    date: "2026-03-18",
    title: "Beautiful, small variations are part of it",
    body: "Colour is slightly darker than the photo on one side (kiln flash?) but honestly it makes it feel more real. Studio replied to my WhatsApp questions within an hour.",
    photo: customerPhotos[2],
  },
];

const productReviews: Record<string, Review[]> = {
  "surahi-matka": [
    ...commonReviews,
    {
      id: "r-surahi-arjun",
      name: "Arjun P.",
      city: "Hyderabad",
      rating: 5,
      date: "2026-06-02",
      title: "Delhi summer approved",
      body: "45°C outside, water inside stays cool through the day without fridge. The neck pours cleanly without spilling. Feels like my grandmother's kitchen.",
      photo: customerPhotos[0],
      verified: true,
    },
    {
      id: "r-surahi-sneha",
      name: "Sneha R.",
      city: "Mumbai",
      rating: 5,
      date: "2026-02-11",
      title: "Sweats gently, cools beautifully",
      body: "First day I panicked seeing a wet ring under it — turns out that's how it works. Bought a small terracotta tray to sit it on. Love this pot.",
    },
  ],
  "kulhad-set": [
    ...commonReviews,
    {
      id: "r-kulhad-vikram",
      name: "Vikram J.",
      city: "Jaipur",
      rating: 5,
      date: "2026-05-30",
      title: "Chai finally tastes like the tapri",
      body: "Six kulhads, all slightly different, all lovely. The tea genuinely picks up an earthy note. My guests keep asking where I got them.",
      photo: customerPhotos[1],
      verified: true,
    },
    {
      id: "r-kulhad-priya",
      name: "Priya D.",
      city: "Kolkata",
      rating: 4,
      date: "2026-03-05",
      title: "Great — one had a tiny chip on the rim",
      body: "Five out of six perfect. Messaged the studio, they sent a replacement without any fuss. Would order again.",
    },
  ],
  "bottle-jug": [
    ...commonReviews,
    {
      id: "r-bottle-kabir",
      name: "Kabir N.",
      city: "Gurugram",
      rating: 5,
      date: "2026-06-11",
      title: "Living room centrepiece + actually useful",
      body: "The jug pours without dribbling and the bottle keeps water genuinely cool. Both look sculptural on the dining table.",
      photo: customerPhotos[2],
      verified: true,
    },
  ],
  handi: [
    ...commonReviews,
    {
      id: "r-handi-lakshmi",
      name: "Lakshmi V.",
      city: "Chennai",
      rating: 5,
      date: "2026-04-22",
      title: "Dal in this handi is a different animal",
      body: "Seasoned it exactly per the care guide. Cooked toor dal on low flame — the smell was unbelievable. No cracks after 3 weeks of regular use on gas.",
      photo: customerPhotos[3],
      verified: true,
    },
    {
      id: "r-handi-imran",
      name: "Imran H.",
      city: "Lucknow",
      rating: 4,
      date: "2026-02-28",
      title: "Take the seasoning step seriously",
      body: "I rushed the drying part and got a hairline crack. My fault, not the pot's. Bought a second one, followed the ritual properly, working beautifully.",
    },
  ],
  "chhoti-handi": [
    ...commonReviews,
    {
      id: "r-chhoti-nisha",
      name: "Nisha B.",
      city: "Ahmedabad",
      rating: 5,
      date: "2026-05-08",
      title: "Perfect single-person size",
      body: "I cook for one and this is the ideal size for a small portion of curry or dal. Sits nicely on my two-burner stove.",
      photo: customerPhotos[4],
      verified: true,
    },
  ],
  "steam-dome": [
    ...commonReviews,
    {
      id: "r-steam-rahul",
      name: "Rahul T.",
      city: "Kochi",
      rating: 5,
      date: "2026-06-19",
      title: "Idlis came out perfect on the first try",
      body: "Never used a clay steamer before — surprisingly easy. Idlis were fluffier than my metal cooker version. Steam distributes evenly.",
      photo: customerPhotos[5],
      verified: true,
    },
    {
      id: "r-steam-divya",
      name: "Divya A.",
      city: "Bengaluru",
      rating: 4,
      date: "2026-03-14",
      title: "Heavier than expected, but that's the point",
      body: "It's a substantial piece — feels solid, well-made. Takes a bit longer to heat than metal, but the result is worth it.",
    },
  ],
};

export function getReviewsForProduct(slug: string): Review[] {
  return productReviews[slug] ?? commonReviews;
}

export function getReviewSummary(slug: string): {
  average: number;
  count: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
} {
  const reviews = getReviewsForProduct(slug);
  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let total = 0;
  for (const r of reviews) {
    distribution[r.rating] += 1;
    total += r.rating;
  }
  const average = reviews.length ? total / reviews.length : 0;
  return { average, count: reviews.length, distribution };
}
