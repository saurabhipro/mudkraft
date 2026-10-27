import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { verifyBikriupSignature } from "@/server/bikriup";
import { CACHE_TAGS } from "@/server/store/tags";

/**
 * Bikriup tells the site when something changed, so cached pages refresh at
 * once instead of waiting out the cache TTL. Register this URL, and copy its
 * signing secret into BIKRIUP_WEBHOOK_SECRET, in Bikriup › Shop › Website & API.
 *
 *   catalog.changed — price, stock, photo, new item or an approved review
 *   order.updated   — nothing is cached for orders; acknowledged only
 */

const IMMEDIATELY = { expire: 0 } as const;

interface BikriupEvent {
  event?: string;
  data?: { slugs?: string[] };
}

export async function POST(request: Request) {
  const raw = await request.text();
  if (!verifyBikriupSignature(raw, request.headers.get("x-bikriup-signature"))) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let body: BikriupEvent;
  try {
    body = JSON.parse(raw) as BikriupEvent;
  } catch {
    return NextResponse.json({ error: "malformed body" }, { status: 400 });
  }

  if (body.event === "catalog.changed") {
    revalidateTag(CACHE_TAGS.products, IMMEDIATELY);
    for (const slug of body.data?.slugs ?? []) {
      revalidateTag(CACHE_TAGS.product(slug), IMMEDIATELY);
      revalidateTag(CACHE_TAGS.reviews(slug), IMMEDIATELY);
    }
  }

  return NextResponse.json({ received: true });
}
