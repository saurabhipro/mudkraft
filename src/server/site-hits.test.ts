import { beforeEach, describe, expect, it, vi } from "vitest";

import { BikriupError } from "./bikriup";

const api = vi.hoisted(() => ({ bikriup: vi.fn(), bikriupEnabled: vi.fn(() => true) }));
vi.mock("./bikriup", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  bikriup: api.bikriup,
  bikriupEnabled: api.bikriupEnabled,
}));

const { cleanHit, countryOf, flushHits, isBot, parseUa, pendingHits, queueHit } =
  await import("./site-hits");
const { pageInfo } = await import("@/lib/site-hits");

const ANDROID =
  "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36";
const IPAD =
  "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const MAC =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15";
const hit = (over: Record<string, unknown> = {}) => ({
  event: "page_view",
  path: "/",
  visitor: "visitor-1",
  session: "session-1",
  ...over,
});

describe("page addresses", () => {
  it("names the kind of page and takes tokens out of order links", () => {
    expect(pageInfo("/")).toEqual({ path: "/", page_type: "home", slug: "" });
    expect(pageInfo("/shop/Kullad-Set-of-4/")).toEqual({
      path: "/shop/kullad-set-of-4",
      page_type: "product",
      slug: "kullad-set-of-4",
    });
    expect(pageInfo("/shop")?.page_type).toBe("category");
    expect(pageInfo("/cookware")?.page_type).toBe("category");
    expect(pageInfo("/journal/is-clay-cookware-safe")?.page_type).toBe("content");
    expect(pageInfo("/checkout/done/abc.secret")).toEqual({
      path: "/checkout/done",
      page_type: "order",
      slug: "",
    });
    expect(pageInfo("/checkout/pay/abc.secret")?.path).toBe("/checkout/pay");
    expect(pageInfo("/verify/token123")?.path).toBe("/verify");
    expect(pageInfo("/paylink/plink_x")?.path).toBe("/paylink");
    expect(pageInfo("/admin/orders")).toBeNull();
  });
});

describe("browsers and bots", () => {
  it("tells devices, browsers and systems apart", () => {
    expect(parseUa(ANDROID)).toEqual({ device: "mobile", browser: "Chrome", os: "Android" });
    expect(parseUa(IPAD)).toEqual({ device: "tablet", browser: "Safari", os: "iOS" });
    expect(parseUa(MAC)).toEqual({ device: "desktop", browser: "Safari", os: "macOS" });
    expect(parseUa(`${ANDROID} Instagram 300.0`).browser).toBe("Instagram app");
  });
  it("skips crawlers, link previews and scripts", () => {
    expect(isBot("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")).toBe(
      true,
    );
    expect(isBot("facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)")).toBe(
      true,
    );
    expect(isBot("curl/8.4.0")).toBe(true);
    expect(isBot("")).toBe(true);
    expect(isBot(ANDROID)).toBe(false);
  });
  it("finds the country from the proxy, else the time zone", () => {
    expect(countryOf("in", "")).toBe("India");
    expect(countryOf(null, "Asia/Kolkata")).toBe("India");
    expect(countryOf("XX", "America/New_York")).toBe("United States");
    expect(countryOf(null, "Etc/UTC")).toBe("");
  });
});

describe("hits", () => {
  it("keeps only our fields and refuses private pages and bad ids", () => {
    const h = cleanHit(
      hit({ secret: "x", value: 499, items: [{ slug: "kullad", qty: 1, price: 499 }, "junk"] }),
      { ua: ANDROID, country: "IN" },
    );
    expect(h).toMatchObject({
      event: "page_view",
      device: "mobile",
      country: "India",
      value: 499,
      items: [{ slug: "kullad", qty: 1, price: 499 }],
    });
    expect(h).not.toHaveProperty("secret");
    expect(cleanHit(hit({ path: "/admin" }), { ua: ANDROID, country: null })).toBeNull();
    expect(cleanHit(hit({ visitor: "x" }), { ua: ANDROID, country: null })).toBeNull();
    expect(cleanHit(hit({ event: "hack" }), { ua: ANDROID, country: null })).toBeNull();
  });

  beforeEach(() => {
    pendingHits().length = 0;
    api.bikriup.mockReset();
  });

  it("sends queued hits to Bikriup in one batch", async () => {
    api.bikriup.mockResolvedValue({ ok: true });
    queueHit(hit());
    queueHit(hit({ path: "/shop" }));
    await flushHits();
    expect(api.bikriup).toHaveBeenCalledTimes(1);
    expect(api.bikriup.mock.calls[0][0]).toBe("/analytics/events");
    expect(api.bikriup.mock.calls[0][1].body.events).toHaveLength(2);
    expect(pendingHits()).toHaveLength(0);
  });

  it("keeps a batch when Bikriup is down, drops one it refused", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    api.bikriup.mockRejectedValueOnce(new BikriupError("down", 502));
    queueHit(hit());
    await flushHits();
    expect(pendingHits()).toHaveLength(1);
    api.bikriup.mockRejectedValueOnce(new BikriupError("bad", 400));
    await flushHits();
    expect(pendingHits()).toHaveLength(0);
  });
});
