import { describe, expect, it, vi } from "vitest";

import { toStoreProductShape, type BkProduct } from "@/server/bikriup";

const store = vi.hoisted(() => ({ getProductBySlug: vi.fn(), getActiveProducts: vi.fn() }));
vi.mock("@/server/store/products", () => store);

const { generateMetadata } = await import("./page");

const bk = (over: Partial<BkProduct> = {}): BkProduct => ({
  id: 7,
  slug: "clay-handi-2-5-l",
  style_group: "HANDI",
  name: "Handi",
  price: 749,
  in_stock: true,
  stock_left: 4,
  category: "Cookware",
  type: "Handi",
  size_label: "2.5 L",
  images: [],
  ...over,
});
const meta = async (over: Partial<BkProduct> = {}) => {
  store.getProductBySlug.mockResolvedValueOnce(toStoreProductShape(bk(over)));
  return generateMetadata({ params: Promise.resolve({ slug: "clay-handi-2-5-l" }) });
};

describe("product search & sharing from Bikriup", () => {
  it("writes everything itself when the shop set nothing", async () => {
    const m = await meta();
    expect(m.title).toEqual({ absolute: expect.stringContaining("Clay Handi 2.5 L") });
    expect(m.description).toContain("Hand-thrown");
    expect(m.keywords).toContain("clay handi");
    expect(m.robots).toBeUndefined();
  });

  it("uses each part the shop filled in and writes the rest", async () => {
    const m = await meta({
      seo: { title: "Mitti ki Handi 2.5 L | Mudkraft", keywords: ["mitti ki handi"] },
    });
    expect(m.title).toEqual({ absolute: "Mitti ki Handi 2.5 L | Mudkraft" });
    expect(m.openGraph?.title).toBe("Mitti ki Handi 2.5 L | Mudkraft");
    expect(m.description).toContain("Hand-thrown");
    expect(m.keywords).toEqual(["mitti ki handi"]);
  });

  it("keeps a hidden item out of search", async () => {
    const m = await meta({ seo: { noindex: true } });
    expect(m.robots).toEqual({ index: false, follow: true });
  });

  it("carries the share photo across", () => {
    expect(
      toStoreProductShape(bk({ seo: { image: "https://res.cloudinary.com/x/image/upload/a.jpg" } }))
        .seo?.image,
    ).toBe("https://res.cloudinary.com/x/image/upload/a.jpg");
    expect(toStoreProductShape(bk()).seo).toEqual({});
  });
});
