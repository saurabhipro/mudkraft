/**
 * The studio's group photographs of the whole range (public/media/range). Each is served as
 * WebP at its full width and at 800 px, so a phone never downloads the large file; a photo
 * with an upright version (`tall`) shows that one on narrow screens instead.
 */

export type RangeShot = "ledge" | "grass" | "grass-low";

const SHOTS: Record<
  RangeShot,
  { wide: string; w: number; h: number; tall?: { src: string; w: number; h: number } }
> = {
  ledge: {
    wide: "/media/range/ledge-wide",
    w: 1280,
    h: 853,
    tall: { src: "/media/range/ledge-tall.webp", w: 853, h: 1280 },
  },
  grass: { wide: "/media/range/grass-wide", w: 1280, h: 721 },
  "grass-low": { wide: "/media/range/grass-low", w: 1280, h: 721 },
};

export function RangePhoto({
  shot,
  alt,
  className = "",
  sizes = "100vw",
  priority = false,
}: {
  shot: RangeShot;
  alt: string;
  /** Applied to the <img>; set its aspect ratio and object-fit here. */
  className?: string;
  sizes?: string;
  /** Above the fold: load at once instead of when scrolled near. */
  priority?: boolean;
}) {
  const s = SHOTS[shot];
  return (
    <picture>
      {s.tall && (
        <source media="(max-width: 639px)" srcSet={s.tall.src} width={s.tall.w} height={s.tall.h} />
      )}
      <img
        src={`${s.wide}.webp`}
        srcSet={`${s.wide}-800.webp 800w, ${s.wide}.webp ${s.w}w`}
        sizes={sizes}
        width={s.w}
        height={s.h}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className={className}
      />
    </picture>
  );
}
