import { v2 as cloudinary } from "cloudinary";

import { CLOUDINARY_CLOUD_NAME, serverEnv } from "./env";

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: serverEnv.CLOUDINARY_API_KEY,
  api_secret: serverEnv.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Uploads are SIGNED, never unsigned.
 *
 * An unsigned upload preset is a public write endpoint: anyone who reads your
 * JavaScript bundle can fill your Cloudinary account with arbitrary files. Here
 * the browser must first ask this server for a signature, which is only issued
 * to an authenticated admin, and covers a fixed folder and format allowlist.
 * The API secret never leaves the server.
 */

/** Uploads may only land in these folders. A client-supplied path is not accepted. */
export const UPLOAD_FOLDERS = {
  products: "mudkraft/products",
  reviews: "mudkraft/reviews",
} as const;

export type UploadFolderKey = keyof typeof UPLOAD_FOLDERS;

const ALLOWED_FORMATS = {
  image: "jpg,jpeg,png,webp,avif",
  video: "mp4,webm,mov",
} as const;

export interface UploadSignature {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
  allowedFormats: string;
  uploadUrl: string;
}

export function createUploadSignature(
  folderKey: UploadFolderKey,
  resourceType: "image" | "video",
): UploadSignature {
  const timestamp = Math.round(Date.now() / 1000);
  const folder = UPLOAD_FOLDERS[folderKey];
  const allowedFormats = ALLOWED_FORMATS[resourceType];

  // Every parameter signed here must be sent by the client verbatim, and the
  // client cannot add any others — Cloudinary rejects a mismatched signature.
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder, allowed_formats: allowedFormats },
    serverEnv.CLOUDINARY_API_SECRET,
  );

  return {
    signature,
    timestamp,
    apiKey: serverEnv.CLOUDINARY_API_KEY,
    cloudName: CLOUDINARY_CLOUD_NAME,
    folder,
    allowedFormats,
    uploadUrl: `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
  };
}

/** Removes an asset. Used when an admin deletes a product image. */
export async function destroyAsset(
  publicId: string,
  resourceType: "image" | "video" = "image",
): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType, invalidate: true });
}
