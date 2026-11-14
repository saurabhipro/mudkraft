import { createHmac } from "node:crypto";

import { describe, expect, it, vi } from "vitest";

import {
  isFullyRefundedError,
  isRazorpayError,
  verifyPaymentSignature,
  verifyWebhookSignature,
} from "./razorpay";

const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!;
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET!;
const hmac = (secret: string, data: string) =>
  createHmac("sha256", secret).update(data).digest("hex");

describe("verifyPaymentSignature", () => {
  const ids = { gatewayOrderId: "order_ABC", gatewayPaymentId: "pay_XYZ" };
  const good = hmac(KEY_SECRET, "order_ABC|pay_XYZ");

  it("accepts Razorpay's signature over order_id|payment_id", () => {
    expect(verifyPaymentSignature({ ...ids, signature: good })).toBe(true);
  });

  it("rejects a signature for another payment", () => {
    expect(verifyPaymentSignature({ ...ids, gatewayPaymentId: "pay_OTHER", signature: good })).toBe(
      false,
    );
  });

  it("rejects a signature made with another secret", () => {
    expect(
      verifyPaymentSignature({ ...ids, signature: hmac("not-the-secret", "order_ABC|pay_XYZ") }),
    ).toBe(false);
  });

  it("rejects non-hex and truncated input without throwing", () => {
    expect(verifyPaymentSignature({ ...ids, signature: "zz-not-hex" })).toBe(false);
    expect(verifyPaymentSignature({ ...ids, signature: good.slice(0, 20) })).toBe(false);
    expect(verifyPaymentSignature({ ...ids, signature: "" })).toBe(false);
  });
});

describe("verifyWebhookSignature", () => {
  const body = JSON.stringify({ event: "payment.captured", payload: {} });

  it("accepts an HMAC of the exact raw body", () => {
    expect(verifyWebhookSignature(body, hmac(WEBHOOK_SECRET, body))).toBe(true);
  });

  it("rejects a body changed after signing, even by whitespace", () => {
    expect(verifyWebhookSignature(`${body} `, hmac(WEBHOOK_SECRET, body))).toBe(false);
  });

  it("does not accept the API key secret in place of the webhook secret", () => {
    expect(verifyWebhookSignature(body, hmac(KEY_SECRET, body))).toBe(false);
  });
});

describe("without secrets configured", () => {
  it("authenticates nothing", async () => {
    vi.resetModules();
    vi.doMock("./env", () => ({ serverEnv: {} }));
    const mod = await import("./razorpay");
    const body = "{}";
    expect(mod.verifyWebhookSignature(body, hmac("", body))).toBe(false);
    expect(
      mod.verifyPaymentSignature({
        gatewayOrderId: "o",
        gatewayPaymentId: "p",
        signature: hmac("", "o|p"),
      }),
    ).toBe(false);
    vi.doUnmock("./env");
  });
});

describe("Razorpay error helpers", () => {
  const apiError = (description: string, code = "BAD_REQUEST_ERROR") => ({
    statusCode: 400,
    error: { code, description },
  });

  it("recognises SDK errors only", () => {
    expect(isRazorpayError(apiError("x"))).toBe(true);
    expect(isRazorpayError(new Error("x"))).toBe(false);
    expect(isRazorpayError(null)).toBe(false);
  });

  it("treats an already-refunded payment as done", () => {
    expect(isFullyRefundedError(apiError("The payment has been fully refunded already"))).toBe(
      true,
    );
    expect(
      isFullyRefundedError(apiError("The refund amount provided is greater than amount captured")),
    ).toBe(true);
    expect(isFullyRefundedError(apiError("Server is down", "SERVER_ERROR"))).toBe(false);
  });
});
