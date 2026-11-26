import { beforeEach, describe, expect, it, vi } from "vitest";

import { BikriupError } from "./bikriup";

const rzp = vi.hoisted(() => ({
  fetchGatewayPayment: vi.fn(),
  fetchPaymentLink: vi.fn(),
  createPaymentLink: vi.fn(),
  refundPayment: vi.fn(),
  razorpayConfigured: vi.fn(() => true),
}));
const api = vi.hoisted(() => ({ bikriup: vi.fn(), bikriupEnabled: vi.fn(() => true) }));

vi.mock("./razorpay", async (importOriginal) => ({ ...(await importOriginal<object>()), ...rzp }));
vi.mock("./bikriup", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  bikriup: api.bikriup,
  bikriupEnabled: api.bikriupEnabled,
}));

const { createBikriupPayLink, payLinkOrderNo, payLinkTarget, settlePaymentLink } =
  await import("./bikriup-paylinks");

const link = (over: Record<string, unknown> = {}) => ({
  id: "plink_A",
  short_url: "https://rzp.io/rzp/abc",
  status: "paid",
  amount: 120000,
  amount_paid: 120000,
  reference_id: "PL7-MK260012",
  notes: {},
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  rzp.fetchGatewayPayment.mockResolvedValue({
    id: "pay_L",
    status: "captured",
    amount: 120000,
    amount_refunded: 0,
  });
  api.bikriup.mockResolvedValue({ recorded: "paid" });
});

describe("payment links", () => {
  it("reads the order from a link's reference, and nothing from anyone else's", () => {
    expect(payLinkOrderNo("PL7-MK260012")).toBe("MK260012");
    expect(payLinkOrderNo("MK260012")).toBeNull();
    expect(payLinkOrderNo(null)).toBeNull();
  });

  it("makes the link with Razorpay's own SMS and email off, and reports its URL", async () => {
    rzp.createPaymentLink.mockResolvedValue(link({ status: "created" }));
    await createBikriupPayLink({
      link_id: 7,
      order_no: "MK260012",
      reference_id: "PL7-MK260012",
      amount_paise: 120000,
      description: "Order MK260012",
      customer: { name: "Asha", phone: "9810011111", email: "a@b.in" },
      expire_by: 2000000000,
    });
    expect(rzp.createPaymentLink.mock.calls[0][0]).toMatchObject({
      amountPaise: 120000,
      referenceId: "PL7-MK260012",
      customer: { contact: "+919810011111" },
    });
    expect(api.bikriup).toHaveBeenCalledWith("/paylinks/status", {
      method: "POST",
      body: { link_id: 7, status: "active", url: "https://rzp.io/rzp/abc", ext_id: "plink_A" },
    });
  });

  it("reports a paid link to Bikriup in rupees", async () => {
    await settlePaymentLink(link(), "pay_L");
    expect(api.bikriup).toHaveBeenCalledWith("/paylinks/paid", {
      method: "POST",
      body: {
        link_id: 7,
        ext_id: "plink_A",
        order_no: "MK260012",
        payment_id: "pay_L",
        amount: 1200,
      },
    });
    expect(rzp.refundPayment).not.toHaveBeenCalled();
  });

  it("refunds a link payment on an order that was already paid", async () => {
    api.bikriup.mockRejectedValue(new BikriupError("already paid", 409, { code: "already_paid" }));
    rzp.refundPayment.mockResolvedValue({ id: "rfnd_1", status: "processed" });
    await settlePaymentLink(link(), "pay_L");
    expect(rzp.refundPayment).toHaveBeenCalledWith(
      "pay_L",
      expect.objectContaining({ amountPaise: 120000 }),
    );
  });

  it("leaves links that aren't Bikriup's alone", async () => {
    await settlePaymentLink(link({ reference_id: "INV-9" }), "pay_L");
    expect(api.bikriup).not.toHaveBeenCalled();
  });

  it("the Pay now button opens Razorpay while open, the order page once paid", async () => {
    rzp.fetchPaymentLink.mockResolvedValue(link({ status: "created" }));
    await expect(payLinkTarget("plink_A")).resolves.toBe("https://rzp.io/rzp/abc");
    rzp.fetchPaymentLink.mockResolvedValue(
      link({ notes: { order_page: "https://evil.example/x" } }),
    );
    await expect(payLinkTarget("plink_A")).resolves.not.toContain("evil");
    await expect(payLinkTarget("../../x")).resolves.not.toContain("..");
  });
});
