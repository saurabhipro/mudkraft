import { bikriup, bikriupEnabled } from "./bikriup";

/**
 * The server half of Bikriup › Analytics (the browser half is src/lib/site-hits.ts). /api/hit
 * checks each hit, adds device, browser and country, and queues it; the queue goes to Bikriup's
 * /api/v1/analytics/events in batches every few seconds. The site runs as one long-lived process,
 * so an in-memory queue is enough; anything still queued when it restarts is lost, which is fine
 * for counting visits. No IP address or user agent string is passed on.
 */

const BOTS =
  /bot|crawl|spider|slurp|archiver|facebookexternalhit|embedly|quora link|whatsapp|telegram|discord|preview|headless|phantom|puppeteer|playwright|selenium|lighthouse|pagespeed|gtmetrix|pingdom|uptime|monitor|curl|wget|python|httpclient|okhttp|java\/|go-http|node-fetch|axios|postman/i;

export function isBot(ua: string): boolean {
  return !ua || ua.length < 20 || BOTS.test(ua);
}

export function parseUa(ua: string): {
  device: "mobile" | "tablet" | "desktop";
  browser: string;
  os: string;
} {
  const tablet = /ipad|tablet|kindle|silk|playbook|(android(?!.*mobile))/i.test(ua);
  const mobile = !tablet && /mobi|iphone|ipod|android|windows phone|opera mini/i.test(ua);
  const browser = /edg(e|a|ios)?\//i.test(ua)
    ? "Edge"
    : /samsungbrowser/i.test(ua)
      ? "Samsung Internet"
      : /opr\/|opera/i.test(ua)
        ? "Opera"
        : /ucbrowser/i.test(ua)
          ? "UC Browser"
          : /miuibrowser|xiaomi/i.test(ua)
            ? "Mi Browser"
            : /fban|fbav|instagram/i.test(ua)
              ? /instagram/i.test(ua)
                ? "Instagram app"
                : "Facebook app"
              : /firefox|fxios/i.test(ua)
                ? "Firefox"
                : /crios|chrome|chromium/i.test(ua)
                  ? "Chrome"
                  : /safari/i.test(ua)
                    ? "Safari"
                    : "Other";
  const os = /iphone|ipad|ipod/i.test(ua)
    ? "iOS"
    : /android/i.test(ua)
      ? "Android"
      : /windows/i.test(ua)
        ? "Windows"
        : /mac os x|macintosh/i.test(ua)
          ? "macOS"
          : /cros/i.test(ua)
            ? "ChromeOS"
            : /linux/i.test(ua)
              ? "Linux"
              : "Other";
  return { device: tablet ? "tablet" : mobile ? "mobile" : "desktop", browser, os };
}

let regionNames: Intl.DisplayNames | null = null;
function countryName(code: string): string {
  try {
    regionNames ??= new Intl.DisplayNames(["en"], { type: "region" });
    return regionNames.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

// When no proxy tells us the country, the browser's time zone is a fair guess.
const TZ_COUNTRY: Record<string, string> = {
  "Asia/Kolkata": "IN",
  "Asia/Calcutta": "IN",
  "Asia/Dubai": "AE",
  "Asia/Muscat": "OM",
  "Asia/Qatar": "QA",
  "Asia/Riyadh": "SA",
  "Asia/Kuwait": "KW",
  "Asia/Bahrain": "BH",
  "Asia/Singapore": "SG",
  "Asia/Kathmandu": "NP",
  "Asia/Katmandu": "NP",
  "Asia/Dhaka": "BD",
  "Asia/Colombo": "LK",
  "Asia/Karachi": "PK",
  "Asia/Kuala_Lumpur": "MY",
  "Asia/Hong_Kong": "HK",
  "Asia/Tokyo": "JP",
  "Asia/Shanghai": "CN",
  "Europe/London": "GB",
  "Europe/Dublin": "IE",
  "Europe/Berlin": "DE",
  "Europe/Paris": "FR",
  "Europe/Amsterdam": "NL",
  "Europe/Madrid": "ES",
  "Europe/Rome": "IT",
  "Europe/Zurich": "CH",
  "Europe/Stockholm": "SE",
  "Australia/Sydney": "AU",
  "Australia/Melbourne": "AU",
  "Australia/Perth": "AU",
  "Australia/Brisbane": "AU",
  "Pacific/Auckland": "NZ",
  "Africa/Nairobi": "KE",
  "Africa/Johannesburg": "ZA",
  "America/Toronto": "CA",
  "America/Vancouver": "CA",
};

export function countryOf(header: string | null, tz: string): string {
  const code = (header ?? "").trim().toUpperCase();
  if (/^[A-Z]{2}$/.test(code) && code !== "XX" && code !== "T1") return countryName(code);
  if (TZ_COUNTRY[tz]) return countryName(TZ_COUNTRY[tz]);
  if (/^America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Anchorage|Detroit)/.test(tz))
    return countryName("US");
  return "";
}

const EVENTS = new Set(["page_view", "add_to_cart", "begin_checkout", "purchase", "lead"]);
const ID = /^[A-Za-z0-9_-]{6,64}$/;
const s = (v: unknown, n: number) => (typeof v === "string" ? v.slice(0, n) : "");
const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);

export type SiteHit = Record<string, unknown>;

/** One hit from the browser, kept to the fields Bikriup takes; null when it is not one of ours. */
export function cleanHit(
  raw: unknown,
  ctx: { ua: string; country: string | null },
): SiteHit | null {
  if (!raw || typeof raw !== "object") return null;
  const b = raw as Record<string, unknown>;
  const event = s(b.event, 20);
  const path = s(b.path, 300);
  if (!EVENTS.has(event) || !path.startsWith("/") || /^\/(admin|api)(\/|$)/.test(path)) return null;
  if (!ID.test(s(b.visitor, 64)) || !ID.test(s(b.session, 64))) return null;
  const items = Array.isArray(b.items)
    ? b.items.slice(0, 30).flatMap((i) =>
        i && typeof i === "object" && typeof (i as HitItemRaw).slug === "string"
          ? [
              {
                slug: s((i as HitItemRaw).slug, 120),
                qty: n((i as HitItemRaw).qty),
                price: n((i as HitItemRaw).price),
              },
            ]
          : [],
      )
    : [];
  return {
    event,
    path,
    page_type: s(b.page_type, 20),
    slug: s(b.slug, 120),
    title: s(b.title, 200),
    visitor: b.visitor,
    session: b.session,
    new_visitor: b.new_visitor === true,
    landing: b.landing === true,
    ref_host: s(b.ref_host, 120),
    source: s(b.source, 80),
    medium: s(b.medium, 80),
    campaign: s(b.campaign, 120),
    paid: b.paid === true,
    ...parseUa(ctx.ua),
    country: countryOf(ctx.country, s(b.tz, 60)),
    value: n(b.value),
    order_no: s(b.order_no, 40),
    items,
    at: s(b.at, 40),
  };
}
type HitItemRaw = { slug?: unknown; qty?: unknown; price?: unknown };

/* ---------- The queue to Bikriup ---------- */

const BATCH = 100;
const MAX_QUEUE = 5000;
const FLUSH_MS = 5000;

const g = globalThis as unknown as {
  __mkHits?: { queue: SiteHit[]; timer: ReturnType<typeof setTimeout> | null; warned: number };
};
const state = (g.__mkHits ??= { queue: [], timer: null, warned: 0 });

export function queueHit(hit: SiteHit): void {
  if (!bikriupEnabled()) return;
  // Bikriup down for long: keep the newest, drop the oldest.
  if (state.queue.length >= MAX_QUEUE) state.queue.splice(0, state.queue.length - MAX_QUEUE + 1);
  state.queue.push(hit);
  if (state.queue.length >= BATCH) void flushHits();
  else state.timer ??= setTimeout(() => void flushHits(), FLUSH_MS);
}

export async function flushHits(): Promise<void> {
  if (state.timer) clearTimeout(state.timer);
  state.timer = null;
  while (state.queue.length) {
    const batch = state.queue.splice(0, BATCH);
    try {
      await bikriup("/analytics/events", { method: "POST", body: { events: batch } });
    } catch (err) {
      // Bikriup unreachable: put the batch back and try on the next timer. A refusal (4xx) is dropped.
      const status = (err as { status?: number }).status ?? 0;
      if (Date.now() - state.warned > 10 * 60e3) {
        state.warned = Date.now();
        console.warn("[site-hits] Bikriup did not take a batch:", (err as Error).message);
      }
      if (!status || status >= 500 || status === 429) {
        state.queue.unshift(...batch);
        state.timer ??= setTimeout(() => void flushHits(), 30_000);
      }
      return;
    }
  }
}

/** Test hook. */
export function pendingHits(): SiteHit[] {
  return state.queue;
}
