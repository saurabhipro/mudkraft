import logo from "@/assets/mudkraft-logo.png";

/**
 * The Mudkraft badge — cream ring lettered MUDKRAFT around the clay "M" seal.
 * Rendered from the official mudkraft-logo.pdf, so use this rather than
 * redrawing the mark. Decorative by default: callers pair it with a visible or
 * aria-labelled "Mudkraft" so the name is announced once.
 */
export function BrandLogo({ className = "", alt = "" }: { className?: string; alt?: string }) {
  return (
    <img
      src={logo.src}
      width={256}
      height={256}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      decoding="async"
      className={`shrink-0 rounded-full ${className}`}
    />
  );
}
