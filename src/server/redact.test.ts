import { describe, expect, it } from "vitest";

import { BikriupError } from "./bikriup";
import { describeError, maskEmail, maskPhone } from "./redact";

describe("maskPhone", () => {
  it("keeps the country code and last four digits", () => {
    expect(maskPhone("+919810033344")).toBe("+91••••••3344");
    expect(maskPhone("9810033344")).toBe("••••••3344");
    expect(maskPhone("91 98100 33344")).toBe("+91••••••3344");
  });

  it("hides short or missing values entirely", () => {
    expect(maskPhone("12")).toBe("•••");
    expect(maskPhone(undefined)).toBe("•••");
  });
});

describe("maskEmail", () => {
  it("keeps the first letter and the domain", () => {
    expect(maskEmail("asha.k@example.com")).toBe("a•••@example.com");
  });

  it("hides anything that is not an address", () => {
    expect(maskEmail("not-an-email")).toBe("•••");
    expect(maskEmail(null)).toBe("•••");
  });
});

describe("describeError", () => {
  it("keeps only status, code and description of a Razorpay SDK error", () => {
    const err = {
      statusCode: 400,
      error: {
        code: "BAD_REQUEST_ERROR",
        description: "Invalid amount",
        metadata: { contact: "+919810033344" },
      },
    };
    const line = describeError(err);
    expect(line).toBe("razorpay 400 BAD_REQUEST_ERROR: Invalid amount");
    expect(line).not.toContain("9810033344");
  });

  it("includes a Bikriup error's status and code", () => {
    expect(
      describeError(new BikriupError("This order is already paid", 409, { code: "already_paid" })),
    ).toBe("BikriupError 409 already_paid: This order is already paid");
  });

  it("never prints a stack", () => {
    const line = describeError(new TypeError("fetch failed"));
    expect(line).toBe("TypeError: fetch failed");
    expect(line).not.toContain("\n");
  });
});
