import { createHmac, timingSafeEqual } from "node:crypto";

import { serverEnv } from "./env";

/**
 * Bikriup is the shop's back office: the catalogue, stock, orders, reviews and
 * enquiries live there, and staff work in its admin desk and phone app. This
 * module is the site's only door to it — a server-side client for the shop's
 * /api/v1 with the secret key, which must never reach the browser.
 *
 * The rest of the site keeps its own shapes (StoreProduct, OrderSummary, …);
 * the mapping lives here so the pages did not have to change.
 */

export function bikriupEnabled(): boolean {
  return Boolean(serverEnv.BIKRIUP_API_URL && serverEnv.BIKRIUP_SECRET_KEY);
}

export class BikriupError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function bikriup<T>(
  path: string,
  init: { method?: string; body?: unknown; idempotencyKey?: string; forwardedFor?: string } = {},
): Promise<T> {
  const base = (serverEnv.BIKRIUP_API_URL ?? "").replace(/\/$/, "");
  const res = await fetch(`${base}${path}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${serverEnv.BIKRIUP_SECRET_KEY}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.idempotencyKey ? { "Idempotency-Key": init.idempotencyKey } : {}),
      // Bikriup rate-limits public writes per shopper; without this every shopper is this server.
      ...(init.forwardedFor ? { "X-Forwarded-For": init.forwardedFor } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    // Caching is done one level up with unstable_cache and tags, so the
    // webhook can invalidate it; the raw fetch must always be fresh.
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new BikriupError(data.error ?? `Bikriup answered ${res.status}`, res.status);
  return data as T;
}

/* ---------- Catalogue ---------- */

export interface BkProduct {
  id: number;
  slug: string;
  style_group: string;
  name: string;
  price: number;
  mrp?: number;
  in_stock: boolean;
  stock_left: number;
  category?: string;
  type?: string;
  size_label?: string;
  description?: string;
  story?: string;
  care?: string[];
  specs?: Array<{ label: string; value: string }>;
  fulfilment?: "ship" | "local" | "pickup";
  images: Array<{ url: string; alt: string }>;
}

const FULFILMENT = { ship: "ship_nationwide", local: "local_delivery_only", pickup: "pickup_only" } as const;

/**
 * Bikriup stores the plain Cloudinary URL; the site keeps building its own
 * transformations from the public id, as before.
 */
export function cloudinaryRef(url: string): { publicId: string; version: string | null; resourceType: "image" | "video" } | null {
  const m = /res\.cloudinary\.com\/[^/]+\/(image|video)\/upload\/(?:[^/]*,[^/]*\/)?(?:v(\d+)\/)?(.+)$/.exec(url);
  if (!m) return null;
  return { resourceType: m[1] as "image" | "video", version: m[2] ?? null, publicId: m[3].replace(/\.[a-z0-9]{2,4}$/i, "") };
}

/**
 * Photos uploaded in Bikriup (Excel import, the product editor) live on Bikriup, not Cloudinary. Bikriup
 * names them with the address this server called it on, which a browser cannot reach when that is
 * loopback — so the path is re-based on the public address (BIKRIUP_MEDIA_URL, else the admin host).
 */
function mediaUrl(url: string): string {
  const explicit = serverEnv.BIKRIUP_MEDIA_URL;
  let u: URL;
  try { u = new URL(url); } catch { return url; }
  const loopback = u.hostname === "127.0.0.1";
  const base = explicit ?? (loopback && serverEnv.BIKRIUP_ADMIN_URL ? new URL(serverEnv.BIKRIUP_ADMIN_URL).origin : null);
  return base ? `${base.replace(/\/$/, "")}${u.pathname}${u.search}` : url;
}

const rupeesToPaise = (n: number | undefined) => Math.round((n ?? 0) * 100);

export function toStoreProductShape(p: BkProduct) {
  const images = p.images
    .map((img) => ({ img, ref: cloudinaryRef(img.url) ?? (/^https?:\/\//.test(img.url) ? { publicId: mediaUrl(img.url), version: null, resourceType: "image" as const } : null) }))
    .filter((x) => x.ref)
    .map(({ img, ref }) => ({ ...ref!, alt: img.alt, width: null, height: null, isPrimary: false }));
  // The cover is the first styled photo; cutouts are found by name, as before.
  const cover = images.find((i) => !i.publicId.endsWith("-cutout")) ?? images[0];
  if (cover) cover.isPrimary = true;
  const description = p.description ?? "";
  return {
    id: String(p.id),
    slug: p.slug,
    name: p.name,
    // "Cookware · 2.5 L" and the hand-written line came across as type and details.
    tag: p.type ?? "",
    note: description.split("\n")[0] ?? "",
    description,
    story: p.story ?? "",
    sizeLabel: p.size_label ?? "",
    pricePaise: rupeesToPaise(p.price),
    compareAtPaise: p.mrp && p.mrp > p.price ? rupeesToPaise(p.mrp) : null,
    status: "active" as const,
    fulfilmentMode: FULFILMENT[p.fulfilment ?? "ship"],
    // Bikriup only says whether it is in stock (and "only 2 left"); that is all the pages use.
    stockQty: p.in_stock ? p.stock_left || 99 : 0,
    trackInventory: true,
    categorySlug: p.category ? p.category.toLowerCase().replace(/[^a-z0-9]+/g, "-") : null,
    categoryName: p.category ?? null,
    specs: p.specs ?? [],
    care: p.care ?? [],
    images,
  };
}

/* ---------- Orders ---------- */

export interface BkOrder {
  order_no: string;
  status:
    | "placed"
    | "confirmed"
    | "packed"
    | "shipped"
    | "out_for_delivery"
    | "delivered"
    | "completed"
    | "cancelled"
    | "delivery_failed"
    | "rto"
    | "return_requested"
    | "return_received"
    | "returned";
  status_label: string;
  payment_method: "cod" | "upi" | "online" | "whatsapp";
  payment_status: string;
  customer_name: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  subtotal: number;
  discount: number;
  delivery: number;
  total: number;
  created_at: string;
  external_ref: string;
  payment_ref: string;
  courier?: string;
  tracking_no?: string;
  tracking_url?: string;
  /** The order number is the invoice number; empty until the studio confirms the order. */
  invoice_url?: string;
  credit_notes?: Array<{ order_no: string; total: number; refund_status: string }>;
  items: Array<{ product_id: number; name: string; size: string; qty: number; price: number; line_total: number }>;
}

/**
 * The customer's link to their order. Bikriup order numbers are sequential, so
 * the link carries the number and phone signed with the site's secret — it can
 * be checked without a database, and cannot be walked.
 */
function sign(payload: string) {
  return createHmac("sha256", `order-link:${serverEnv.BIKRIUP_SECRET_KEY}`).update(payload).digest("base64url").slice(0, 32);
}

export function orderToken(orderNo: string, phone: string): string {
  const payload = Buffer.from(`${orderNo}.${phone.replace(/\D/g, "").slice(-10)}`).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readOrderToken(token: string): { orderNo: string; phone: string } | null {
  const [payload, mac] = String(token).split(".");
  if (!payload || !mac || mac.length !== 32) return null;
  const want = Buffer.from(sign(payload));
  const got = Buffer.from(mac);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  const [orderNo, phone] = Buffer.from(payload, "base64url").toString().split(".");
  return orderNo && phone ? { orderNo, phone } : null;
}

export async function getBikriupOrder(token: string): Promise<BkOrder | null> {
  const ref = readOrderToken(token);
  if (!ref) return null;
  try {
    return await bikriup<BkOrder>(`/orders/${encodeURIComponent(ref.orderNo)}?phone=${ref.phone}`);
  } catch (error) {
    if (error instanceof BikriupError && error.status === 404) return null;
    throw error;
  }
}

const ORDER_STATUS = {
  placed: "pending",
  confirmed: "confirmed",
  packed: "crafting",
  shipped: "dispatched",
  out_for_delivery: "out_for_delivery",
  delivery_failed: "out_for_delivery",
  delivered: "delivered",
  completed: "delivered",
  return_requested: "delivered",
  return_received: "delivered",
  rto: "cancelled",
  returned: "cancelled",
  cancelled: "cancelled",
} as const;

export function siteOrderStatus(o: BkOrder) {
  return ORDER_STATUS[o.status] ?? "pending";
}

export function sitePaymentStatus(o: BkOrder): "unpaid" | "paid" | "failed" | "refunded" {
  if (o.payment_status === "refunded") return "refunded";
  // A refund that is due is still money the buyer paid.
  if (["paid", "refund_due", "cod_collected"].includes(o.payment_status)) return "paid";
  return o.payment_status === "failed" ? "failed" : "unpaid";
}

export function sitePaymentProvider(o: BkOrder): string {
  return o.payment_method === "online" ? "razorpay" : o.payment_method;
}

/** Webhook from Bikriup: X-Bikriup-Signature = t=…,v1=HMAC-SHA256(secret, "t.body"). */
export function verifyBikriupSignature(rawBody: string, header: string | null): boolean {
  const secret = serverEnv.BIKRIUP_WEBHOOK_SECRET;
  if (!secret || !header) return false;
  const parts = Object.fromEntries(header.split(",").map((kv) => kv.split("=") as [string, string]));
  const t = Number(parts.t);
  if (!t || Math.abs(Date.now() / 1000 - t) > 600) return false;
  const want = Buffer.from(createHmac("sha256", secret).update(`${parts.t}.${rawBody}`).digest("hex"));
  const got = Buffer.from(parts.v1 ?? "");
  return want.length === got.length && timingSafeEqual(want, got);
}
