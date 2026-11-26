/**
 * First-party visit counting for Bikriup's Analytics menu. Each page view and a few shop events go
 * to our own /api/hit, which forwards them to Bikriup in batches. Nothing personal is sent: the
 * visitor is a random id kept in this browser, a visit ("session") ends after 30 idle minutes.
 *
 * Staff can stop counting their own browser with ?mk_notrack=1 (and undo it with ?mk_notrack=0).
 */

const VISITOR_KEY = "mk.vid";
const SESSION_KEY = "mk.sess";
const OPT_OUT_KEY = "mk.notrack";
const IDLE_MS = 30 * 60 * 1000;

export type HitEvent = "page_view" | "add_to_cart" | "begin_checkout" | "purchase" | "lead";
export type PageType =
  "home" | "category" | "product" | "cart" | "checkout" | "order" | "content" | "account" | "other";

interface Session {
  id: string;
  last: number;
  ref_host: string;
  source: string;
  medium: string;
  campaign: string;
  paid: boolean;
}

export interface HitItem {
  slug: string;
  qty?: number;
  price?: number;
}

export interface HitExtra {
  value?: number;
  order_no?: string;
  items?: HitItem[];
}

// First path segments that are pages of their own; any other single segment is a category (/[category]).
const CONTENT = new Set([
  "benefits",
  "bulk-orders",
  "care",
  "faq",
  "journal",
  "privacy",
  "shipping-returns",
  "soil-report",
  "terms",
  "trust",
  "videos",
  "workshops",
  "newsletter",
]);
const ACCOUNT = new Set(["sign-in", "forgot-password", "reset-password", "verify", "account"]);
const PRIVATE = new Set(["admin", "api"]);

/**
 * The page's kind, and its address with secrets taken out: order and payment links carry a
 * token in the path, which must never leave the site.
 */
export function pageInfo(
  pathname: string,
): { path: string; page_type: PageType; slug: string } | null {
  const clean = (pathname.replace(/[?#].*$/, "").replace(/\/+$/, "") || "/").toLowerCase();
  const parts = clean.split("/").filter(Boolean);
  const [a, b] = parts;
  if (!a) return { path: "/", page_type: "home", slug: "" };
  if (PRIVATE.has(a)) return null;
  if (a === "shop")
    return b
      ? { path: `/shop/${b}`, page_type: "product", slug: b }
      : { path: "/shop", page_type: "category", slug: "" };
  if (a === "checkout") {
    if (b === "done") return { path: "/checkout/done", page_type: "order", slug: "" };
    if (b === "pay") return { path: "/checkout/pay", page_type: "checkout", slug: "" };
    return { path: "/checkout", page_type: "checkout", slug: "" };
  }
  if (a === "pay" || a === "paylink") return { path: `/${a}`, page_type: "checkout", slug: "" };
  if (a === "track") return { path: "/track", page_type: "order", slug: "" };
  if (ACCOUNT.has(a)) return { path: `/${a}`, page_type: "account", slug: "" };
  if (CONTENT.has(a)) return { path: clean, page_type: "content", slug: "" };
  if (parts.length === 1) return { path: clean, page_type: "category", slug: "" };
  return { path: clean, page_type: "other", slug: "" };
}

function randomId(): string {
  try {
    return crypto.randomUUID().replace(/-/g, "");
  } catch {
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
  }
}

function store(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function optedOut(): boolean {
  const s = store();
  const flag = new URLSearchParams(window.location.search).get("mk_notrack");
  if (flag === "1") s?.setItem(OPT_OUT_KEY, "1");
  if (flag === "0") s?.removeItem(OPT_OUT_KEY);
  return s?.getItem(OPT_OUT_KEY) === "1" || navigator.webdriver === true;
}

// Without storage every hit looks new; the in-memory copy keeps one tab's visit together.
let memory: { visitor?: string; session?: Session } = {};

function visitor(): { id: string; fresh: boolean } {
  const s = store();
  const known = s?.getItem(VISITOR_KEY) || memory.visitor;
  if (known) return { id: known, fresh: false };
  const id = randomId();
  s?.setItem(VISITOR_KEY, id);
  memory.visitor = id;
  return { id, fresh: true };
}

/** Where this visit came from: tagged links win, then the referring website (never ourselves). */
function arrival(): Omit<Session, "id" | "last"> {
  const q = new URLSearchParams(window.location.search);
  let ref_host = "";
  try {
    const host = document.referrer ? new URL(document.referrer).hostname : "";
    if (host && host !== window.location.hostname) ref_host = host;
  } catch {
    ref_host = "";
  }
  return {
    ref_host,
    source: q.get("utm_source") ?? "",
    medium: q.get("utm_medium") ?? "",
    campaign: q.get("utm_campaign") ?? "",
    // Ad click ids. Not fbclid: Facebook adds it to ordinary shared links too.
    paid: ["gclid", "gbraid", "wbraid", "msclkid"].some((k) => q.has(k)),
  };
}

function session(isPageView: boolean): { s: Session; landing: boolean } {
  const st = store();
  let s: Session | undefined = memory.session;
  try {
    s = JSON.parse(st?.getItem(SESSION_KEY) || "null") ?? s;
  } catch {
    // A broken value starts a new visit.
  }
  const now = Date.now();
  const came = isPageView ? arrival() : null;
  // A new tagged link or outside referrer mid-visit starts a new visit, as Google Analytics does.
  const switched =
    !!came &&
    !!s &&
    ((came.source && came.source !== s.source) || (came.ref_host && came.ref_host !== s.ref_host));
  let landing = false;
  if (!s || now - s.last > IDLE_MS || switched) {
    s = { id: randomId(), last: now, ...(came ?? arrival()) };
    landing = true;
  }
  s.last = now;
  memory.session = s;
  try {
    st?.setItem(SESSION_KEY, JSON.stringify(s));
  } catch {
    // Storage full or blocked: the in-memory copy carries on.
  }
  return { s, landing };
}

/** Sends one page view or event. Safe to call anywhere; does nothing on the server or for bots. */
export function sendHit(event: HitEvent, extra: HitExtra = {}): void {
  if (typeof window === "undefined") return;
  try {
    if (optedOut()) return;
    const page = pageInfo(window.location.pathname);
    if (!page) return;
    const v = visitor();
    const { s, landing } = session(event === "page_view");
    const body = JSON.stringify({
      event,
      ...page,
      title: event === "page_view" ? document.title.slice(0, 200) : "",
      visitor: v.id,
      session: s.id,
      new_visitor: v.fresh,
      landing: landing && event === "page_view",
      ref_host: s.ref_host,
      source: s.source,
      medium: s.medium,
      campaign: s.campaign,
      paid: s.paid,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
      screen: Math.min(window.screen?.width || 0, window.innerWidth || 0),
      ...extra,
      at: new Date().toISOString(),
    });
    const blob = new Blob([body], { type: "application/json" });
    if (!navigator.sendBeacon?.("/api/hit", blob)) {
      void fetch("/api/hit", {
        method: "POST",
        body,
        headers: { "Content-Type": "application/json" },
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Counting must never break the page.
  }
}

/** Test hook: forget the in-memory visitor and visit. */
export function resetHitMemory() {
  memory = {};
}
