"use server";

import { randomBytes, randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { COD_REGION_LABEL, isCodEligible } from "@/lib/serviceability";

import { getSession } from "../auth-guard";
import {
  BikriupError,
  bikriup,
  bikriupEnabled,
  getBikriupOrder,
  orderToken,
  readOrderToken,
  type BkOrder,
} from "../bikriup";
import { settleBikriupPayment } from "../bikriup-payments";
import { db } from "../db";
import { product } from "../db/schema/catalog";
import { order, orderEvent, orderItem, paymentTransaction } from "../db/schema/orders";
import { sendOrderConfirmationEmail } from "../email/send";
import {
  createGatewayOrder,
  describePaymentMethod,
  fetchGatewayPayment,
  razorpayConfigured,
  razorpayKeyId,
  verifyPaymentSignature,
} from "../razorpay";

export type CheckoutResult =
  | { ok: true; token: string; method: CheckoutMethod }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export type CheckoutMethod = "gateway" | "whatsapp" | "cod";

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
  method: z.enum(["gateway", "whatsapp", "cod"]),
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

  // The form only shows COD inside the serviceable region, but that is UX,
  // not enforcement — re-checked here like everything else the client sends.
  if (d.method === "cod" && !isCodEligible(d.postalCode)) {
    return {
      ok: false,
      error: `Cash on delivery is available only in ${COD_REGION_LABEL}.`,
      fieldErrors: {
        postalCode: `COD is not available for this PIN code — only ${COD_REGION_LABEL}.`,
      },
    };
  }

  // Collapse duplicate slugs rather than trusting the client to have done it.
  const requested = new Map<string, number>();
  for (const line of d.items) {
    requested.set(line.slug, (requested.get(line.slug) ?? 0) + line.qty);
  }

  if (bikriupEnabled()) return placeBikriupOrder(d, requested);

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
  const paymentProvider =
    d.method === "whatsapp" ? "whatsapp" : d.method === "cod" ? "cod" : "razorpay";

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
          : d.method === "cod"
            ? "Order placed — cash on delivery, payment collected at the door."
            : "Order placed — awaiting payment.",
    }),
  ]);

  // The order number comes from a DB sequence, so it has to be read back for
  // the email. Best-effort from here down: the order is already committed, and
  // sendOrderConfirmationEmail never throws.
  const created = await db.query.order.findFirst({
    where: eq(order.id, orderId),
    columns: { orderNumber: true },
  });

  await sendOrderConfirmationEmail({
    to: d.email,
    customerName: d.name,
    orderNumber: created?.orderNumber ?? "(pending)",
    lookupToken,
    method: d.method,
    items: lines.map((line) => ({
      productName: line.productName,
      qty: line.qty,
      unitPricePaise: line.unitPricePaise,
      lineTotalPaise: line.lineTotalPaise,
      imagePublicId: line.imagePublicId ?? null,
    })),
    subtotalPaise,
    shippingPaise,
    totalPaise,
    address: {
      line1: d.line1,
      line2: d.line2 || null,
      city: d.city,
      state: d.state,
      postalCode: d.postalCode,
    },
  });

  return { ok: true, token: lookupToken, method: d.method };
}

/**
 * The order goes to Bikriup, which re-prices it from its own catalogue, checks
 * and takes the stock, and numbers it (MK…). Staff see it in Billing › Orders
 * at once. The browser's prices are never sent — only slugs and quantities.
 */
async function placeBikriupOrder(
  d: z.infer<typeof checkoutSchema>,
  requested: Map<string, number>,
): Promise<CheckoutResult> {
  let created: BkOrder;
  try {
    created = await bikriup<BkOrder>("/orders", {
      method: "POST",
      idempotencyKey: randomUUID(),
      body: {
        name: d.name,
        phone: d.phone,
        email: d.email,
        address: [d.line1, [d.line2, d.state].filter(Boolean).join(", ")].filter(Boolean).join("\n"),
        city: d.city,
        pincode: d.postalCode,
        note: d.note,
        payment_method: d.method === "gateway" ? "online" : d.method,
        payment_provider: d.method === "gateway" ? "razorpay" : d.method,
        items: [...requested].map(([slug, qty]) => ({ slug, qty })),
      },
    });
  } catch (error) {
    if (error instanceof BikriupError && error.status < 500) return { ok: false, error: error.message };
    console.error("[bikriup] order failed:", error);
    return { ok: false, error: "We could not place the order just now. Please try again in a minute." };
  }

  const token = orderToken(created.order_no, created.phone);
  await sendOrderConfirmationEmail({
    to: d.email,
    customerName: d.name,
    orderNumber: created.order_no,
    lookupToken: token,
    method: d.method,
    items: created.items.map((item) => ({
      productName: [item.name, item.size].filter(Boolean).join(" "),
      qty: item.qty,
      unitPricePaise: Math.round(item.price * 100),
      lineTotalPaise: Math.round(item.line_total * 100),
      imagePublicId: null,
    })),
    subtotalPaise: Math.round(created.subtotal * 100),
    shippingPaise: Math.round(created.delivery * 100),
    totalPaise: Math.round(created.total * 100),
    address: { line1: d.line1, line2: d.line2 || null, city: d.city, state: d.state, postalCode: d.postalCode },
  });

  return { ok: true, token, method: d.method };
}

// ---------------------------------------------------------------------------
// Razorpay
// ---------------------------------------------------------------------------

export type InitiatePaymentResult =
  | {
      ok: true;
      keyId: string;
      gatewayOrderId: string;
      amountPaise: number;
      currency: string;
      orderNumber: string;
      customerName: string;
      customerEmail: string | null;
      customerPhone: string | null;
    }
  | { ok: false; error: string };

/**
 * Mints (or reuses) the Razorpay order the checkout modal is opened against,
 * and records the attempt as a `payment_transaction` row.
 *
 * Holding the lookup token is sufficient here on purpose — this only *starts*
 * a payment for the token-holder's own order. Nothing is ever marked paid on
 * this path; settlement requires Razorpay's signature.
 */
export async function initiateRazorpayPayment(token: string): Promise<InitiatePaymentResult> {
  if (!token || token.length > 200) return { ok: false, error: "Unknown order." };

  if (!razorpayConfigured()) {
    return {
      ok: false,
      error: "Online payment is not available right now. Please pay via WhatsApp instead.",
    };
  }

  if (bikriupEnabled()) {
    const o = await getBikriupOrder(token);
    if (!o) return { ok: false, error: "Unknown order." };
    if (o.payment_method !== "online") return { ok: false, error: "This order is not paid online." };
    if (o.payment_status === "paid") return { ok: false, error: "This order has already been paid." };
    if (o.status === "cancelled") return { ok: false, error: "This order was cancelled." };
    const amountPaise = Math.round(o.total * 100);
    try {
      // The receipt is the order number: confirmation checks it before anything is marked paid.
      const created = await createGatewayOrder({ amountPaise, receipt: o.order_no, notes: { order_number: o.order_no } });
      return {
        ok: true,
        keyId: razorpayKeyId(),
        gatewayOrderId: created.id,
        amountPaise,
        currency: "INR",
        orderNumber: o.order_no,
        customerName: o.customer_name,
        customerEmail: null,
        customerPhone: `+91${o.phone}`,
      };
    } catch (error) {
      console.error("[razorpay] order create failed:", error);
      return { ok: false, error: "Could not reach the payment gateway. Please try again." };
    }
  }

  const row = await db.query.order.findFirst({
    where: eq(order.lookupToken, token),
    columns: {
      id: true,
      orderNumber: true,
      totalPaise: true,
      currency: true,
      paymentProvider: true,
      paymentStatus: true,
      shippingName: true,
      contactEmail: true,
      contactPhone: true,
    },
  });

  if (!row) return { ok: false, error: "Unknown order." };
  if (row.paymentProvider !== "razorpay") {
    return { ok: false, error: "This order is not paid online." };
  }
  if (row.paymentStatus === "paid") {
    return { ok: false, error: "This order has already been paid." };
  }

  // A refresh of the pay page reuses the open attempt rather than minting a
  // fresh gateway order each time. Settled or failed attempts never match.
  const open = await db.query.paymentTransaction.findFirst({
    where: and(
      eq(paymentTransaction.orderId, row.id),
      eq(paymentTransaction.status, "created"),
      eq(paymentTransaction.amountPaise, row.totalPaise),
    ),
    columns: { providerOrderId: true },
  });

  let gatewayOrderId = open?.providerOrderId ?? null;

  if (!gatewayOrderId) {
    let created: { id: string };
    try {
      created = await createGatewayOrder({
        amountPaise: row.totalPaise,
        receipt: row.orderNumber,
        notes: { order_number: row.orderNumber },
      });
    } catch (error) {
      console.error("[razorpay] order create failed:", error);
      return { ok: false, error: "Could not reach the payment gateway. Please try again." };
    }
    gatewayOrderId = created.id;

    await db.insert(paymentTransaction).values({
      id: randomUUID(),
      orderId: row.id,
      provider: "razorpay",
      providerOrderId: gatewayOrderId,
      amountPaise: row.totalPaise,
      currency: row.currency,
    });
  }

  return {
    ok: true,
    keyId: razorpayKeyId(),
    gatewayOrderId,
    amountPaise: row.totalPaise,
    currency: row.currency,
    orderNumber: row.orderNumber,
    customerName: row.shippingName,
    customerEmail: row.contactEmail,
    customerPhone: row.contactPhone,
  };
}

export type SettleResult = { ok: true; paid: boolean } | { ok: false; error: string };

const confirmSchema = z.object({
  gatewayOrderId: z.string().min(1).max(100),
  gatewayPaymentId: z.string().min(1).max(100),
  signature: z.string().min(1).max(200),
});

/**
 * Settles an order after the checkout modal reports success.
 *
 * Nothing the browser sends is trusted on its own: the signature is verified
 * against our API secret, then the payment is re-fetched from Razorpay's API
 * and its order id, amount and status are checked against our own transaction
 * row before anything is marked paid.
 */
export async function confirmRazorpayPayment(token: string, input: unknown): Promise<SettleResult> {
  if (!token || token.length > 200) return { ok: false, error: "Unknown order." };

  const parsed = confirmSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid payment confirmation." };
  const p = parsed.data;

  if (bikriupEnabled()) return confirmBikriupPayment(token, p);

  const row = await db.query.order.findFirst({
    where: eq(order.lookupToken, token),
    columns: { id: true, paymentProvider: true, paymentStatus: true },
  });

  if (!row) return { ok: false, error: "Unknown order." };
  if (row.paymentProvider !== "razorpay") {
    return { ok: false, error: "This order is not paid online." };
  }

  const txn = await db.query.paymentTransaction.findFirst({
    where: and(
      eq(paymentTransaction.orderId, row.id),
      eq(paymentTransaction.providerOrderId, p.gatewayOrderId),
    ),
    columns: { id: true, status: true, amountPaise: true },
  });

  if (!txn) return { ok: false, error: "Unknown payment attempt." };

  // Already settled — by the webhook racing ahead, or a double-submit. Fine.
  if (txn.status === "captured" || row.paymentStatus === "paid") {
    return { ok: true, paid: true };
  }

  if (
    !verifyPaymentSignature({
      gatewayOrderId: p.gatewayOrderId,
      gatewayPaymentId: p.gatewayPaymentId,
      signature: p.signature,
    })
  ) {
    return { ok: false, error: "Payment verification failed." };
  }

  let payment;
  try {
    payment = await fetchGatewayPayment(p.gatewayPaymentId);
  } catch (error) {
    console.error("[razorpay] payment fetch failed:", error);
    return {
      ok: false,
      error:
        "Could not verify the payment right now. If you were charged, it will be confirmed shortly.",
    };
  }

  if (
    payment.order_id !== p.gatewayOrderId ||
    payment.amount !== txn.amountPaise ||
    (payment.status !== "captured" && payment.status !== "authorized")
  ) {
    return { ok: false, error: "Payment verification failed." };
  }

  const now = new Date();

  // Both WHERE clauses re-check state so the webhook and this handler cannot
  // both write — whichever lands second matches nothing.
  await db.batch([
    db
      .update(paymentTransaction)
      .set({
        status: "captured",
        providerPaymentId: payment.id,
        method: payment.method ?? null,
        methodDetail: describePaymentMethod(payment),
        confirmedVia: "handler",
        rawPayload: payment,
        updatedAt: now,
      })
      // `failed` is included because the modal lets the customer retry a
      // declined attempt against the same gateway order.
      .where(
        and(
          eq(paymentTransaction.id, txn.id),
          inArray(paymentTransaction.status, ["created", "failed"]),
        ),
      ),
    db
      .update(order)
      .set({ paymentStatus: "paid", status: "confirmed", paymentRef: payment.id, updatedAt: now })
      .where(and(eq(order.id, row.id), eq(order.paymentStatus, "unpaid"))),
    db.insert(orderEvent).values({
      orderId: row.id,
      status: "confirmed",
      note: `Payment received via Razorpay (${payment.method ?? "online"}).`,
    }),
  ]);

  return { ok: true, paid: true };
}

async function confirmBikriupPayment(token: string, p: z.infer<typeof confirmSchema>): Promise<SettleResult> {
  const ref = readOrderToken(token);
  if (!ref) return { ok: false, error: "Unknown order." };
  if (
    !verifyPaymentSignature({
      gatewayOrderId: p.gatewayOrderId,
      gatewayPaymentId: p.gatewayPaymentId,
      signature: p.signature,
    })
  ) {
    return { ok: false, error: "Payment verification failed." };
  }
  try {
    const out = await settleBikriupPayment({ ...p, orderNo: ref.orderNo });
    return out.ok ? { ok: true, paid: true } : out;
  } catch (error) {
    console.error("[razorpay] payment settle failed:", error);
    return {
      ok: false,
      error: "Could not verify the payment right now. If you were charged, it will be confirmed shortly.",
    };
  }
}

/**
 * Records a failed or abandoned attempt reported by the checkout modal. Purely
 * bookkeeping — the order itself stays unpaid and payable, and nothing here
 * can move money or settle anything, so the lookup token is authority enough.
 */
export async function reportRazorpayFailure(
  token: string,
  gatewayOrderId: string,
  reason: { code?: string; description?: string },
): Promise<void> {
  if (!token || token.length > 200) return;
  if (!gatewayOrderId || gatewayOrderId.length > 100) return;

  // With Bikriup the order simply stays unpaid and payable; the failure shows in its log.
  if (bikriupEnabled()) {
    const ref = readOrderToken(token);
    if (ref) console.warn(`[razorpay] payment failed for ${ref.orderNo}: ${reason.code ?? ""} ${reason.description ?? ""}`);
    return;
  }

  const row = await db.query.order.findFirst({
    where: eq(order.lookupToken, token),
    columns: { id: true },
  });
  if (!row) return;

  await db
    .update(paymentTransaction)
    .set({
      status: "failed",
      errorCode: reason.code?.slice(0, 100) ?? null,
      errorDescription: reason.description?.slice(0, 500) ?? null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(paymentTransaction.orderId, row.id),
        eq(paymentTransaction.providerOrderId, gatewayOrderId),
        // Only an open attempt can fail; a captured one is never downgraded
        // on the browser's word.
        eq(paymentTransaction.status, "created"),
      ),
    );
}
