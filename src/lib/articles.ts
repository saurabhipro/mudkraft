/** Every guide on the site, newest first. The journal index, sitemap, llms.txt and "keep reading" links read this. */
export interface Article {
  href: string;
  title: string;
  description: string;
  /** ISO date the guide was first published. */
  date: string;
}

export const ARTICLES: Article[] = [
  {
    href: "/journal/is-clay-cookware-safe",
    title: "Is Clay Cookware Safe? Our Lab Report Explained",
    description:
      "What the lab tested in our river clay, what it found, and three questions to ask any seller of clay pots before you buy.",
    date: "2026-11-02",
  },
  {
    href: "/journal/clay-vs-steel-vs-non-stick-for-dal",
    title: "Clay vs Steel vs Non-Stick for Dal: Which Pot?",
    description:
      "An honest comparison of heat, flame, care and cost, including when a clay handi is the wrong choice.",
    date: "2026-11-02",
  },
  {
    href: "/journal/mitti-ke-bartan-buying-guide",
    title: "Mitti Ke Bartan Buying Guide: Sizes and Checks",
    description:
      "How to pick a clay handi, kadai or matka: size, shape, how to tell it is unglazed, and what to check before it reaches your stove.",
    date: "2026-11-02",
  },
  {
    href: "/journal/benefits-of-clay-water-pots",
    title: "Matka Water: How a Clay Pot Cools Water & How to Season It",
    description:
      "How an unglazed matka cools water without electricity, how to season a new one, and how to clean it without soap.",
    date: "2026-10-01",
  },
  {
    href: "/care/season-your-handi",
    title: "How to Season a Clay Handi (So It Never Cracks)",
    description: "A five-step ritual to cure a new clay handi before cooking: soak, dry, oil, first rice and daily care.",
    date: "2026-10-01",
  },
];
