import { bikriup, BikriupError } from "./bikriup";
import { fetchGatewayOrder, fetchGatewayPayment } from "./razorpay";

/**
 * Marks a Bikriup order paid after a Razorpay payment — from the checkout
 * modal's callback or from Razorpay's webhook, whichever lands first; the
 * second is a harmless repeat.
 *
 * Nothing from the browser is trusted on its own: the payment and its gateway
 * order are re-read from Razorpay, the gateway order's receipt must be this
 * order's number, and Bikriup itself refuses an amount that is not the total.
 */
export async function settleBikriupPayment(params: {
  gatewayOrderId: string;
  gatewayPaymentId: string;
  /** From a signed order link; the webhook has none and relies on the receipt. */
  orderNo?: string;
}): Promise<{ ok: true; orderNo: string } | { ok: false; error: string }> {
  const [payment, gw] = await Promise.all([
    fetchGatewayPayment(params.gatewayPaymentId),
    fetchGatewayOrder(params.gatewayOrderId),
  ]);
  const orderNo = gw.receipt ?? "";
  if (
    !orderNo ||
    (params.orderNo && params.orderNo !== orderNo) ||
    payment.order_id !== gw.id ||
    payment.amount !== gw.amount ||
    (payment.status !== "captured" && payment.status !== "authorized")
  ) {
    return { ok: false, error: "Payment verification failed." };
  }
  try {
    await bikriup(`/orders/${encodeURIComponent(orderNo)}/payment`, {
      method: "POST",
      body: { status: "paid", provider: "razorpay", ref: payment.id, amount: gw.amount / 100 },
    });
  } catch (error) {
    if (error instanceof BikriupError && error.status < 500) return { ok: false, error: error.message };
    throw error;
  }
  return { ok: true, orderNo };
}
