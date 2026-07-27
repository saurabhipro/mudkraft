"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ADMIN_NAV, isNavItemActive } from "./nav-items";

/**
 * Fixed left rail — icon over label, in the marketplace-console idiom.
 *
 * On small screens it becomes a horizontal scrolling strip below the top bar
 * rather than a hamburger: with only six destinations, hiding them behind a
 * menu costs more taps than it saves space.
 */
export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Admin sections"
      className="
        md:fixed md:inset-y-0 md:left-0 md:z-40 md:w-24 md:flex-col md:border-r md:border-earth/12
        md:bg-cream/40 md:pt-[4.25rem]
        flex w-full overflow-x-auto border-b border-earth/12 bg-cream/40
      "
    >
      <ul className="flex md:flex-col md:gap-1 md:py-4 md:px-2">
        {ADMIN_NAV.map((item) => {
          const active = isNavItemActive(item, pathname);
          const Icon = item.icon;

          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`
                  relative flex flex-col items-center justify-center gap-1.5
                  px-4 py-3 md:px-2 md:py-3.5 md:rounded-xl
                  text-[10px] tracking-wider uppercase transition-colors
                  ${
                    active
                      ? "text-clay-deep md:bg-clay/12"
                      : "text-earth/55 hover:text-earth md:hover:bg-earth/5"
                  }
                `}
              >
                {/* Accent bar: bottom on the mobile strip, left on the desktop rail. */}
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute md:left-0 md:top-1/2 md:h-7 md:w-[3px] md:-translate-y-1/2 md:rounded-r-full
                               bottom-0 left-1/2 h-[3px] w-8 -translate-x-1/2 rounded-t-full md:translate-x-0
                               bg-clay"
                  />
                )}
                <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.7} aria-hidden="true" />
                <span className="whitespace-nowrap">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
