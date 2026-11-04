import type { ImageBox } from "@/lib/product-view";

/**
 * Where the piece sits inside each product photo. The photos come with very different margins
 * (the bhagona fills its frame, the sieve dome sits in a sea of white), so the hero wheel crops
 * to this box and every piece then stands at the same size on the disc.
 *
 * Best-effort: a photo that cannot be fetched or read simply has no box and is shown whole.
 * sharp is loaded on first use (it comes with Next), so even a missing binary only costs the crop.
 */

/** A photo's pixels never change under the same address, so one measurement per server will do. */
const boxes = new Map<string, Promise<ImageBox | null>>();

const FETCH_TIMEOUT_MS = 4000;

async function measure(url: string): Promise<ImageBox | null> {
  try {
    const { default: sharp } = await import("sharp");
    const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const { width, height } = await sharp(buf).metadata();
    if (!width || !height) return null;
    // trim() takes the top-left pixel as the background: white on a studio shot, clear on a cutout.
    const { info } = await sharp(buf).trim({ threshold: 25 }).toBuffer({ resolveWithObject: true });
    const left = -(info.trimOffsetLeft ?? 0);
    const top = -(info.trimOffsetTop ?? 0);
    return {
      x: left / width,
      y: top / height,
      w: info.width / width,
      h: info.height / height,
      ratio: info.width / info.height,
    };
  } catch (error) {
    console.warn("[image-box] could not measure", url, error);
    return null;
  }
}

export async function imageBoxes(urls: Array<string | null>): Promise<Record<string, ImageBox>> {
  const unique = [...new Set(urls.filter((u): u is string => Boolean(u)))];
  const results = await Promise.all(
    unique.map((url) => {
      let pending = boxes.get(url);
      if (!pending) {
        pending = measure(url);
        boxes.set(url, pending);
        // A failure is not remembered, so the next visit tries again.
        pending.then((box) => box ?? boxes.delete(url));
      }
      return pending;
    }),
  );
  return Object.fromEntries(
    unique.flatMap((url, k) => (results[k] ? [[url, results[k]] as const] : [])),
  );
}
