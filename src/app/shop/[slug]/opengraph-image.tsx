import { readFile } from "node:fs/promises";
import path from "node:path";

import { ImageResponse } from "next/og";

import { displayImage, toProductView } from "@/lib/product-view";
import { getProductBySlug } from "@/server/store/products";

/**
 * The card WhatsApp, Facebook and X show when a product link is shared: the
 * piece on a light plate, its name and price, and the Mudkraft seal. Sent as a
 * small JPEG — product photos are often WebP, which WhatsApp will not preview.
 */

export const alt = "A handmade clay piece from Mudkraft";
export const size = { width: 1200, height: 630 };
export const contentType = "image/jpeg";

// Loaded on use, so a missing native binary costs the share photo, never the product page.
async function loadSharp() {
  try {
    return (await import("sharp")).default;
  } catch {
    return null;
  }
}

async function asPng(url: string): Promise<string | null> {
  const sharp = await loadSharp();
  try {
    if (!sharp) return /\.(png|jpe?g)(\?|$)/i.test(url) ? url : null;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const png = await sharp(Buffer.from(await res.arrayBuffer()))
      .resize(900, 900, { fit: "inside", withoutEnlargement: true })
      .flatten({ background: "#ffffff" })
      .png()
      .toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    return null;
  }
}

async function cormorant(): Promise<ArrayBuffer | null> {
  try {
    const css = await (
      await fetch("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500")
    ).text();
    const src = /src:\s*url\(([^)]+)\)\s*format\('(?:truetype|opentype)'\)/.exec(css)?.[1];
    return src ? await (await fetch(src)).arrayBuffer() : null;
  } catch {
    return null;
  }
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  const view = product ? toProductView(product) : null;

  const [photo, font, logo] = await Promise.all([
    view && displayImage(view) ? asPng(displayImage(view)!) : null,
    cormorant(),
    readFile(path.join(process.cwd(), "public/mudkraft-logo.png")),
  ]);
  const display = font ? "Cormorant" : undefined;

  const card = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 56,
          padding: "0 70px",
          background: "radial-gradient(circle at 70% 45%, #4a2516 0%, #21130d 55%, #160d09 100%)",
          color: "#f3e9d8",
        }}
      >
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <img
            src={`data:image/png;base64,${logo.toString("base64")}`}
            width={112}
            height={112}
            alt=""
          />
          <div
            style={{
              marginTop: 34,
              fontSize: 22,
              letterSpacing: 5,
              textTransform: "uppercase",
              color: "#e0b08a",
            }}
          >
            {view?.category ?? "Handmade clay"}
          </div>
          <div
            style={{
              marginTop: 10,
              fontSize: (view?.name.length ?? 0) > 16 ? 72 : 92,
              lineHeight: 1,
              fontFamily: display,
            }}
          >
            {view?.name ?? "Mudkraft"}
          </div>
          {view?.sizeLabel && (
            <div style={{ marginTop: 12, fontSize: 30, color: "rgba(243,233,216,0.7)" }}>
              {view.sizeLabel}
            </div>
          )}
          <div style={{ marginTop: 34, display: "flex", alignItems: "center", gap: 20 }}>
            {view && (
              <div
                style={{
                  padding: "12px 26px",
                  borderRadius: 999,
                  background: "#b4532a",
                  color: "#fff",
                  fontSize: 34,
                }}
              >
                {view.price}
              </div>
            )}
            <div style={{ fontSize: 24, color: "rgba(243,233,216,0.7)" }}>www.mudkraft.com</div>
          </div>
        </div>
        <div
          style={{
            width: 470,
            height: 470,
            borderRadius: 999,
            // Pure white like the photos' own ground, warmed only at the rim, so no box shows.
            background: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            boxShadow: "0 40px 80px -20px rgba(0,0,0,0.8), inset 0 0 36px rgba(170,110,60,0.3)",
          }}
        >
          {photo && (
            <img
              src={photo}
              alt=""
              style={{ width: "64%", height: "64%", objectFit: "contain" }}
            />
          )}
        </div>
      </div>
    ),
    { ...size, fonts: font ? [{ name: "Cormorant", data: font, weight: 500 }] : undefined },
  );

  const sharp = await loadSharp();
  if (!sharp) return card;
  const jpeg = await sharp(Buffer.from(await card.arrayBuffer())).jpeg({ quality: 82 }).toBuffer();
  return new Response(new Uint8Array(jpeg), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=3600" },
  });
}
