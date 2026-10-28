"use server";

import { getActiveProducts } from "../store/products";

/**
 * Pieces left for each basket line, so the basket and checkout can flag what
 * sold out after it was added. A slug that is no longer for sale counts as 0.
 */
export async function cartStock(slugs: string[]): Promise<Record<string, number>> {
  const wanted = new Set(slugs.slice(0, 100));
  const products = await getActiveProducts();
  const out: Record<string, number> = {};
  for (const slug of wanted) out[slug] = 0;
  for (const p of products) {
    if (wanted.has(p.slug)) out[p.slug] = p.trackInventory ? Math.max(0, p.stockQty) : 99;
  }
  return out;
}
