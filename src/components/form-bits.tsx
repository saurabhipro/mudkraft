import type { ReactNode } from "react";

/** The site's text-box look: cream fill, hairline border, clay on focus. */
export const inputCls =
  "w-full bg-cream/60 border border-border rounded-xl px-4 py-3 text-earth placeholder:text-muted-foreground/70 focus:outline-none focus:border-clay transition";

/** A labelled form field: small clay caps over the control. */
export function Field({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-[11px] tracking-[0.3em] uppercase text-clay">
        {label}
        {hint && <span className="normal-case tracking-normal text-muted-foreground"> {hint}</span>}
      </span>
      <div className="mt-2">{children}</div>
    </label>
  );
}
