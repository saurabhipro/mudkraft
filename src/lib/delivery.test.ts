import { describe, expect, it } from "vitest";

import { DEFAULT_DELIVERY, deliveryText, withDelivery } from "./delivery";
import { POLICY } from "./policy";
import { shippingDetails, shippingRatePaise } from "./schema";

describe("delivery terms", () => {
  it("states no price when delivery is charged per PIN code", () => {
    expect(shippingRatePaise({ mode: "per_pin" })).toBeNull();
    expect(shippingDetails({ mode: "per_pin" }).shippingRate).toBeUndefined();
    expect(deliveryText({ mode: "per_pin" })).toBe(POLICY.delivery);
  });

  it("states ₹0 only when delivery is included in the price", () => {
    expect(shippingRatePaise({ mode: "included" })).toBe(0);
    expect(shippingDetails({ mode: "included" }).shippingRate).toMatchObject({ value: "0.00", currency: "INR" });
    expect(deliveryText({ mode: "included" })).toMatch(/included in the price/);
  });

  it("states a flat fee in full, with the free threshold in the wording", () => {
    const flat = { mode: "flat", feePaise: 9900, freeAbovePaise: 150000 } as const;
    expect(shippingRatePaise(flat)).toBe(9900);
    expect(deliveryText(flat)).toMatch(/₹99.*free on orders above ₹1,500/);
  });

  it("falls back to per PIN, never to free", () => {
    expect(DEFAULT_DELIVERY.mode).toBe("per_pin");
  });

  it("swaps the live wording into copy written against the policy sentence", () => {
    const faq = `Yes. ${POLICY.delivery}. Orders leave within ${POLICY.dispatch}.`;
    expect(withDelivery(faq, { mode: "included" })).toBe(
      `Yes. ${deliveryText({ mode: "included" })}. Orders leave within ${POLICY.dispatch}.`,
    );
  });
});
