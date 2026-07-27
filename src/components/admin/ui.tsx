import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Presentational primitives shared by every admin page. All server-safe — no
 * hooks — so pages can stay server components and only opt into client
 * behaviour where they genuinely need it.
 */

// ---------------------------------------------------------------- page header

export function PageHeader({
  breadcrumb,
  title,
  description,
  actions,
}: {
  breadcrumb?: Array<{ label: string; href?: string }>;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6">
      {breadcrumb && breadcrumb.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-2 flex flex-wrap items-center gap-1.5 text-xs text-earth/50">
          {breadcrumb.map((crumb, index) => (
            <span key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-earth">
                  {crumb.label}
                </Link>
              ) : (
                <span>{crumb.label}</span>
              )}
              {index < breadcrumb.length - 1 && <span aria-hidden="true">›</span>}
            </span>
          ))}
        </nav>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl leading-tight text-earth md:text-4xl">{title}</h1>
          {description && (
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
      </div>
    </div>
  );
}

// --------------------------------------------------------------------- badges

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info" | "solid";

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: "bg-earth/8 text-earth/70 ring-earth/15",
  success: "bg-emerald-50 text-emerald-800 ring-emerald-600/20",
  warning: "bg-amber-50 text-amber-900 ring-amber-600/25",
  danger: "bg-red-50 text-red-800 ring-red-600/20",
  info: "bg-clay/12 text-clay-deep ring-clay/25",
  solid: "bg-earth text-cream ring-earth",
};

export function StatusBadge({
  tone = "neutral",
  children,
}: {
  tone?: BadgeTone;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-medium capitalize ring-1 ring-inset ${BADGE_TONES[tone]}`}
    >
      {children}
    </span>
  );
}

/** Maps a product status to its pill tone. */
export function productStatusTone(status: string): BadgeTone {
  if (status === "active") return "success";
  if (status === "draft") return "warning";
  return "neutral";
}

export function orderStatusTone(status: string): BadgeTone {
  if (status === "delivered") return "success";
  if (status === "cancelled" || status === "refunded") return "danger";
  if (status === "pending") return "warning";
  return "info";
}

export function reviewStatusTone(status: string): BadgeTone {
  if (status === "approved") return "success";
  if (status === "rejected") return "danger";
  return "warning";
}

// ---------------------------------------------------------------------- panel

export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-earth/12 bg-background ${className}`}>{children}</div>
  );
}

/** Bar above a table holding search and filter controls. */
export function Toolbar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-earth/10 px-4 py-3">
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------- table

export function Table({ children, minWidth = 900 }: { children: ReactNode; minWidth?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-cream/50 text-left text-[11px] font-normal tracking-wider uppercase text-earth/55">
      {children}
    </thead>
  );
}

export function TH({
  children,
  align = "left",
  className = "",
}: {
  children?: ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
}) {
  const alignment =
    align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";
  return <th className={`px-4 py-3 font-normal ${alignment} ${className}`}>{children}</th>;
}

export function TR({ children }: { children: ReactNode }) {
  return <tr className="border-t border-earth/8 align-middle transition-colors hover:bg-cream/30">{children}</tr>;
}

export function TD({
  children,
  align = "left",
  className = "",
}: {
  children?: ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
}) {
  const alignment =
    align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";
  return <td className={`px-4 py-3 ${alignment} ${className}`}>{children}</td>;
}

/**
 * The two-line identity cell borrowed from marketplace consoles: thumbnail,
 * human name, and the machine identifier underneath. Scanning a long table for
 * a SKU is far faster when it sits in a fixed position rather than its own
 * column.
 */
export function IdentityCell({
  image,
  title,
  subtitle,
  href,
}: {
  image?: string | null;
  title: ReactNode;
  subtitle?: ReactNode;
  href?: string;
}) {
  const body = (
    <span className="flex items-center gap-3">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="h-11 w-11 shrink-0 rounded-lg bg-cream object-cover" />
      ) : (
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-earth/6 text-[9px] text-earth/35">
          no image
        </span>
      )}
      <span className="min-w-0">
        <span className="block truncate text-earth group-hover:text-clay">{title}</span>
        {subtitle && (
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">{subtitle}</span>
        )}
      </span>
    </span>
  );

  return href ? (
    <Link href={href} className="group block">
      {body}
    </Link>
  ) : (
    body
  );
}

// ----------------------------------------------------------------- empty state

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="px-6 py-16 text-center">
      <p className="font-display text-2xl text-earth">{title}</p>
      {description && (
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

// --------------------------------------------------------------------- buttons

export function PrimaryButton({
  children,
  href,
  type = "button",
  ...rest
}: {
  children: ReactNode;
  href?: string;
  type?: "button" | "submit";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const className =
    "inline-flex items-center gap-2 rounded-full bg-earth px-5 py-2.5 text-xs tracking-wider uppercase text-cream transition-colors hover:bg-clay disabled:opacity-60";
  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} className={className} {...rest}>
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  href,
  ...rest
}: {
  children: ReactNode;
  href?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const className =
    "inline-flex items-center gap-2 rounded-full border border-earth/25 px-5 py-2.5 text-xs tracking-wider uppercase text-earth transition-colors hover:bg-earth hover:text-cream disabled:opacity-60";
  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={className} {...rest}>
      {children}
    </button>
  );
}
