"use server";

import { randomBytes, randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { getSession } from "../auth-guard";
import { db } from "../db";
import { product } from "../db/schema/catalog";
import { order, orderEvent, orderItem } from "../db/schema/orders";

export type CheckoutResult =
  | { ok: true; token: string; method: CheckoutMethod }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export type CheckoutMethod = "gateway" | "whatsapp";

const MAX_LINES = 50;
const MAX_QTY_PER_LINE = 50;

/**
 * Ten digits, optionally with a +91 / 91 / 0 prefix and any amount of human
 * spacing. Normalised to +91XXXXXXXXXX before storage so the WhatsApp deep link
 * and any future SMS gateway both get one predictable shape.
 */
function normalisePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  const local =
    digits.length === 10
      ? digits
      : digits.length === 11 && digits.startsWith("0")
        ? digits.slice(1)
        : digits.length === 12 && digits.startsWith("91")
          ? digits.slice(2)
          : null;

  // Indian mobile numbers start 6-9; landlines cannot receive a WhatsApp
  // confirmation, which is the studio's primary channel.
  if (!local || !/^[6-9]\d{9}$/.test(local)) return null;
  return `+91${local}`;
}

const lineSchema = z.object({
  slug: z.string().trim().min(1).max(200),
  qty: z.coerce.number().int().min(1).max(MAX_QTY_PER_LINE),
});

const checkoutSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name").max(120),
  email: z.string().trim().toLowerCase().email("Please enter a valid email address").max(200),
  phone: z
    .string()
    .trim()
    .min(1, "Phone is required")
    .transform((value, ctx) => {
      const normalised = normalisePhone(value);
      if (!normalised) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter a 10-digit Indian mobile number",
        });
        return z.NEVER;
      }
      return normalised;
    }),
  line1: z.string().trim().min(4, "Please enter the street address").max(200),
  line2: z.string().trim().max(200).default(""),
  city: z.string().trim().min(2, "City is required").max(120),
  state: z.string().trim().min(2, "State is required").max(120),
  postalCode: z
    .string()
    .trim()
    .regex(/^[1-9]\d{5}$/, "Enter a 6-digit PIN code"),
  note: z.string().trim().max(500).default(""),
  method: z.enum(["gateway", "whatsapp"]),
  items: z.array(lineSchema).min(1, "Your basket is empty").max(MAX_LINES),
});

/**
 * Creates an order from the browser cart.
 *
 * The single most important thing this function does is ignore the prices the
 * browser sent. `src/lib/cart.ts` keeps a display snapshot in localStorage,
 * which the visitor can edit freely; every amount below is re-read from the
 * product table. The client's figures are never referenced at all.
 *
 * Guests are allowed — no `requireUser` here. That is why `src/proxy.ts`
 * deliberately does not match `/checkout`.
 */
export async function placeOrder(input: unknown): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, error: "Please correct the highlighted fields.", fieldErrors };
  }

  const d = parsed.data;

  // Collapse duplicate slugs rather than trusting the client to have done it.
  const requested = new Map<string, number>();
  for (const line of d.items) {
    requested.set(line.slug, (requested.get(line.slug) ?? 0) + line.qty);
  }

  const rows = await db.query.product.findMany({
    where: inArray(product.slug, [...requested.keys()]),
    with: { images: true },
  });
  const bySlug = new Map(rows.map((row) => [row.slug, row]));

  const unavailable: string[] = [];
  const outOfStock: string[] = [];
  const lines: Array<typeof orderItem.$inferInsert> = [];
  const orderId = randomUUID();
  let subtotalPaise = 0;

  for (const [slug, qty] of requested) {
    const row = bySlug.get(slug);

    // Draft and archived products are as unbuyable as ones that never existed.
    if (!row || row.status !== "active") {
      unavailable.push(row?.name ?? slug);
      continue;
    }

    if (row.trackInventory && row.stockQty < qty) {
      outOfStock.push(`${row.name} ${row.sizeLabel}`.trim());
      continue;
    }

    const unitPricePaise = row.pricePaise;
    const lineTotalPaise = unitPricePaise * qty;
    subtotalPaise += lineTotalPaise;

    const primaryImage =
      row.images.find((image) => image.isPrimary) ??
      row.images.slice().sort((a, b) => a.sortOrder - b.sortOrder)[0] ??
      null;

    lines.push({
      id: randomUUID(),
      orderId,
      productId: row.id,
      // Snapshot, not a join. Editing a price later must not rewrite history.
      productSlug: row.slug,
      productName: `${row.name} ${row.sizeLabel}`.trim(),
      imagePublicId: primaryImage?.publicId ?? null,
      unitPricePaise,
      qty,
      lineTotalPaise,
    });
  }

  if (unavailable.length > 0) {
    return {
      ok: false,
      error: `No longer available: ${unavailable.join(", ")}. Please remove ${unavailable.length === 1 ? "it" : "them"} from your basket.`,
    };
  }

  if (outOfStock.length > 0) {
    return {
      ok: false,
      error: `We don't have enough of ${outOfStock.join(", ")} in stock right now. Please reduce the quantity.`,
    };
  }

  if (lines.length === 0) {
    return { ok: false, error: "Your basket is empty." };
  }

  const session = await getSession();

  /**
   * Shipping is zero on purpose, and must stay that way. `product.pricePaise`
   * already contains the zone-blended all-India freight computed in
   * `src/server/pricing/compute.ts` — that is the entire point of a single
   * national price. Adding freight again here would charge it twice.
   */
  const shippingPaise = 0;
  const totalPaise = subtotalPaise + shippingPaise;

  // 24 random bytes, URL-safe. Long enough that guessing one is not a strategy.
  const lookupToken = randomBytes(24).toString("base64url");
  const paymentProvider = d.method === "whatsapp" ? "whatsapp" : "mock";

  // Neon's HTTP driver has no interactive transactions; `batch` runs these three
  // statements as one. Ids were generated above so nothing needs reading back.
  await db.batch([
    db.insert(order).values({
      id: orderId,
      lookupToken,
      userId: session?.user.id ?? null,
      contactEmail: d.email,
      contactPhone: d.phone,
      shippingName: d.name,
      shippingLine1: d.line1,
      shippingLine2: d.line2 || null,
      shippingCity: d.city,
      shippingState: d.state,
      shippingPostalCode: d.postalCode,
      subtotalPaise,
      shippingPaise,
      totalPaise,
      paymentProvider,
      customerNote: d.note || null,
    }),
    db.insert(orderItem).values(lines),
    db.insert(orderEvent).values({
      orderId,
      status: "pending",
      note:
        d.method === "whatsapp"
          ? "Order placed — awaiting confirmation over WhatsApp."
          : "Order placed — awaiting payment.",
    }),
  ]);

  return { ok: true, token: lookupToken, method: d.method };
}

export type SettleResult = { ok: true; paid: boolean } | { ok: false; error: string };

/**
 * The mock payment gateway's callback.
 *
 * SECURITY: this marks an order paid without any money having moved, and anyone
 * holding the lookup token can call it. That is inherent to a mock and is
 * acceptable only until a real provider is chosen. The guards below keep the
 * blast radius small — it refuses any order not created as `mock`, and refuses
 * to run twice — but this function MUST be deleted, not adapted, when a real
 * gateway arrives. A real provider's callback is verified by signature and is
 * never trusted on the strength of a URL the customer holds.
 */
export async function settleMockPayment(
  token: string,
  outcome: "success" | "failure",
): Promise<SettleResult> {
  if (!token || token.length > 200) return { ok: false, error: "Unknown order." };

  const row = await db.query.order.findFirst({
    where: eq(order.lookupToken, token),
    columns: { id: true, paymentProvider: true, paymentStatus: true, status: true },
  });

  if (!row) return { ok: false, error: "Unknown order." };
  if (row.paymentProvider !== "mock") {
    return { ok: false, error: "This order is not paid through the mock gateway." };
  }
  if (row.paymentStatus !== "unpaid") {
    return { ok: false, error: "This order has already been settled." };
  }

  const now = new Date();

  if (outcome === "failure") {
    await db.batch([
      db
        .update(order)
        .set({ paymentStatus: "failed", updatedAt: now })
        // Re-checked in the WHERE clause so two concurrent clicks cannot both
        // write; the second matches nothing.
        .where(and(eq(order.id, row.id), eq(order.paymentStatus, "unpaid"))),
      db.insert(orderEvent).values({
        orderId: row.id,
        status: "pending",
        note: "Mock payment failed. The order is still awaiting payment.",
      }),
    ]);
    return { ok: true, paid: false };
  }

  await db.batch([
    db
      .update(order)
      .set({
        paymentStatus: "paid",
        status: "confirmed",
        paymentRef: `MOCK-${randomBytes(6).toString("hex").toUpperCase()}`,
        updatedAt: now,
      })
      .where(and(eq(order.id, row.id), eq(order.paymentStatus, "unpaid"))),
    db.insert(orderEvent).values({
      orderId: row.id,
      status: "confirmed",
      note: "Payment received through the mock gateway.",
    }),
  ]);

  return { ok: true, paid: true };
}
