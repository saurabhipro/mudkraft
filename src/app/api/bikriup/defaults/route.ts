import { NextResponse } from "next/server";

import { siteDefaults } from "@/lib/product-stories";

/**
 * Bikriup's product page asks what this site shows when a product's story and care are empty,
 * so the owner can see that text and keep it or change it. Public: it returns only words that
 * every product page already shows.
 */
export const revalidate = 86400;

export function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const read = (k: string) => (q.get(k) ?? "").slice(0, 160);
  const out = siteDefaults({ name: read("name"), tag: read("type"), category: read("category") });
  return NextResponse.json(out, {
    headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" },
  });
}
