import type { MetadataRoute } from "next";

import { SITE_URL as BASE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/benefits`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/workshops`, changeFrequency: "monthly", priority: 0.8 },
    {
      url: `${BASE_URL}/journal/benefits-of-clay-water-pots`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    { url: `${BASE_URL}/care/season-your-handi`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/faq`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/shipping-returns`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${BASE_URL}/track`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/trust`, changeFrequency: "yearly", priority: 0.4 },
  ];

  return entries;
}
