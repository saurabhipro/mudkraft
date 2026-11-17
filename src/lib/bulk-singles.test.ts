import { describe, expect, it } from "vitest";

import { withSingles } from "./bulk-singles";

const item = (slug: string, name: string, img: string | null = null) => ({
  slug,
  name,
  img,
  category: "Drinkware",
});
const make = (
  single: { slug: string; name: string; img: string | null },
  family: ReturnType<typeof item>[],
) => ({
  slug: single.slug,
  name: single.name,
  img: single.img ?? family[0].img,
  category: family[0].category,
});

describe("withSingles", () => {
  it("swaps each live pack family for one single, in place", () => {
    const { items, replaced } = withSingles(
      [
        item("handi-2-5l", "Handi"),
        item("glass-set-4", "Glass"),
        item("glass-set-6", "Glass"),
        item("jug", "Jug"),
      ],
      make,
    );
    expect(items.map((i) => i.slug)).toEqual(["handi-2-5l", "bulk-glass-single", "jug"]);
    expect(replaced.get("glass-set-6")).toBe("bulk-glass-single");
  });

  it("shows no single for a family that is not live", () => {
    const { items } = withSingles([item("handi-2-5l", "Handi")], make);
    expect(items.map((i) => i.slug)).toEqual(["handi-2-5l"]);
  });

  it("falls back to the family's shop photo when there is no single photo", () => {
    const { items } = withSingles(
      [item("kullad-set-of-6-0-5", "Kullad Set of 4", "kulhad.png")],
      make,
    );
    expect(items[0]).toMatchObject({ slug: "bulk-kulhad-single", img: "kulhad.png" });
  });
});
