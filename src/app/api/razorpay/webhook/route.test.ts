import { createHmac } from "node:crypto";

import { beforeEach, describe, expect, it, vi } from "vitest";

const pay = vi.hoisted(() => ({
  settleBikriupPayment: vi.fn(),
  reportBikriupPaymentFailed: vi.fn(),
  reportBikriupRefund: vi.fn(),
}));
const events = vi.hoisted(() => ({ claimWebhookEvent: vi.fn(), releaseWebhookEvent: vi.fn() }));
const mail = vi.hoisted(() => ({ sendAdminAlert: vi.fn() }));

vi.mock("@/server/bikriup-payments", () => pay);
vi.mock("@/server/webhook-events", () => events);
vi.mock("@/server/email/send", () => mail);
vi.mock("@/server/bikriup", () => ({ bikriupEnabled: () => true }));
vi.mock("@/server/db", () => ({ db: {} }));

const { POST } = await import("./route");

const SECRET = process.env.RAZORPAY_WEBHOOK_SECRET!;
const paymentEntity = { id: "pay_A", order_id: "order_1", amount: 149900, status: "captured" };

function delivery(
  body: unknown,
  {
    secret = SECRET,
    eventId = "evt_1",
    raw,
  }: { secret?: string; eventId?: string | null; raw?: string } = {},
) {
  const text = raw ?? JSON.stringify(body);
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-razorpay-signature": createHmac("sha256", secret).update(text).digest("hex"),
  };
  if (eventId) headers["x-razorpay-event-id"] = eventId;
  return new Request("http://localhost/api/razorpay/webhook", {
    method: "POST",
    headers,
    body: text,
  });
}

const captured = { event: "payment.captured", payload: { payment: { entity: paymentEntity } } };

beforeEach(() => {
  events.claimWebhookEvent.mockResolvedValue(true);
  events.releaseWebhookEvent.mockResolvedValue(undefined);
  pay.settleBikriupPayment.mockResolvedValue({ ok: true, orderNo: "MK-1042" });
  mail.sendAdminAlert.mockResolvedValue(true);
});

describe("Razorpay webhook", () => {
  it("rejects a delivery signed with the wrong secret", async () => {
    const res = await POST(delivery(captured, { secret: "wrong" }));
    expect(res.status).toBe(401);
    expect(pay.settleBikriupPayment).not.toHaveBeenCalled();
  });

  it("rejects a delivery without a signature", async () => {
    const req = new Request("http://localhost/api/razorpay/webhook", {
      method: "POST",
      body: JSON.stringify(captured),
    });
    expect((await POST(req)).status).toBe(401);
  });

  it("answers 400 to a signed body that is not JSON", async () => {
    expect((await POST(delivery(null, { raw: "not json" }))).status).toBe(400);
  });

  it("acknowledges events it does not handle without claiming them", async () => {
    const res = await POST(delivery({ event: "order.paid", payload: {} }));
    expect(res.status).toBe(200);
    expect(events.claimWebhookEvent).not.toHaveBeenCalled();
  });

  it("settles a captured payment", async () => {
    const res = await POST(delivery(captured));
    expect(res.status).toBe(200);
    expect(events.claimWebhookEvent).toHaveBeenCalledWith("razorpay:evt_1", "payment.captured");
    expect(pay.settleBikriupPayment).toHaveBeenCalledWith({
      gatewayOrderId: "order_1",
      gatewayPaymentId: "pay_A",
    });
  });

  it("skips a delivery it has already handled", async () => {
    events.claimWebhookEvent.mockResolvedValue(false);
    const res = await POST(delivery(captured));
    expect(await res.json()).toMatchObject({ duplicate: true });
    expect(pay.settleBikriupPayment).not.toHaveBeenCalled();
  });

  it("still settles when the dedupe table cannot be reached", async () => {
    events.claimWebhookEvent.mockRejectedValue(new Error("db down"));
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    expect((await POST(delivery(captured))).status).toBe(200);
    expect(pay.settleBikriupPayment).toHaveBeenCalled();
  });

  it("answers 500 and releases the claim when settling throws, so the retry is processed", async () => {
    pay.settleBikriupPayment.mockRejectedValue(new Error("Bikriup unreachable"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const res = await POST(delivery(captured));
    expect(res.status).toBe(500);
    expect(events.releaseWebhookEvent).toHaveBeenCalledWith("razorpay:evt_1");
  });

  it("alerts the studio about an amount mismatch, and does not ask for a retry", async () => {
    pay.settleBikriupPayment.mockResolvedValue({
      ok: false,
      error: "x",
      reason: "amount_mismatch",
    });
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const res = await POST(delivery(captured));
    expect(res.status).toBe(200);
    expect(mail.sendAdminAlert).toHaveBeenCalledOnce();
    expect(mail.sendAdminAlert.mock.calls[0][1].join(" ")).toContain("pay_A");
  });

  it("does not alert for gateway orders that are not the shop's", async () => {
    pay.settleBikriupPayment.mockResolvedValue({ ok: false, error: "x", reason: "not_ours" });
    await POST(delivery(captured));
    expect(mail.sendAdminAlert).not.toHaveBeenCalled();
  });

  it("records a failed payment", async () => {
    pay.reportBikriupPaymentFailed.mockResolvedValue({ recorded: "failed" });
    const res = await POST(
      delivery({
        event: "payment.failed",
        payload: { payment: { entity: { ...paymentEntity, status: "failed" } } },
      }),
    );
    expect(res.status).toBe(200);
    expect(pay.reportBikriupPaymentFailed).toHaveBeenCalledWith(
      expect.objectContaining({ id: "pay_A" }),
    );
  });

  it("reports a processed refund", async () => {
    pay.reportBikriupRefund.mockResolvedValue({ recorded: "refunded" });
    const refund = { id: "rfnd_1", payment_id: "pay_A", amount: 149900, status: "processed" };
    const res = await POST(
      delivery({
        event: "refund.processed",
        payload: { refund: { entity: refund }, payment: { entity: paymentEntity } },
      }),
    );
    expect(res.status).toBe(200);
    expect(pay.reportBikriupRefund).toHaveBeenCalledWith(
      refund,
      expect.objectContaining({ id: "pay_A" }),
    );
  });

  it("alerts the studio when a refund fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const refund = { id: "rfnd_1", payment_id: "pay_A", amount: 149900, status: "failed" };
    const res = await POST(
      delivery({ event: "refund.failed", payload: { refund: { entity: refund } } }),
    );
    expect(res.status).toBe(200);
    expect(mail.sendAdminAlert).toHaveBeenCalledWith(
      expect.stringContaining("rfnd_1"),
      expect.any(Array),
    );
  });
});
