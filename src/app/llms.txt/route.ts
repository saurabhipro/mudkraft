import { CATEGORY_PAGES } from "@/lib/categories";
import { POLICY } from "@/lib/policy";
import { toProductView } from "@/lib/product-view";
import { SITE_URL } from "@/lib/seo";
import { getActiveProducts } from "@/server/store/products";

/** A plain-text summary for AI assistants, built from the live catalogue so it never goes stale. */
export const dynamic = "force-dynamic";

export async function GET() {
  const products = (await getActiveProducts().catch(() => [])).map(toProductView);
  const categories = CATEGORY_PAGES.filter((c) => products.some(c.match));

  const lines = [
    "# Mudkraft",
    "",
    "> Handmade unglazed clay cookware and matkas from river clay, made in Khurja and fired for 48 hours in a wood kiln. Lab-tested: no lead, cadmium or arsenic found.",
    "",
    `- ${POLICY.delivery}. ${POLICY.cod}`,
    `- Breakage cover: ${POLICY.breakage}`,
    `- Returns: ${POLICY.returnDays} days for unused pieces.`,
    "",
    "## Shop",
    ...categories.map((c) => `- [${c.label}](${SITE_URL}/${c.slug}): ${c.h1}`),
    "",
    "## Products",
    ...products.map(
      (p) => `- [${`${p.name} ${p.sizeLabel}`.trim()}](${SITE_URL}/shop/${p.slug}): ${p.price}${p.stockQty > 0 ? "" : " (sold out)"}`,
    ),
    "",
    "## Guides",
    `- [How to season a clay handi](${SITE_URL}/care/season-your-handi)`,
    `- [Matka water: how a clay pot cools water](${SITE_URL}/journal/benefits-of-clay-water-pots)`,
    `- [Soil and lab report](${SITE_URL}/soil-report)`,
    `- [Why unglazed clay](${SITE_URL}/benefits)`,
    `- [FAQ](${SITE_URL}/faq)`,
    `- [Shipping and returns](${SITE_URL}/shipping-returns)`,
    `- [Workshops](${SITE_URL}/workshops)`,
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
}
