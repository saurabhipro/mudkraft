"use client";

import { useRef, useState, type ReactNode } from "react";

const LENS = 190; // px across
const ZOOM = 2.6;

/**
 * A round magnifying lens that follows the mouse over a product photo. Wrap the photo's stage in it:
 * the lens finds the stage's <img>, works out where the picture itself sits inside it (object-contain
 * leaves margins), and shows that spot enlarged. Mouse only: on touch nothing changes.
 *
 * `blend` mirrors ClayPlinth: ordinary photos are multiplied into the ivory stage, cutouts are not.
 */
export function ZoomLens({
  src,
  blend,
  children,
}: {
  src: string | null;
  blend: boolean;
  children: ReactNode;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [lens, setLens] = useState<{ x: number; y: number; bg: string; pos: string } | null>(null);

  function move(e: React.PointerEvent) {
    if (e.pointerType !== "mouse" || !src || !box.current) return;
    const img = box.current.querySelector("img");
    if (!img || !img.naturalWidth) return setLens(null);
    const r = img.getBoundingClientRect();
    // The rendered picture inside the <img> box: object-contain, sat on the bottom edge.
    const k = Math.min(r.width / img.naturalWidth, r.height / img.naturalHeight);
    const w = img.naturalWidth * k;
    const h = img.naturalHeight * k;
    const left = r.left + (r.width - w) / 2;
    const top = r.bottom - h;
    const px = e.clientX - left;
    const py = e.clientY - top;
    if (px < 0 || py < 0 || px > w || py > h) return setLens(null);
    const outer = box.current.getBoundingClientRect();
    setLens({
      x: e.clientX - outer.left,
      y: e.clientY - outer.top,
      bg: `${w * ZOOM}px ${h * ZOOM}px`,
      pos: `${LENS / 2 - px * ZOOM}px ${LENS / 2 - py * ZOOM}px`,
    });
  }

  return (
    <div
      ref={box}
      className={`relative ${lens ? "cursor-none" : ""}`}
      onPointerMove={move}
      onPointerLeave={() => setLens(null)}
    >
      {children}
      {lens && src && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute z-20 rounded-full border-2 border-gold/80 shadow-[0_18px_40px_-14px_oklch(0.2_0.05_18/0.55),inset_0_0_0_1px_oklch(1_0_0/0.6)]"
          style={{
            width: LENS,
            height: LENS,
            left: lens.x - LENS / 2,
            top: lens.y - LENS / 2,
            backgroundColor: "var(--ivory)",
            backgroundImage: `url("${src}")`,
            backgroundRepeat: "no-repeat",
            backgroundSize: lens.bg,
            backgroundPosition: lens.pos,
            backgroundBlendMode: blend ? "multiply" : "normal",
          }}
        />
      )}
    </div>
  );
}
