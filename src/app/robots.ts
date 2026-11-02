import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/seo";

// Private or transactional paths stay out of search; everything else is open to search and AI crawlers.
const PRIVATE = ["/checkout", "/api/", "/admin", "/sign-in", "/verify", "/track"];
const AI_CRAWLERS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "PerplexityBot", "Google-Extended"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      { userAgent: AI_CRAWLERS, allow: "/", disallow: PRIVATE },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
