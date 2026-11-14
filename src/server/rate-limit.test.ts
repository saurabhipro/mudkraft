import { afterEach, describe, expect, it, vi } from "vitest";

import { createLimiter } from "./rate-limit";

describe("createLimiter", () => {
  afterEach(() => vi.useRealTimers());

  it("allows max hits per window, then refuses", () => {
    const tooMany = createLimiter({ windowMs: 60_000, max: 3 });
    expect([1, 2, 3].map(() => tooMany("a"))).toEqual([false, false, false]);
    expect(tooMany("a")).toBe(true);
  });

  it("counts keys separately", () => {
    const tooMany = createLimiter({ windowMs: 60_000, max: 1 });
    expect(tooMany("a")).toBe(false);
    expect(tooMany("b")).toBe(false);
    expect(tooMany("a")).toBe(true);
  });

  it("starts a fresh window once the old one ends", () => {
    vi.useFakeTimers();
    const tooMany = createLimiter({ windowMs: 1_000, max: 1 });
    expect(tooMany("a")).toBe(false);
    expect(tooMany("a")).toBe(true);
    vi.advanceTimersByTime(1_000);
    expect(tooMany("a")).toBe(false);
  });
});
