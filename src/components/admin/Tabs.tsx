"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Inbox,
  Layers,
  LayoutList,
  PhoneCall,
  XCircle,
  type LucideIcon,
} from "lucide-react";

/**
 * Icons are looked up by name rather than passed in as components, because the
 * pages that render these tabs are server components and a React component is a
 * function — it cannot be serialised across the server/client boundary.
 */
const TAB_ICONS = {
  all: Layers,
  list: LayoutList,
  live: CheckCircle2,
  warning: AlertTriangle,
  pending: Clock,
  rejected: XCircle,
  inbox: Inbox,
  phone: PhoneCall,
  calendar: CalendarCheck,
} satisfies Record<string, LucideIcon>;

export type TabIconName = keyof typeof TAB_ICONS;

export interface TabItem {
  /** Value written to the query parameter; empty string means "no filter". */
  value: string;
  label: string;
  icon?: TabIconName;
  count?: number;
  badge?: string;
}

/**
 * Underlined sub-tabs that drive a query parameter rather than a route, so the
 * page stays a single server component and each tab is a shareable URL.
 */
export function Tabs({
  param,
  items,
  ariaLabel = "Views",
}: {
  param: string;
  items: TabItem[];
  ariaLabel?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get(param) ?? "";

  const hrefFor = (value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(param, value);
    else next.delete(param);
    // Any filter change invalidates the current page of results.
    next.delete("page");
    const query = next.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  return (
    <nav aria-label={ariaLabel} className="flex flex-nowrap items-center gap-x-6 overflow-x-auto border-b border-earth/12">
      {items.map((item) => {
        const active = current === item.value;
        const Icon = item.icon ? TAB_ICONS[item.icon] : undefined;

        return (
          <Link
            key={item.value || "all"}
            href={hrefFor(item.value)}
            aria-current={active ? "page" : undefined}
            className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-1 pb-3 pt-2 text-sm transition-colors ${
              active
                ? "border-clay text-clay-deep"
                : "border-transparent text-earth/55 hover:text-earth"
            }`}
          >
            {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
            <span>{item.label}</span>
            {typeof item.count === "number" && (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] ${
                  active ? "bg-clay/15 text-clay-deep" : "bg-earth/8 text-earth/55"
                }`}
              >
                {item.count}
              </span>
            )}
            {item.badge && (
              <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-earth">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
