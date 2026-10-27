import type { ImageLoaderProps } from "next/image";

/**
 * Cloudinary delivery URLs, built from the `public_id` we store rather than a
 * persisted URL — so a transformation change, a folder move or a CDN hostname
 * change never requires a data migration.
 *
 * Safe to import from client components: the cloud name is public by design and
 * appears in every delivery URL. The API key and secret live only in
 * src/server/cloudinary.ts.
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";

export interface CloudinaryUrlOptions {
  publicId: string;
  version?: string | null;
  resourceType?: "image" | "video";
  /** Raw Cloudinary transformation segments, e.g. ["w_800", "c_fill"]. */
  transforms?: string[];
}

export function cloudinaryUrl({
  publicId,
  version,
  resourceType = "image",
  transforms = [],
}: CloudinaryUrlOptions): string {
  // A photo hosted by Bikriup arrives as a full address; there is nothing to transform.
  if (/^https?:\/\//.test(publicId)) return publicId;
  if (!CLOUD_NAME) {
    throw new Error(
      "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not set — Cloudinary URLs cannot be built.",
    );
  }

  // f_auto and q_auto let Cloudinary pick format and compression per browser.
  const defaults = ["f_auto", "q_auto"];
  const segments = [...defaults, ...transforms].join(",");
  const versionSegment = version ? `v${version}/` : "";

  return `https://res.cloudinary.com/${CLOUD_NAME}/${resourceType}/upload/${segments}/${versionSegment}${publicId}`;
}

/**
 * Loader for next/image. Pass per-image via the `loader` prop rather than
 * configuring it globally — a global loader would also capture the site's
 * existing local image imports, which are not on Cloudinary.
 *
 *   <Image loader={cloudinaryLoader} src={publicId} width={800} height={800} alt="" />
 */
export function cloudinaryLoader({ src, width, quality }: ImageLoaderProps): string {
  return cloudinaryUrl({
    publicId: src,
    transforms: [`w_${width}`, `q_${quality ?? "auto"}`, "c_limit"],
  });
}

/** Square, cropped thumbnail — product grids and admin tables. */
export function cloudinaryThumb(publicId: string, size = 400, version?: string | null): string {
  return cloudinaryUrl({
    publicId,
    version,
    transforms: [`w_${size}`, `h_${size}`, "c_fill", "g_auto"],
  });
}
