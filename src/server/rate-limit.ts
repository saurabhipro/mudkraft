import { headers } from "next/headers";

/**
 * Fixed-window, in-memory request limiting. The site runs as a single process
 * on one VM, so a Map is enough; a second instance would need a shared store.
 *
 * `createLimiter` returns a function that records one hit for a key and answers
 * whether that key is now over its limit for the current window.
 */
export function createLimiter({ windowMs, max }: { windowMs: number; max: number }) {
  const hits = new Map<string, { n: number; until: number }>();

  return function tooMany(key: string): boolean {
    const now = Date.now();
    const hit = hits.get(key);
    if (!hit || hit.until <= now) {
      hits.set(key, { n: 1, until: now + windowMs });
      // Sweep expired windows now and then so the map cannot grow without bound.
      if (hits.size > 5000) for (const [k, v] of hits) if (v.until <= now) hits.delete(k);
      return false;
    }
    hit.n += 1;
    return hit.n > max;
  };
}

/**
 * The shopper's IP as Caddy reports it. Caddy replaces any X-Forwarded-For a
 * client sends, so the first entry is the real peer, not a spoofable value.
 */
export async function clientIp(): Promise<string> {
  return (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}
