import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * initiateRazorpayPayment in Bikriup mode: one gateway order per shop order.
 * Everything it talks to is mocked; the module's other imports are stubbed so
 * loading it needs no database, auth or messaging.
 */

const bk = vi.hoisted(() => ({ getBikriupOrder: vi.fn() }));
const rzp = vi.hoisted(() => ({ createGatewayOrder: vi.fn(), fetchGatewayOrder: vi.fn() }));
const pay = vi.hoisted(() => ({ setBikriupGatewayOrder: vi.fn(), settleBikriupPayment: vi.fn() }));
const net = vi.hoisted(() => ({ ip: "203.0.113.7" }));

vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-forwarded-for": net.ip }),
  cookies: async () => ({ get: () => undefined }),
}));
vi.mock("@/server/bikriup", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  bikriupEnabled: () => true,
  getBikriupOrder: bk.getBikriupOrder,
}));
vi.mock("@/server/razorpay", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  ...rzp,
}));
vi.mock("@/server/bikriup-payments", () => pay);
vi.mock("@/server/auth-guard", () => ({ getSession: vi.fn() }));
vi.mock("@/server/db", () => ({ db: {} }));
vi.mock("@/server/email/send", () => ({ sendOrderConfirmationEmail: vi.fn() }));
vi.mock("@/server/social", () => ({ CHAT_REF_COOKIE: "chat_ref", readChatRef: vi.fn() }));
vi.mock("@/server/whatsapp", () => ({ sendWhatsApp: vi.fn() }));
vi.mock("@/server/whatsapp/orders", () => ({ orderReceived: vi.fn() }));

const { initiateRazorpayPayment } = await import("./checkout");

const bkOrder = (over: Record<string, unknown> = {}) => ({
  order_no: "MK-1042",
  status: "placed",
  payment_method: "online",
  payment_status: "unpaid",
  customer_name: "Asha",
  phone: "9810033344",
  total: 1499,
  gateway_order_id: "",
  ...over,
});

let n = 0;
beforeEach(() => {
  // A fresh shopper per test, so the rate limit never carries over.
  net.ip = `203.0.113.${++n}`;
  rzp.createGatewayOrder.mockResolvedValue({ id: "order_NEW" });
  pay.setBikriupGatewayOrder.mockResolvedValue(undefined);
});

describe("initiateRazorpayPayment (Bikriup)", () => {
  it("opens a gateway order on the first click and stores it on the order", async () => {
    bk.getBikriupOrder.mockResolvedValue(bkOrder());
    await expect(initiateRazorpayPayment(`tok${n}`)).resolves.toMatchObject({
      ok: true,
      gatewayOrderId: "order_NEW",
      amountPaise: 149900,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
    expect(rzp.createGatewayOrder).toHaveBeenCalledWith({
      amountPaise: 149900,
      receipt: "MK-1042",
      notes: { order_number: "MK-1042" },
    });
    expect(pay.setBikriupGatewayOrder).toHaveBeenCalledWith("MK-1042", {
      id: "order_NEW",
      amountRupees: 1499,
    });
  });

  it("reuses the stored gateway order while it is unpaid and for the same amount", async () => {
    bk.getBikriupOrder.mockResolvedValue(bkOrder({ gateway_order_id: "order_OLD" }));
    rzp.fetchGatewayOrder.mockResolvedValue({
      id: "order_OLD",
      amount: 149900,
      receipt: "MK-1042",
      status: "attempted",
    });
    await expect(initiateRazorpayPayment(`tok${n}`)).resolves.toMatchObject({
      ok: true,
      gatewayOrderId: "order_OLD",
    });
    expect(rzp.createGatewayOrder).not.toHaveBeenCalled();
  });

  it("opens a new one when the order total changed", async () => {
    bk.getBikriupOrder.mockResolvedValue(bkOrder({ gateway_order_id: "order_OLD" }));
    rzp.fetchGatewayOrder.mockResolvedValue({
      id: "order_OLD",
      amount: 99900,
      receipt: "MK-1042",
      status: "created",
    });
    await expect(initiateRazorpayPayment(`tok${n}`)).resolves.toMatchObject({
      ok: true,
      gatewayOrderId: "order_NEW",
    });
  });

  it("opens nothing while the stored gateway order is paid but not yet settled", async () => {
    bk.getBikriupOrder.mockResolvedValue(bkOrder({ gateway_order_id: "order_OLD" }));
    rzp.fetchGatewayOrder.mockResolvedValue({
      id: "order_OLD",
      amount: 149900,
      receipt: "MK-1042",
      status: "paid",
    });
    const result = await initiateRazorpayPayment(`tok${n}`);
    expect(result).toMatchObject({ ok: false });
    expect(rzp.createGatewayOrder).not.toHaveBeenCalled();
  });

  it("still lets the customer pay when storing the gateway order fails", async () => {
    bk.getBikriupOrder.mockResolvedValue(bkOrder());
    pay.setBikriupGatewayOrder.mockRejectedValue(new Error("Bikriup down"));
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    await expect(initiateRazorpayPayment(`tok${n}`)).resolves.toMatchObject({
      ok: true,
      gatewayOrderId: "order_NEW",
    });
  });

  it.each(["paid", "cod_collected", "refund_due", "refunded"])(
    "refuses an order whose payment is %s",
    async (status) => {
      bk.getBikriupOrder.mockResolvedValue(bkOrder({ payment_status: status }));
      await expect(initiateRazorpayPayment(`tok${n}`)).resolves.toMatchObject({ ok: false });
      expect(rzp.createGatewayOrder).not.toHaveBeenCalled();
    },
  );

  it("refuses cancelled orders and orders not paid online", async () => {
    bk.getBikriupOrder.mockResolvedValue(bkOrder({ status: "cancelled" }));
    await expect(initiateRazorpayPayment(`tok${n}`)).resolves.toMatchObject({ ok: false });
    bk.getBikriupOrder.mockResolvedValue(bkOrder({ payment_method: "cod" }));
    await expect(initiateRazorpayPayment(`tok${n}`)).resolves.toMatchObject({ ok: false });
  });

  it("rate-limits repeated attempts on one order from one shopper", async () => {
    bk.getBikriupOrder.mockResolvedValue(bkOrder({ gateway_order_id: "order_OLD" }));
    rzp.fetchGatewayOrder.mockResolvedValue({
      id: "order_OLD",
      amount: 149900,
      receipt: "MK-1042",
      status: "created",
    });
    const results = [];
    for (let i = 0; i < 9; i++) results.push(await initiateRazorpayPayment("same-token"));
    expect(results.slice(0, 8).every((r) => r.ok)).toBe(true);
    expect(results[8]).toMatchObject({ ok: false, error: expect.stringMatching(/Too many/) });
  });
});
