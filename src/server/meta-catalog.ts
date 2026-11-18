import { toProductView, type ProductView } from "@/lib/product-view";

import { serverEnv } from "./env";
import { describeError } from "./redact";
import { queryActiveProducts } from "./store/products";
import { GRAPH_URL } from "./whatsapp/templates";

/**
 * Keeps the Meta catalog (the one WhatsApp and Instagram shops show) in step with the shop.
 *
 * Meta also reads /feeds/google.xml on a schedule, and that remains the full sync: new pieces,
 * photos, titles. But a scheduled read can be hours behind, and a WhatsApp cart shows Meta's
 * copy of the price. So when Bikriup reports a change, the price and stock of those pieces
 * are pushed straight away through the catalog batch API.
 *
 * Needs WHATSAPP_CATALOG_ID and a token with catalog_management (the WhatsApp system user's).
 */

/** The price line the feed and the push both send: what the customer pays, delivery included. */
export function catalogPrice(p: ProductView): string {
  return `${(p.pricePaise / 100).toFixed(2)} INR`;
}

export function catalogInStock(p: ProductView): boolean {
  return p.stockQty > 0;
}

export function metaCatalogEnabled(): boolean {
  return Boolean(serverEnv.WHATSAPP_CATALOG_ID && serverEnv.WHATSAPP_ACCESS_TOKEN);
}

/**
 * Pushes price and stock for the given slugs (every active piece when the list is empty).
 * Never throws: a failed push only means Meta waits for its next feed read.
 */
export async function pushCatalogPrices(slugs: string[] = []): Promise<void> {
  if (!metaCatalogEnabled()) return;
  try {
    const wanted = new Set(slugs);
    const views = (await queryActiveProducts())
      .map(toProductView)
      // The feed lists only pieces that ship, so those are the ones Meta has.
      .filter((p) => p.fulfilmentMode === "ship_nationwide")
      .filter((p) => !wanted.size || wanted.has(p.slug));
    if (!views.length) return;

    const body = new URLSearchParams({
      item_type: "PRODUCT_ITEM",
      // Only change pieces Meta already has; new ones arrive with their photos from the feed.
      allow_upsert: "false",
      requests: JSON.stringify(
        views.map((p) => ({
          method: "UPDATE",
          data: {
            id: p.slug,
            price: catalogPrice(p),
            availability: catalogInStock(p) ? "in stock" : "out of stock",
          },
        })),
      ),
    });
    const res = await fetch(`${GRAPH_URL}/${serverEnv.WHATSAPP_CATALOG_ID}/items_batch`, {
      method: "POST",
      headers: { Authorization: `Bearer ${serverEnv.WHATSAPP_ACCESS_TOKEN}` },
      body,
      signal: AbortSignal.timeout(15_000),
    });
    const data = (await res.json().catch(() => ({}))) as {
      handles?: string[];
      validation_status?: Array<{ retailer_id?: string; errors?: Array<{ message?: string }> }>;
      error?: { message?: string };
    };
    if (!res.ok) {
      console.error(`[meta-catalog] push failed: ${res.status} ${data.error?.message ?? ""}`);
      return;
    }
    for (const v of data.validation_status ?? []) {
      for (const e of v.errors ?? []) console.warn(`[meta-catalog] ${v.retailer_id}: ${e.message}`);
    }
    console.info(
      `[meta-catalog] pushed ${views.length} price(s): ${views.map((p) => p.slug).join(", ")}`,
    );
  } catch (error) {
    console.error(`[meta-catalog] push failed: ${describeError(error)}`);
  }
}
