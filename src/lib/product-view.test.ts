import { describe, expect, it } from "vitest";
import { coverCutout } from "./product-view";

const img = (publicId: string) => ({ publicId });

describe("coverCutout", () => {
  it("uses the cutout made from the cover", () => {
    const images = [img("mudkraft/products/glass"), img("mudkraft/products/glass-cutout")];
    expect(coverCutout(images[0], images)?.publicId).toBe("mudkraft/products/glass-cutout");
  });

  it("matches Bikriup-hosted photos with extensions", () => {
    const images = [img("https://x.test/uploads/mug.jpg"), img("https://x.test/uploads/mug-cutout.png")];
    expect(coverCutout(images[0], images)?.publicId).toBe("https://x.test/uploads/mug-cutout.png");
  });

  it("ignores a cutout of some other photo, so a new cover shows", () => {
    const images = [img("https://x.test/uploads/new-cover.jpg"), img("https://x.test/uploads/imp-clean-1-cutout.png")];
    expect(coverCutout(images[0], images)).toBeNull();
  });

  it("uses the cover itself when it is a cutout", () => {
    const images = [img("https://x.test/uploads/imp-clean-1-cutout.png"), img("https://x.test/uploads/old.jpg")];
    expect(coverCutout(images[0], images)?.publicId).toBe("https://x.test/uploads/imp-clean-1-cutout.png");
  });
});
