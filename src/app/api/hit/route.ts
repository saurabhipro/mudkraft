import { NextResponse } from "next/server";

import { createLimiter } from "@/server/rate-limit";
import { cleanHit, isBot, queueHit } from "@/server/site-hits";

/**
 * Page views and shop events from the browser (src/lib/site-hits.ts), for Bikriup › Analytics.
 * Always answers 204 quickly: counting visits must never slow a page or show an error.
 */
const tooMany = createLimiter({ windowMs: 60_000, max: 120 });

export async function POST(request: Request) {
  const done = new NextResponse(null, { status: 204 });
  const ua = request.headers.get("user-agent") ?? "";
  if (isBot(ua)) return done;
  // Caddy sets X-Forwarded-For to the real peer.
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (tooMany(`hit:${ip}`)) return done;
  const text = await request.text().catch(() => "");
  if (!text || text.length > 8000) return done;
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return done;
  }
  const hit = cleanHit(raw, {
    ua,
    country: request.headers.get("cf-ipcountry") ?? request.headers.get("x-country"),
  });
  if (hit) queueHit(hit);
  return done;
}
