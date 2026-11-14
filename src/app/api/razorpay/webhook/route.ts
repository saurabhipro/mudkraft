import { and, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

import { bikriupEnabled } from "@/server/bikriup";
import {
  reportBikriupPaymentFailed,
  reportBikriupRefund,
  settleBikriupPayment,
} from "@/server/bikriup-payments";
import { db } from "@/server/db";
import { order, orderEvent, paymentTransaction } from "@/server/db/schema/orders";
import { sendAdminAlert } from "@/server/email/send";
import type { GatewayPayment, RefundEntity } from "@/server/razorpay";
import { describePaymentMethod, verifyWebhookSignature } from "@/server/razorpay";
import { describeError } from "@/server/redact";
import { claimWebhookEvent, releaseWebhookEvent } from "@/server/webhook-events";

/**
 * Razorpay webhook receiver — the settlement path that does not depend on the
 * customer's browser surviving to run the modal callback (closed tab, flaky
 * network, QR/UPI flows). Register these events for this URL in the dashboard
 * and set RAZORPAY_WEBHOOK_SECRET:
 *
 *   payment.captured  — mark the order paid (or refund a duplicate payment)
 *   payment.failed    — record the failed attempt; the order stays payable
 *   refund.processed  — mark the order refunded when its own payment went back
 *   refund.failed     — alert the studio: money that should go back did not
 *
 * Every delivery is deduplicated on `x-razorpay-event-id`, and every step
 * behind it is idempotent as well, because the browser handler races this
 * endpoint and Razorpay may deliver an event more than once.
 *
 * Status codes: 401 bad signature, 400 unreadable body, 500 only when a retry
 * can help (Bikriup or Razorpay unreachable), 200 for everything decided —
 * including events that are ignored or need a person, which are alerted.
 */

const HANDLED = new Set([
  "payment.captured",
  "payment.failed",
  "refund.processed",
  "refund.failed",
]);

interface WebhookBody {
  event?: string;
  payload?: {
    payment?: { entity?: GatewayPayment };
    refund?: { entity?: RefundEntity };
  };
}

const ok = (extra: Record<string, unknown> = {}) => NextResponse.json({ received: true, ...extra });

export async function POST(request: Request) {
  // Signature is computed over the exact raw bytes; parse only after verifying.
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!signature || !verifyWebhookSignature(rawBody, signature)) {
    // Covers a missing/invalid signature and an unset RAZORPAY_WEBHOOK_SECRET
    // alike — without the secret no delivery can be authenticated.
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let body: WebhookBody;
  try {
    body = JSON.parse(rawBody) as WebhookBody;
  } catch {
    return NextResponse.json({ error: "malformed body" }, { status: 400 });
  }

  const event = body.event ?? "";
  if (!HANDLED.has(event)) return ok();

  const eventId = request.headers.get("x-razorpay-event-id");
  const claimKey = eventId ? `razorpay:${eventId.slice(0, 100)}` : null;
  if (claimKey) {
    try {
      if (!(await claimWebhookEvent(claimKey, event))) return ok({ duplicate: true });
    } catch (error) {
      // Dedupe is a shortcut, not the safety net: every step below is idempotent,
      // so a database hiccup here must not stop a payment from settling.
      console.warn(`[razorpay] webhook dedupe unavailable: ${describeError(error)}`);
    }
  }

  try {
    return bikriupEnabled() ? await handleBikriup(event, body) : await handleLocal(event, body);
  } catch (error) {
    console.error(`[razorpay] webhook ${event} ${eventId ?? ""} failed: ${describeError(error)}`);
    // Release the claim so Razorpay's retry is processed rather than skipped.
    if (claimKey) await releaseWebhookEvent(claimKey).catch(() => undefined);
    return NextResponse.json({ error: "retry" }, { status: 500 });
  }
}

/* ---------- Orders in Bikriup (production) ---------- */

async function handleBikriup(event: string, body: WebhookBody): Promise<NextResponse> {
  const payment = body.payload?.payment?.entity;

  if (event === "payment.captured") {
    if (!payment?.order_id) return ok();
    const out = await settleBikriupPayment({
      gatewayOrderId: payment.order_id,
      gatewayPaymentId: payment.id,
    });
    if (out.ok) return ok();
    if (out.reason === "amount_mismatch" || out.reason === "verification") {
      console.error(
        `[razorpay] webhook could not settle ${payment.id} (${payment.order_id}): ${out.reason}`,
      );
      await sendAdminAlert(`Payment needs checking: ${payment.id}`, [
        `Razorpay captured payment ${payment.id} (gateway order ${payment.order_id}, ₹${(payment.amount / 100).toFixed(2)}), but it was not marked paid: ${out.reason.replace("_", " ")}.`,
        "Compare the gateway order amount with the Bikriup order total, then record or refund the payment by hand. See docs/razorpay-runbook.md.",
      ]);
    } else if (out.reason !== "not_ours") {
      console.warn(`[razorpay] webhook did not settle ${payment.id}: ${out.reason} — ${out.error}`);
    }
    return ok();
  }

  if (event === "payment.failed") {
    if (!payment?.order_id) return ok();
    const answer = await reportBikriupPaymentFailed(payment);
    if (answer?.ignored)
      console.info(`[razorpay] failed ${payment.id} not recorded: ${answer.ignored}`);
    return ok();
  }

  const refund = body.payload?.refund?.entity;
  if (!refund) return ok();

  if (event === "refund.processed") {
    if (!payment?.order_id) return ok();
    const answer = await reportBikriupRefund(refund, payment);
    if (answer?.ignored)
      console.info(`[razorpay] refund ${refund.id} on ${refund.payment_id}: ${answer.ignored}`);
    return ok();
  }

  // refund.failed: the money did not go back, and nobody would otherwise know.
  console.error(`[razorpay] refund ${refund.id} on ${refund.payment_id} failed`);
  await sendAdminAlert(`Refund failed: ${refund.id}`, [
    `Razorpay could not complete refund ${refund.id} of ₹${(Number(refund.amount) / 100).toFixed(2)} on payment ${refund.payment_id}.`,
    "Retry it from the Razorpay dashboard (Transactions › Refunds) or pay the customer back another way.",
  ]);
  return ok();
}

/* ---------- Orders in the site's own database (fallback, unchanged) ---------- */

async function handleLocal(event: string, body: WebhookBody): Promise<NextResponse> {
  const payment = body.payload?.payment?.entity;
  if ((event !== "payment.captured" && event !== "payment.failed") || !payment?.order_id)
    return ok();

  const txn = await db.query.paymentTransaction.findFirst({
    where: eq(paymentTransaction.providerOrderId, payment.order_id),
    columns: { id: true, orderId: true, status: true, amountPaise: true },
  });

  // Not ours (another integration on the same account) or long gone. Ack it —
  // retrying will never make it match.
  if (!txn) return ok();

  const now = new Date();

  if (event === "payment.captured") {
    if (txn.status === "captured") return ok();

    // The signature proves Razorpay sent this, but the amount is still checked
    // against our own row before the order is marked paid.
    if (Number(payment.amount) !== txn.amountPaise) {
      console.error(
        `[razorpay] webhook amount mismatch for ${payment.order_id}: got ${payment.amount}, expected ${txn.amountPaise}`,
      );
      return ok();
    }

    await db.batch([
      db
        .update(paymentTransaction)
        .set({
          status: "captured",
          providerPaymentId: payment.id,
          method: payment.method ?? null,
          methodDetail: describePaymentMethod(payment),
          errorCode: null,
          errorDescription: null,
          confirmedVia: "webhook",
          rawPayload: payment,
          updatedAt: now,
        })
        // `failed` is included because the modal lets the customer retry a
        // declined attempt against the same gateway order — the failure event
        // may already have landed before the successful capture does.
        .where(
          and(
            eq(paymentTransaction.id, txn.id),
            inArray(paymentTransaction.status, ["created", "failed"]),
          ),
        ),
      db
        .update(order)
        .set({ paymentStatus: "paid", status: "confirmed", paymentRef: payment.id, updatedAt: now })
        .where(and(eq(order.id, txn.orderId), eq(order.paymentStatus, "unpaid"))),
      db.insert(orderEvent).values({
        orderId: txn.orderId,
        status: "confirmed",
        note: `Payment received via Razorpay (${payment.method ?? "online"}).`,
      }),
    ]);

    return ok();
  }

  // payment.failed — bookkeeping only; the order stays unpaid and payable.
  await db
    .update(paymentTransaction)
    .set({
      status: "failed",
      providerPaymentId: payment.id,
      method: payment.method ?? null,
      errorCode: payment.error_code ?? null,
      errorDescription: payment.error_description?.slice(0, 500) ?? null,
      rawPayload: payment,
      updatedAt: now,
    })
    .where(and(eq(paymentTransaction.id, txn.id), eq(paymentTransaction.status, "created")));

  return ok();
}
