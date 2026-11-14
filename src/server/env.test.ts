import { describe, expect, it } from "vitest";

import { parseServerEnv, testKeysOnLiveSite } from "./env";

const base = {
  DATABASE_URL: "postgresql://x",
  BETTER_AUTH_SECRET: "x".repeat(32),
  BETTER_AUTH_URL: "https://www.mudkraft.com",
  GOOGLE_CLIENT_ID: "g",
  GOOGLE_CLIENT_SECRET: "g",
  CLOUDINARY_API_KEY: "c",
  CLOUDINARY_API_SECRET: "c",
};
const webhookSecret = "a".repeat(32);

describe("Razorpay environment rules", () => {
  it("allows Razorpay to be left out entirely", () => {
    expect(parseServerEnv(base).RAZORPAY_KEY_ID).toBeUndefined();
    expect(
      parseServerEnv({ ...base, RAZORPAY_KEY_ID: "", RAZORPAY_KEY_SECRET: "" }).RAZORPAY_KEY_ID,
    ).toBeUndefined();
  });

  it("accepts test keys without a webhook secret", () => {
    const env = parseServerEnv({
      ...base,
      RAZORPAY_KEY_ID: "rzp_test_abc123",
      RAZORPAY_KEY_SECRET: "s",
    });
    expect(env.RAZORPAY_KEY_ID).toBe("rzp_test_abc123");
  });

  it("rejects a key id that is not a Razorpay key", () => {
    expect(() =>
      parseServerEnv({ ...base, RAZORPAY_KEY_ID: "abc123", RAZORPAY_KEY_SECRET: "s" }),
    ).toThrow(/RAZORPAY_KEY_ID/);
  });

  it("requires the key secret with the key id", () => {
    expect(() => parseServerEnv({ ...base, RAZORPAY_KEY_ID: "rzp_test_abc123" })).toThrow(
      /RAZORPAY_KEY_SECRET/,
    );
  });

  it("requires a long webhook secret with live keys", () => {
    const live = { ...base, RAZORPAY_KEY_ID: "rzp_live_abc123", RAZORPAY_KEY_SECRET: "s" };
    expect(() => parseServerEnv(live)).toThrow(/RAZORPAY_WEBHOOK_SECRET/);
    expect(() => parseServerEnv({ ...live, RAZORPAY_WEBHOOK_SECRET: "short" })).toThrow(
      /RAZORPAY_WEBHOOK_SECRET/,
    );
    expect(
      parseServerEnv({ ...live, RAZORPAY_WEBHOOK_SECRET: webhookSecret }).RAZORPAY_KEY_ID,
    ).toBe("rzp_live_abc123");
  });
});

describe("testKeysOnLiveSite", () => {
  const withTestKeys = parseServerEnv({
    ...base,
    RAZORPAY_KEY_ID: "rzp_test_abc123",
    RAZORPAY_KEY_SECRET: "s",
  });

  it("flags test keys on a production build of the real site", () => {
    expect(testKeysOnLiveSite(withTestKeys, "production")).toBe(true);
  });

  it("stays quiet in development, on localhost and with live keys", () => {
    expect(testKeysOnLiveSite(withTestKeys, "development")).toBe(false);
    const local = parseServerEnv({
      ...base,
      BETTER_AUTH_URL: "http://localhost:3000",
      RAZORPAY_KEY_ID: "rzp_test_a",
      RAZORPAY_KEY_SECRET: "s",
    });
    expect(testKeysOnLiveSite(local, "production")).toBe(false);
    const live = parseServerEnv({
      ...base,
      RAZORPAY_KEY_ID: "rzp_live_a",
      RAZORPAY_KEY_SECRET: "s",
      RAZORPAY_WEBHOOK_SECRET: webhookSecret,
    });
    expect(testKeysOnLiveSite(live, "production")).toBe(false);
  });
});
