/**
 * Browser analytics (GA4 + Google Ads). The IDs are public by design and baked in at build time,
 * so they must be set before `next build`. With no ID set every call below does nothing.
 */
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";
export const ADS_ID = process.env.NEXT_PUBLIC_GADS_ID ?? "";

type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
    /** Set once `js` and `config` are queued, so the page's init script does not queue them twice. */
    __mkGtag?: boolean;
  }
}

export interface AnalyticsItem {
  item_id: string;
  item_name: string;
  item_category?: string;
  item_variant?: string;
  price: number;
  quantity?: number;
}

/** Makes `gtag` exist before gtag.js has loaded, so early events queue instead of being lost. */
export function ensureGtag(): Gtag {
  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function () {
      // gtag.js only understands the `arguments` object, not an array.
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
    // Events must queue after `config`, or Google can drop the first one (view_item on a fresh load).
    window.gtag("js", new Date());
    window.gtag("config", GA_ID);
    if (ADS_ID) window.gtag("config", ADS_ID);
    window.__mkGtag = true;
  }
  return window.gtag;
}

/** Sends a GA4 event; safe on the server, in dev, and before the tag has loaded. */
export function track(event: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined" || !GA_ID) return;
  ensureGtag()("event", event, params);
}

/** Maps a product or basket line to a GA4 item. Prices are rupees, not paise. */
export function toItem(
  p: { slug: string; name: string; tag?: string; sizeLabel?: string; pricePaise: number },
  quantity = 1,
): AnalyticsItem {
  return {
    item_id: p.slug,
    item_name: p.name,
    item_category: p.tag || undefined,
    item_variant: p.sizeLabel || undefined,
    price: p.pricePaise / 100,
    quantity,
  };
}
