/**
 * Browser analytics (GA4 + Google Ads). The IDs are public by design and baked in at build time,
 * so they must be set before `next build`. With no ID set every call below does nothing.
 */
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";
export const ADS_ID = process.env.NEXT_PUBLIC_GADS_ID ?? "";
export const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";

type Gtag = (...args: unknown[]) => void;
type Fbq = ((...args: unknown[]) => void) & { callMethod?: (...args: unknown[]) => void; queue?: unknown[][] };

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
    /** Set once `js` and `config` are queued, so the page's init script does not queue them twice. */
    __mkGtag?: boolean;
    fbq?: Fbq;
    _fbq?: Fbq;
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

/** Makes `fbq` exist before Meta's script has loaded; its queue is replayed when the script arrives. */
export function ensureFbq(): Fbq {
  if (!window.fbq) {
    const fbq: Fbq = function (...args: unknown[]) {
      if (fbq.callMethod) fbq.callMethod(...args);
      else fbq.queue!.push(args);
    };
    fbq.queue = [];
    window.fbq = window._fbq = fbq;
    fbq("init", PIXEL_ID);
    fbq("track", "PageView");
  }
  return window.fbq;
}

/** How each GA4 event is named on Meta. Purchase carries the order number so Meta can de-duplicate. */
function sendToMeta(event: string, params: Record<string, unknown> = {}) {
  const items = (params.items as AnalyticsItem[] | undefined) ?? [];
  const content = {
    content_ids: items.map((i) => i.item_id),
    content_type: "product",
    contents: items.map((i) => ({ id: i.item_id, quantity: i.quantity ?? 1, item_price: i.price })),
    value: params.value,
    currency: params.currency ?? "INR",
  };
  const fbq = ensureFbq();
  switch (event) {
    case "view_item": fbq("track", "ViewContent", content); break;
    case "add_to_cart": fbq("track", "AddToCart", content); break;
    case "begin_checkout": fbq("track", "InitiateCheckout", { ...content, num_items: items.length }); break;
    case "add_payment_info": fbq("track", "AddPaymentInfo", content); break;
    case "generate_lead": fbq("track", "Contact"); break;
    case "purchase":
      fbq("track", "Purchase", { ...content, num_items: items.length }, { eventID: String(params.transaction_id ?? "") });
      break;
    case "page_view": fbq("track", "PageView"); break;
  }
}

/** Sends an event to GA4 and the Meta Pixel; safe on the server, in dev, and before either has loaded. */
export function track(event: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  if (GA_ID) ensureGtag()("event", event, params);
  if (PIXEL_ID) sendToMeta(event, params);
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
