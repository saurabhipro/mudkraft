import { bikriup, BikriupError } from "./bikriup";
import {
  capturePayment,
  fetchGatewayOrder,
  fetchGatewayPayment,
  isFullyRefundedError,
  refundPayment,
  type GatewayPayment,
  type RefundEntity,
} from "./razorpay";

/**
 * Razorpay ↔ Bikriup: everything that moves an order's payment state when the
 * orders live in the back office. Called from the checkout modal's callback
 * and from Razorpay's webhook, which race freely; every step is safe to repeat.
 *
 * Nothing from the browser is trusted on its own: payments and gateway orders
 * are re-read from Razorpay, the gateway order's receipt must be this order's
 * number, and Bikriup refuses an amount that is not the order total and a
 * second payment on an order that is already paid.
 */

type PaymentReport =
  | { status: "paid"; provider: "razorpay"; ref: string; amount: number }
  | { status: "failed"; provider: "razorpay"; ref: string }
  | { status: "refunded"; provider: "razorpay"; ref: string; refund_ref: string; amount: number };

/** Bikriup answers with the order plus what it did: `recorded` a change, or `ignored` it and why. */
interface PaymentAnswer {
  recorded?: string;
  ignored?: string;
}

function reportPayment(orderNo: string, body: PaymentReport): Promise<PaymentAnswer> {
  return bikriup<PaymentAnswer>(`/orders/${encodeURIComponent(orderNo)}/payment`, {
    method: "POST",
    body,
  });
}

export type SettleOutcome =
  | { ok: true; orderNo: string; duplicateRefunded?: { paymentId: string; refundId: string } }
  | {
      ok: false;
      error: string;
      /**
       * not_ours — the gateway order has no receipt: another integration on the same account.
       * verification — the payment does not belong to this order (tampering or a bug).
       * amount_mismatch — money arrived that is not the order total; a person must look.
       * not_captured — the payment failed or was already given back.
       * bikriup_rejected — Bikriup refused for another reason (unknown order, …).
       */
      reason: "not_ours" | "verification" | "amount_mismatch" | "not_captured" | "bikriup_rejected";
    };

const CHECK_BY_HAND =
  "We received your payment but need to check it by hand. The studio will contact you shortly — there is no need to pay again.";

/**
 * Marks a Bikriup order paid after a Razorpay payment. An authorized payment is
 * captured first: only captured money counts. A second payment on an order
 * that is already paid is refunded straight away.
 */
export async function settleBikriupPayment(params: {
  gatewayOrderId: string;
  gatewayPaymentId: string;
  /** From a signed order link; the webhook has none and relies on the receipt. */
  orderNo?: string;
}): Promise<SettleOutcome> {
  const [fetched, gw] = await Promise.all([
    fetchGatewayPayment(params.gatewayPaymentId),
    fetchGatewayOrder(params.gatewayOrderId),
  ]);
  let payment = fetched;
  const orderNo = gw.receipt ?? "";

  if (!orderNo) return { ok: false, error: "Payment verification failed.", reason: "not_ours" };
  if ((params.orderNo && params.orderNo !== orderNo) || payment.order_id !== gw.id) {
    return { ok: false, error: "Payment verification failed.", reason: "verification" };
  }
  if (payment.amount !== gw.amount) {
    return { ok: false, error: CHECK_BY_HAND, reason: "amount_mismatch" };
  }

  if (payment.status === "authorized") payment = await capturePayment(payment.id, payment.amount);
  if (payment.status !== "captured") {
    return {
      ok: false,
      error:
        payment.status === "refunded"
          ? "This payment has been refunded."
          : "The payment did not go through. Nothing has been charged — you can try again.",
      reason: "not_captured",
    };
  }

  try {
    await reportPayment(orderNo, {
      status: "paid",
      provider: "razorpay",
      ref: payment.id,
      amount: gw.amount / 100,
    });
    return { ok: true, orderNo };
  } catch (error) {
    if (!(error instanceof BikriupError) || error.status >= 500) throw error;
    if (error.code === "already_paid") {
      const originalRef = typeof error.body.payment_ref === "string" ? error.body.payment_ref : "";
      if (originalRef === payment.id) return { ok: true, orderNo };
      return refundDuplicate(payment, orderNo, originalRef);
    }
    if (error.code === "amount_mismatch")
      return { ok: false, error: CHECK_BY_HAND, reason: "amount_mismatch" };
    return { ok: false, error: error.message, reason: "bikriup_rejected" };
  }
}

/**
 * The order was already paid by another payment (two tabs, a retry while the
 * first was still confirming). This one is given back in full. A refund that
 * Razorpay says was already made — the handler and webhook both got here —
 * counts as done. Any other refund failure is thrown, so the webhook is retried.
 */
async function refundDuplicate(
  payment: GatewayPayment,
  orderNo: string,
  originalRef: string,
): Promise<SettleOutcome> {
  const fresh = await fetchGatewayPayment(payment.id);
  const left = fresh.amount - (fresh.amount_refunded ?? 0);
  let refundId = "";
  if (left > 0) {
    try {
      const refund = await refundPayment(payment.id, {
        amountPaise: left,
        notes: { reason: "duplicate", order_no: orderNo, original_ref: originalRef },
      });
      refundId = refund.id;
    } catch (error) {
      if (!isFullyRefundedError(error)) throw error;
    }
  }
  // Audit line: ids and amounts only.
  console.warn(
    `[razorpay] audit: duplicate payment ${payment.id} on ${orderNo} (already paid by ${originalRef || "?"}); ` +
      (refundId ? `refunded ${left} paise as ${refundId}` : "already refunded"),
  );
  return { ok: true, orderNo, duplicateRefunded: { paymentId: payment.id, refundId } };
}

/** Remembers the Razorpay order opened for a Bikriup order, so the next Pay click reuses it. */
export async function setBikriupGatewayOrder(
  orderNo: string,
  params: { id: string; amountRupees: number },
): Promise<void> {
  await bikriup(`/orders/${encodeURIComponent(orderNo)}/gateway-order`, {
    method: "PUT",
    body: { provider: "razorpay", id: params.id, amount: params.amountRupees },
  });
}

/**
 * A failed attempt: staff see it on the order and the customer gets the
 * "payment didn't go through" WhatsApp with a Pay-now link. Bikriup ignores it
 * when the order is already paid. Returns null for a gateway order that is not
 * one of the shop's (no receipt).
 */
export async function reportBikriupPaymentFailed(
  payment: GatewayPayment,
): Promise<PaymentAnswer | null> {
  const gw = await fetchGatewayOrder(payment.order_id);
  if (!gw.receipt) return null;
  try {
    return await reportPayment(gw.receipt, {
      status: "failed",
      provider: "razorpay",
      ref: payment.id,
    });
  } catch (error) {
    if (error instanceof BikriupError && error.status < 500)
      return { ignored: `bikriup_${error.status}` };
    throw error;
  }
}

/**
 * A refund Razorpay has paid out. Bikriup marks the order refunded only when it
 * is the order's own payment and the total refunded covers the order; the
 * refund of a duplicate payment comes back as ignored.
 */
export async function reportBikriupRefund(
  refund: RefundEntity,
  payment: GatewayPayment,
): Promise<PaymentAnswer | null> {
  const gw = await fetchGatewayOrder(payment.order_id);
  if (!gw.receipt) return null;
  try {
    return await reportPayment(gw.receipt, {
      status: "refunded",
      provider: "razorpay",
      ref: refund.payment_id,
      refund_ref: refund.id,
      // Cumulative, so several partial refunds that add up to the total close the order.
      amount: Number(payment.amount_refunded ?? refund.amount) / 100,
    });
  } catch (error) {
    if (error instanceof BikriupError && error.status < 500)
      return { ignored: `bikriup_${error.status}` };
    throw error;
  }
}
