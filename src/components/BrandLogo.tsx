import logo from "@/assets/mudkraft-logo.png";

/**
 * The Mudkraft badge — cream ring lettered MUDKRAFT around the clay "M" seal.
 * Rendered from the official mudkraft-logo.pdf, so use this rather than
 * redrawing the mark. Every caller pairs it with a visible or aria-labelled
 * "Mudkraft", so the image is hidden from screen readers (the name is announced
 * once) while its alt still names it for search engines.
 */
export function BrandLogo({ className = "", alt = "Mudkraft logo" }: { className?: string; alt?: string }) {
  return (
    <img
      src={logo.src}
      width={256}
      height={256}
      alt={alt}
      aria-hidden="true"
      decoding="async"
      className={`shrink-0 rounded-full ${className}`}
    />
  );
}
