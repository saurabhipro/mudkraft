import { describe, expect, it } from "vitest";

import { checkPassword } from "./password-policy";

describe("checkPassword", () => {
  it("accepts a password meeting every rule", () => {
    expect(checkPassword("Clay#pot1")).toBeNull();
    expect(checkPassword("Kullad set!")).toBeNull();
  });

  it("rejects short passwords", () => {
    expect(checkPassword("Ab#1")).toMatch(/8 characters/);
  });

  it("requires a capital, a small letter and a special character", () => {
    expect(checkPassword("clay#pot1")).toMatch(/capital/);
    expect(checkPassword("CLAY#POT1")).toMatch(/small letter/);
    expect(checkPassword("clay#pot1")).toContain("(A–Z)");
    expect(checkPassword("Claypot12")).toMatch(/special/);
  });

  it("lists every missing rule", () => {
    const message = checkPassword("abc") ?? "";
    expect(message).toMatch(/8 characters/);
    expect(message).toMatch(/capital/);
    expect(message).toMatch(/special/);
  });
});
