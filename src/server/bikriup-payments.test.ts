import { beforeEach, describe, expect, it, vi } from "vitest";

import { BikriupError } from "./bikriup";

const rzp = vi.hoisted(() => ({
  fetchGatewayPayment: vi.fn(),
  fetchGatewayOrder: vi.fn(),
  capturePayment: vi.fn(),
  refundPayment: vi.fn(),
}));
const api = vi.hoisted(() => ({ bikriup: vi.fn() }));

vi.mock("./razorpay", async (importOriginal) => ({ ...(await importOriginal<object>()), ...rzp }));
vi.mock("./bikriup", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  bikriup: api.bikriup,
}));

const { settleBikriupPayment, reportBikriupPaymentFailed, reportBikriupRefund } =
  await import("./bikriup-payments");

const ORDER = "MK-1042";
const gw = { id: "order_1", amount: 149900, receipt: ORDER, status: "paid" };
const payment = (over: Record<string, unknown> = {}) => ({
  id: "pay_A",
  order_id: "order_1",
  status: "captured",
  amount: 149900,
  amount_refunded: 0,
  currency: "INR",
  ...over,
});
const settle = (orderNo?: string) =>
  settleBikriupPayment({ gatewayOrderId: "order_1", gatewayPaymentId: "pay_A", orderNo });

beforeEach(() => {
  rzp.fetchGatewayOrder.mockResolvedValue(gw);
  rzp.fetchGatewayPayment.mockResolvedValue(payment());
  api.bikriup.mockResolvedValue({ recorded: "paid" });
});

describe("settleBikriupPayment", () => {
  it("reports a captured payment to Bikriup as paid, in rupees", async () => {
    await expect(settle(ORDER)).resolves.toEqual({ ok: true, orderNo: ORDER });
    expect(api.bikriup).toHaveBeenCalledWith(`/orders/${ORDER}/payment`, {
      method: "POST",
      body: { status: "paid", provider: "razorpay", ref: "pay_A", amount: 1499 },
    });
    expect(rzp.capturePayment).not.toHaveBeenCalled();
  });

  it("captures an authorized payment before it counts", async () => {
    rzp.fetchGatewayPayment.mockResolvedValue(payment({ status: "authorized" }));
    rzp.capturePayment.mockResolvedValue(payment({ status: "captured" }));
    await expect(settle(ORDER)).resolves.toMatchObject({ ok: true });
    expect(rzp.capturePayment).toHaveBeenCalledWith("pay_A", 149900);
  });

  it("never marks paid on a payment that is not captured", async () => {
    rzp.fetchGatewayPayment.mockResolvedValue(payment({ status: "failed" }));
    await expect(settle(ORDER)).resolves.toMatchObject({ ok: false, reason: "not_captured" });
    expect(api.bikriup).not.toHaveBeenCalled();
  });

  it("refuses a payment made for another order", async () => {
    await expect(settle("MK-9999")).resolves.toMatchObject({ ok: false, reason: "verification" });
    rzp.fetchGatewayPayment.mockResolvedValue(payment({ order_id: "order_OTHER" }));
    await expect(settle(ORDER)).resolves.toMatchObject({ ok: false, reason: "verification" });
    expect(api.bikriup).not.toHaveBeenCalled();
  });

  it("ignores gateway orders without a receipt (another integration)", async () => {
    rzp.fetchGatewayOrder.mockResolvedValue({ ...gw, receipt: null });
    await expect(settle()).resolves.toMatchObject({ ok: false, reason: "not_ours" });
  });

  it("flags an amount that is not the gateway order amount", async () => {
    rzp.fetchGatewayPayment.mockResolvedValue(payment({ amount: 100 }));
    await expect(settle(ORDER)).resolves.toMatchObject({ ok: false, reason: "amount_mismatch" });
    expect(api.bikriup).not.toHaveBeenCalled();
  });

  it("flags Bikriup's own amount check", async () => {
    api.bikriup.mockRejectedValue(
      new BikriupError("Amount does not match", 409, { code: "amount_mismatch" }),
    );
    await expect(settle(ORDER)).resolves.toMatchObject({ ok: false, reason: "amount_mismatch" });
  });

  it("treats the same payment reported again as settled", async () => {
    api.bikriup.mockRejectedValue(
      new BikriupError("already paid", 409, { code: "already_paid", payment_ref: "pay_A" }),
    );
    await expect(settle(ORDER)).resolves.toEqual({ ok: true, orderNo: ORDER });
    expect(rzp.refundPayment).not.toHaveBeenCalled();
  });

  it("refunds a second payment on an order that is already paid", async () => {
    api.bikriup.mockRejectedValue(
      new BikriupError("already paid", 409, { code: "already_paid", payment_ref: "pay_FIRST" }),
    );
    rzp.refundPayment.mockResolvedValue({ id: "rfnd_1", status: "processed" });
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    await expect(settle(ORDER)).resolves.toEqual({
      ok: true,
      orderNo: ORDER,
      duplicateRefunded: { paymentId: "pay_A", refundId: "rfnd_1" },
    });
    expect(rzp.refundPayment).toHaveBeenCalledWith("pay_A", {
      amountPaise: 149900,
      notes: { reason: "duplicate", order_no: ORDER, original_ref: "pay_FIRST" },
    });
  });

  it("does not refund a duplicate twice", async () => {
    api.bikriup.mockRejectedValue(
      new BikriupError("already paid", 409, { code: "already_paid", payment_ref: "pay_FIRST" }),
    );
    rzp.fetchGatewayPayment
      .mockResolvedValueOnce(payment())
      .mockResolvedValueOnce(payment({ amount_refunded: 149900 }));
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    await expect(settle(ORDER)).resolves.toMatchObject({
      ok: true,
      duplicateRefunded: { refundId: "" },
    });
    expect(rzp.refundPayment).not.toHaveBeenCalled();
  });

  it("counts a refund Razorpay already made (handler and webhook raced) as done", async () => {
    api.bikriup.mockRejectedValue(
      new BikriupError("already paid", 409, { code: "already_paid", payment_ref: "pay_FIRST" }),
    );
    rzp.refundPayment.mockRejectedValue({
      statusCode: 400,
      error: {
        code: "BAD_REQUEST_ERROR",
        description: "The payment has been fully refunded already",
      },
    });
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    await expect(settle(ORDER)).resolves.toMatchObject({
      ok: true,
      duplicateRefunded: { paymentId: "pay_A" },
    });
  });

  it("throws when a duplicate refund fails for another reason, so the webhook retries", async () => {
    api.bikriup.mockRejectedValue(
      new BikriupError("already paid", 409, { code: "already_paid", payment_ref: "pay_FIRST" }),
    );
    rzp.refundPayment.mockRejectedValue({
      statusCode: 500,
      error: { code: "SERVER_ERROR", description: "down" },
    });
    await expect(settle(ORDER)).rejects.toMatchObject({ statusCode: 500 });
  });

  it("throws when Bikriup is unreachable, so the webhook retries", async () => {
    api.bikriup.mockRejectedValue(new BikriupError("Bad gateway", 502));
    await expect(settle(ORDER)).rejects.toBeInstanceOf(BikriupError);
  });

  it("returns other Bikriup refusals without throwing", async () => {
    api.bikriup.mockRejectedValue(new BikriupError("Order not found", 404));
    await expect(settle(ORDER)).resolves.toMatchObject({ ok: false, reason: "bikriup_rejected" });
  });
});

describe("failed and refunded payments", () => {
  it("reports a failed attempt against the order in the receipt", async () => {
    api.bikriup.mockResolvedValue({ recorded: "failed" });
    await expect(
      reportBikriupPaymentFailed(payment({ status: "failed" }) as never),
    ).resolves.toEqual({ recorded: "failed" });
    expect(api.bikriup).toHaveBeenCalledWith(`/orders/${ORDER}/payment`, {
      method: "POST",
      body: { status: "failed", provider: "razorpay", ref: "pay_A" },
    });
  });

  it("skips failed attempts on gateway orders that are not the shop's", async () => {
    rzp.fetchGatewayOrder.mockResolvedValue({ ...gw, receipt: null });
    await expect(reportBikriupPaymentFailed(payment() as never)).resolves.toBeNull();
    expect(api.bikriup).not.toHaveBeenCalled();
  });

  it("reports a refund with the total refunded so far", async () => {
    api.bikriup.mockResolvedValue({ ignored: "partial_refund" });
    const refund = { id: "rfnd_2", payment_id: "pay_A", amount: 50000, status: "processed" };
    await reportBikriupRefund(refund, payment({ amount_refunded: 50000 }) as never);
    expect(api.bikriup).toHaveBeenCalledWith(`/orders/${ORDER}/payment`, {
      method: "POST",
      body: {
        status: "refunded",
        provider: "razorpay",
        ref: "pay_A",
        refund_ref: "rfnd_2",
        amount: 500,
      },
    });
  });
});
