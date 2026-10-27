import { and, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

import { bikriupEnabled } from "@/server/bikriup";
import { settleBikriupPayment } from "@/server/bikriup-payments";
import { db } from "@/server/db";
import { order, orderEvent, paymentTransaction } from "@/server/db/schema/orders";
import type { GatewayPayment } from "@/server/razorpay";
import { describePaymentMethod, verifyWebhookSignature } from "@/server/razorpay";

/**
 * Razorpay webhook receiver — the settlement path that does not depend on the
 * customer's browser surviving to run the modal callback (closed tab, flaky
 * network, QR/UPI flows). Register `payment.captured` and `payment.failed`
 * for this URL in the dashboard and set RAZORPAY_WEBHOOK_SECRET.
 *
 * Everything is idempotent: the browser handler and this endpoint race freely,
 * and whichever lands second matches nothing in the guarded WHERE clauses.
 * Responses are 200 even for events we ignore — anything else makes Razorpay
 * retry a delivery we have already decided about.
 */

interface WebhookBody {
  event?: string;
  payload?: { payment?: { entity?: GatewayPayment } };
}

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

  const event = body.event;
  const payment = body.payload?.payment?.entity;

  if ((event !== "payment.captured" && event !== "payment.failed") || !payment?.order_id) {
    return NextResponse.json({ received: true });
  }

  // Orders live in Bikriup: a captured payment marks its order paid there. A failure
  // needs nothing — the order stays unpaid and payable.
  if (bikriupEnabled()) {
    if (event === "payment.captured") {
      try {
        const out = await settleBikriupPayment({ gatewayOrderId: payment.order_id, gatewayPaymentId: payment.id });
        if (!out.ok) console.warn(`[razorpay] webhook not settled: ${out.error}`);
      } catch (error) {
        console.error("[razorpay] webhook settle failed:", error);
        // 500 makes Razorpay retry later, when Bikriup is reachable again.
        return NextResponse.json({ error: "retry" }, { status: 500 });
      }
    }
    return NextResponse.json({ received: true });
  }

  const txn = await db.query.paymentTransaction.findFirst({
    where: eq(paymentTransaction.providerOrderId, payment.order_id),
    columns: { id: true, orderId: true, status: true, amountPaise: true },
  });

  // Not ours (another integration on the same account) or long gone. Ack it —
  // retrying will never make it match.
  if (!txn) return NextResponse.json({ received: true });

  const now = new Date();

  if (event === "payment.captured") {
    if (txn.status === "captured") return NextResponse.json({ received: true });

    // The signature proves Razorpay sent this, but the amount is still checked
    // against our own row before the order is marked paid.
    if (Number(payment.amount) !== txn.amountPaise) {
      console.error(
        `[razorpay] webhook amount mismatch for ${payment.order_id}: got ${payment.amount}, expected ${txn.amountPaise}`,
      );
      return NextResponse.json({ received: true });
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

    return NextResponse.json({ received: true });
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

  return NextResponse.json({ received: true });
}
