import { CATALOGUE_CODES, catalogueSlug } from "@/lib/catalogue";
import { productSeo } from "@/lib/categories";
import { POLICY } from "@/lib/policy";
import { toProductView, type ProductView } from "@/lib/product-view";
import { variantGroupId } from "@/lib/schema";
import { SITE_URL } from "@/lib/seo";
import { getActiveProducts } from "@/server/store/products";

/**
 * Product feed for Google Merchant Center (free listings on Shopping and Images); Bing Merchant
 * Center reads the same format. Built from the live catalogue, so prices and stock stay current.
 * Register `${SITE_URL}/feeds/google.xml` as a scheduled fetch in Merchant Center.
 */
export const dynamic = "force-dynamic";

const esc = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const abs = (url: string) => (url.startsWith("http") ? url : `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`);

/** Google's own taxonomy path; a piece for water or drinks sits elsewhere than cookware. */
const googleCategory = (p: ProductView) =>
  /matka|jug|water|surahi|bottle|cooler|drinkware|glass|kulhad|cup/i.test(`${p.tag} ${p.name}`)
    ? "Home & Garden > Kitchen & Dining > Tableware > Drinkware"
    : "Home & Garden > Kitchen & Dining > Cookware & Bakeware";

function item(p: ProductView, groupId: string | null): string | null {
  // Merchant Center rejects a listing without a photo or one customers cannot have delivered.
  const photo = p.gallery[0] ?? p.img;
  if (!photo || p.fulfilmentMode !== "ship_nationwide") return null;

  const seo = productSeo(p);
  const title = seo.title.replace(/\s*\|\s*Mudkraft$/, "").slice(0, 150);
  // A one-line tagline is too thin for a listing, so it is followed by the factual description.
  const written = (p.description || p.note).replace(/\s+/g, " ").trim();
  const description = (written.length >= 80 ? written : `${written.replace(/[.!\s]*$/, "")}. ${seo.description}`.replace(/^\. /, "")).slice(0, 5000);
  const code = CATALOGUE_CODES[catalogueSlug(p) ?? ""] ?? p.slug;
  const extra = [...new Set(p.gallery.slice(1, 10))];
  const size = p.sizeLabel && !/^one size$/i.test(p.sizeLabel) ? p.sizeLabel : "";

  const tags: Array<[string, string | null]> = [
    ["g:id", p.slug],
    ["title", title],
    ["description", description],
    ["link", `${SITE_URL}/shop/${p.slug}`],
    ["g:image_link", abs(photo)],
    ...extra.map((url): [string, string] => ["g:additional_image_link", abs(url)]),
    ["g:availability", p.stockQty > 0 ? "in_stock" : "out_of_stock"],
    ["g:price", `${(p.pricePaise / 100).toFixed(2)} INR`],
    ["g:brand", "Mudkraft"],
    ["g:mpn", code],
    ["g:identifier_exists", "no"],
    ["g:condition", "new"],
    ["g:google_product_category", googleCategory(p)],
    ["g:product_type", [p.category, p.tag].filter(Boolean).join(" > ") || null],
    ["g:material", "Unglazed river clay"],
    ["g:size", size || null],
    ["g:item_group_id", groupId],
  ];

  const lines = tags
    .filter((t): t is [string, string] => Boolean(t[1]))
    .map(([tag, value]) => `      <${tag}>${esc(value)}</${tag}>`);
  lines.push(
    "      <g:shipping>",
    "        <g:country>IN</g:country>",
    "        <g:service>Standard</g:service>",
    "        <g:price>0.00 INR</g:price>",
    "      </g:shipping>",
  );
  return `    <item>\n${lines.join("\n")}\n    </item>`;
}

export async function GET() {
  const views = (await getActiveProducts()).map(toProductView);

  // Sizes of one piece share a group id, so Google shows them as variants of one product.
  const items = views.flatMap((p) => item(p, variantGroupId(p, views)) ?? []);

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Mudkraft</title>
    <link>${SITE_URL}</link>
    <description>${esc(`Handmade unglazed clay cookware from Khurja. ${POLICY.delivery}.`)}</description>
${items.join("\n")}
  </channel>
</rss>
`;

  return new Response(body, {
    headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=1800" },
  });
}
