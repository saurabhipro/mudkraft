import { createHmac, timingSafeEqual } from "node:crypto";

import Razorpay from "razorpay";

import { serverEnv } from "./env";

/**
 * Thin wrapper around the Razorpay SDK. Everything here is server-only; the
 * only value that may ever reach the browser is the public key id, and it is
 * handed out per-page rather than through a NEXT_PUBLIC var.
 *
 * Configuration is optional, like SMTP: without keys the app boots and callers
 * are expected to check `razorpayConfigured()` and degrade gracefully.
 */

export function razorpayConfigured(): boolean {
  return Boolean(serverEnv.RAZORPAY_KEY_ID && serverEnv.RAZORPAY_KEY_SECRET);
}

export function razorpayKeyId(): string {
  if (!serverEnv.RAZORPAY_KEY_ID) throw new Error("Razorpay is not configured");
  return serverEnv.RAZORPAY_KEY_ID;
}

let client: Razorpay | null = null;

function getClient(): Razorpay {
  if (!serverEnv.RAZORPAY_KEY_ID || !serverEnv.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay is not configured");
  }
  client ??= new Razorpay({
    key_id: serverEnv.RAZORPAY_KEY_ID,
    key_secret: serverEnv.RAZORPAY_KEY_SECRET,
  });
  return client;
}

/**
 * Creates the gateway-side order the checkout modal is opened against.
 * Razorpay amounts are already in paise, the same unit the whole app uses.
 */
export async function createGatewayOrder(params: {
  amountPaise: number;
  receipt: string;
  notes: Record<string, string>;
}): Promise<{ id: string }> {
  const gatewayOrder = await getClient().orders.create({
    amount: params.amountPaise,
    currency: "INR",
    receipt: params.receipt,
    notes: params.notes,
  });
  return { id: gatewayOrder.id };
}

/**
 * The gateway order a payment belongs to. Its `receipt` is the shop's order
 * number, which ties a payment to exactly one order when Bikriup holds them.
 */
export interface GatewayOrder {
  id: string;
  amount: number;
  receipt: string | null;
  /** `created` (no attempt yet), `attempted` (tried, not paid) or `paid`. */
  status: string;
}

export async function fetchGatewayOrder(gatewayOrderId: string): Promise<GatewayOrder> {
  const o = await getClient().orders.fetch(gatewayOrderId);
  return {
    id: o.id,
    amount: Number(o.amount),
    receipt: o.receipt ?? null,
    status: String(o.status),
  };
}

/** The subset of Razorpay's payment entity the app actually reads. */
export interface GatewayPayment {
  id: string;
  order_id: string;
  status: string;
  amount: number;
  currency: string;
  method?: string;
  vpa?: string | null;
  card?: { network?: string; last4?: string } | null;
  bank?: string | null;
  wallet?: string | null;
  error_code?: string | null;
  error_description?: string | null;
  /** Paise refunded so far against this payment. */
  amount_refunded?: number;
  [key: string]: unknown;
}

/** The subset of Razorpay's refund entity the app reads (webhook `refund.*` events). */
export interface RefundEntity {
  id: string;
  payment_id: string;
  amount: number;
  status: string;
  notes?: Record<string, string> | unknown[];
}

/** Error shape the Razorpay SDK rejects with. */
export interface RazorpayApiError {
  statusCode: string | number;
  error: { code: string; description: string; reason?: string };
}

export function isRazorpayError(err: unknown): err is RazorpayApiError {
  return (
    typeof err === "object" &&
    err !== null &&
    "statusCode" in err &&
    typeof (err as { error?: unknown }).error === "object" &&
    (err as { error?: unknown }).error !== null
  );
}

function normalisePayment(payment: unknown): GatewayPayment {
  const p = payment as GatewayPayment;
  // The SDK types amounts as number | string; normalise once here.
  return { ...p, amount: Number(p.amount), amount_refunded: Number(p.amount_refunded ?? 0) };
}

export async function fetchGatewayPayment(paymentId: string): Promise<GatewayPayment> {
  return normalisePayment(await getClient().payments.fetch(paymentId));
}

/**
 * Captures an authorized payment. Only a captured payment has reached the
 * shop; an authorized one is a hold that the bank releases if nobody captures
 * it. Dashboard auto-capture normally does this first, so "already captured"
 * is an expected answer and returns the payment as it now stands.
 */
export async function capturePayment(
  paymentId: string,
  amountPaise: number,
): Promise<GatewayPayment> {
  try {
    return normalisePayment(await getClient().payments.capture(paymentId, amountPaise, "INR"));
  } catch (error) {
    if (
      isRazorpayError(error) &&
      /already\s+(been\s+)?captured/i.test(error.error.description ?? "")
    ) {
      return fetchGatewayPayment(paymentId);
    }
    throw error;
  }
}

/**
 * Refunds a payment in full or in part (normal speed: 5–7 working days, no
 * extra fee). The notes travel with the refund and show in the dashboard.
 */
export async function refundPayment(
  paymentId: string,
  params: { amountPaise: number; notes: Record<string, string> },
): Promise<{ id: string; status: string }> {
  const refund = await getClient().payments.refund(paymentId, {
    amount: params.amountPaise,
    speed: "normal",
    notes: params.notes,
  });
  return { id: refund.id, status: String(refund.status) };
}

/** True when Razorpay refused a refund because the payment has none left to give back. */
export function isFullyRefundedError(err: unknown): boolean {
  return (
    isRazorpayError(err) &&
    err.error.code === "BAD_REQUEST_ERROR" &&
    /fully refunded|already been refunded|refund amount.*(greater|exceed)/i.test(
      err.error.description ?? "",
    )
  );
}

/** Masked, support-friendly description of how a payment was made. */
export function describePaymentMethod(payment: GatewayPayment): string | null {
  switch (payment.method) {
    case "upi":
      return payment.vpa ?? "upi";
    case "card":
      return [payment.card?.network, payment.card?.last4 && `•••• ${payment.card.last4}`]
        .filter(Boolean)
        .join(" ") || "card";
    case "netbanking":
      return payment.bank ?? "netbanking";
    case "wallet":
      return payment.wallet ?? "wallet";
    default:
      return payment.method ?? null;
  }
}

function safeEqualHex(expectedHex: string, providedHex: string): boolean {
  const expected = Buffer.from(expectedHex, "hex");
  const provided = Buffer.from(providedHex, "hex");
  return expected.length === provided.length && timingSafeEqual(expected, provided);
}

/**
 * Verifies the signature the checkout modal hands back after a payment:
 * HMAC-SHA256 of `order_id|payment_id` keyed with the API secret. This is the
 * proof that Razorpay — not the browser — asserts the payment happened.
 */
export function verifyPaymentSignature(params: {
  gatewayOrderId: string;
  gatewayPaymentId: string;
  signature: string;
}): boolean {
  if (!serverEnv.RAZORPAY_KEY_SECRET) return false;
  if (!/^[0-9a-f]+$/i.test(params.signature)) return false;
  const expected = createHmac("sha256", serverEnv.RAZORPAY_KEY_SECRET)
    .update(`${params.gatewayOrderId}|${params.gatewayPaymentId}`)
    .digest("hex");
  return safeEqualHex(expected, params.signature);
}

/** Verifies `x-razorpay-signature` on a webhook delivery against the raw body. */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  if (!serverEnv.RAZORPAY_WEBHOOK_SECRET) return false;
  if (!/^[0-9a-f]+$/i.test(signature)) return false;
  const expected = createHmac("sha256", serverEnv.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");
  return safeEqualHex(expected, signature);
}
