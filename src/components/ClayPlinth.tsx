import type { ProductView } from "@/lib/product-view";

/**
 * A piece standing on a clay plinth: the look shared by the collection card, the
 * product page and the related cards. Fill the parent; size it there.
 *
 * Cutouts stand on the plinth as they are. Ordinary photos are shot on white, so
 * they are blended into the clay (multiply, lifted a touch so an off-white
 * backdrop goes fully white) instead of sitting there as a pale rectangle.
 */
export function ClayPlinth({
  product,
  src,
  alt,
  priority = false,
  low = false,
  className = "",
}: {
  product: ProductView;
  /** A gallery photo to show instead of the product's own picture. */
  src?: string | null;
  alt?: string;
  priority?: boolean;
  /** Stand the piece lower, leaving the top of the frame for a caption. */
  low?: boolean;
  className?: string;
}) {
  const image = src ?? product.cutout ?? product.img;
  const cutout = !src ? Boolean(product.cutout) : src === product.cutout;
  return (
    <div className={`mk-stage absolute inset-0 ${className}`}>
      <span
        aria-hidden="true"
        className="absolute inset-x-[12%] bottom-[8%] h-[17%] rounded-[50%] bg-[oklch(0.88_0.045_83/0.55)] blur-[2px]"
      />
      <span
        aria-hidden="true"
        className="absolute inset-x-[22%] bottom-[13%] h-[7%] rounded-[50%] bg-[oklch(0.31_0.1_21/0.28)] blur-md transition-[transform,opacity] duration-1000 ease-[var(--ease-clay)] group-hover:scale-[0.86] group-hover:opacity-70"
      />
      {image ? (
        <img
          key={image}
          src={image}
          alt={alt || product.imageAlts[image] || `${product.name} ${product.sizeLabel} – unglazed clay, handmade in Khurja`.replace(/\s+/g, " ")}
          loading={priority ? "eager" : "lazy"}
          className={`absolute left-[14%] ${low ? "top-[30%] h-[56%]" : "top-[16%] h-[68%]"} w-[72%] object-contain object-bottom transition-transform duration-1000 ease-[var(--ease-clay)] group-hover:-translate-y-2 group-hover:scale-[1.04] ${
            cutout ? "" : "mix-blend-multiply brightness-[1.06] contrast-[1.06]"
          } ${product.stockQty <= 0 ? "opacity-60" : ""}`}
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center font-hand text-2xl text-earth/40">
          photograph coming soon
        </div>
      )}
    </div>
  );
}

/**
 * What the round badge says for a size label: a capacity ("4 L" → 4 L / holds),
 * a set ("Set of 6" → 6 / pieces) or a short size. Long labels get no badge: a
 * circle cannot hold them.
 */
export function badgeFor(size: string): { value: string; label: string } | null {
  const label = size.trim();
  const set = label.match(/^(?:set\s+of\s+)?(\d+)\s*(?:pcs?|pieces?)?$/i) ?? label.match(/^set\s+of\s+(\d+)\b/i);
  if (set) return { value: set[1], label: /set/i.test(label) ? "in a set" : "pieces" };
  const volume = label.match(/^(\d+(?:\.\d+)?)\s*(l|ltr|litres?|liters?|ml)$/i);
  if (volume) return { value: `${volume[1]} ${/^ml$/i.test(volume[2]) ? "ml" : "L"}`, label: "holds" };
  return /\d/.test(label) && label.length <= 5 ? { value: label, label: "size" } : null;
}

/** The round size badge in the corner of the plinth: "4 L / holds", "6 / in a set". */
export function HoldsBadge({ size, className = "" }: { size: string; className?: string }) {
  const badge = badgeFor(size);
  if (!badge) return null;
  return (
    <span
      className={`pointer-events-none absolute flex flex-col items-center justify-center rounded-full bg-earth text-gold-light leading-none shadow-[0_10px_24px_-10px_oklch(0.2_0.05_18/0.7),inset_0_0_0_1px_oklch(0.73_0.115_85/0.35)] ${className}`}
    >
      <span className={`whitespace-nowrap font-display font-medium ${badge.value.length > 4 ? "text-[0.8em]" : ""}`}>{badge.value}</span>
      <span className="mt-[3px] whitespace-nowrap text-[8px] uppercase tracking-[0.18em] text-gold">{badge.label}</span>
    </span>
  );
}
