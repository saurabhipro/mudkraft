"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { cloudinaryThumb } from "@/lib/cloudinary";
import {
  addProductImage,
  removeProductImage,
  setPrimaryImage,
} from "@/server/actions/products";

interface ManagedImage {
  id: string;
  publicId: string;
  version: string | null;
  alt: string;
  isPrimary: boolean;
  resourceType: "image" | "video";
}

/** Rejected in the browser as a courtesy; Cloudinary enforces format server-side. */
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export function ImageManager({
  productSlug,
  images,
}: {
  productSlug: string;
  images: ManagedImage[];
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        if (file.size > MAX_UPLOAD_BYTES) {
          throw new Error(`${file.name} is larger than 10 MB.`);
        }

        // 1. Ask our server to sign the upload. The API secret stays server-side;
        //    the signature covers the folder and the format allowlist.
        const signResponse = await fetch("/api/cloudinary/sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folder: "products", resourceType: "image" }),
        });
        if (!signResponse.ok) {
          throw new Error("Could not get an upload signature. Are you still signed in?");
        }
        const sign = await signResponse.json();

        // 2. Upload straight to Cloudinary — the file never passes through our server.
        const form = new FormData();
        form.append("file", file);
        form.append("api_key", sign.apiKey);
        form.append("timestamp", String(sign.timestamp));
        form.append("signature", sign.signature);
        form.append("folder", sign.folder);
        form.append("allowed_formats", sign.allowedFormats);

        const uploadResponse = await fetch(sign.uploadUrl, { method: "POST", body: form });
        const uploaded = await uploadResponse.json();
        if (!uploadResponse.ok) {
          throw new Error(uploaded?.error?.message ?? "Cloudinary rejected the upload.");
        }

        // 3. Record it against the product.
        const result = await addProductImage({
          productSlug,
          publicId: uploaded.public_id,
          version: String(uploaded.version ?? ""),
          resourceType: "image",
          format: uploaded.format ?? null,
          width: uploaded.width ?? null,
          height: uploaded.height ?? null,
          alt: "",
        });
        if (!result.ok) throw new Error(result.error);
      }

      router.refresh();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  return (
    <div className="rounded-2xl border border-earth/15 bg-cream/40 p-6">
      <h2 className="text-xs tracking-[0.3em] uppercase text-clay">Images</h2>

      {images.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          No images yet. The first one uploaded becomes the primary.
        </p>
      ) : (
        <ul className="mt-5 flex flex-wrap gap-4">
          {images.map((image) => (
            <li key={image.id} className="w-36">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cloudinaryThumb(image.publicId, 288, image.version)}
                alt={image.alt}
                className={`w-36 h-36 rounded-xl object-cover bg-cream ${
                  image.isPrimary ? "ring-2 ring-earth" : ""
                }`}
              />
              <div className="mt-2 flex items-center justify-between text-[11px]">
                {image.isPrimary ? (
                  <span className="tracking-widest uppercase text-earth">Primary</span>
                ) : (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() =>
                      startTransition(async () => {
                        const result = await setPrimaryImage({ imageId: image.id, productSlug });
                        if (!result.ok) setError(result.error);
                        router.refresh();
                      })
                    }
                    className="tracking-widest uppercase text-clay hover:text-earth"
                  >
                    Make primary
                  </button>
                )}
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      const result = await removeProductImage({ imageId: image.id, productSlug });
                      if (!result.ok) setError(result.error);
                      router.refresh();
                    })
                  }
                  className="text-red-700/80 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6">
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          disabled={uploading}
          onChange={(e) => handleFiles(e.target.files)}
          className="block w-full text-sm text-earth/80 file:mr-4 file:rounded-full file:border-0 file:bg-earth file:px-5 file:py-2.5 file:text-xs file:uppercase file:tracking-widest file:text-cream hover:file:bg-clay disabled:opacity-60"
        />
        {uploading && <p className="mt-3 text-sm text-earth/70">Uploading…</p>}
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
