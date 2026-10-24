"use client";

import { useState, useEffect, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import { WHATSAPP_NUMBER } from "@/lib/whatsapp";

import { BrandLogo } from "./BrandLogo";
import { HeaderAccount } from "./HeaderAccount";

type NavItem = { label: string; href: string; match: (path: string, hash: string) => boolean };

const NAV: NavItem[] = [
  { label: "Collection", href: "/#collection", match: (p, h) => p === "/" && h === "collection" },
  { label: "Benefits", href: "/benefits", match: (p) => p.startsWith("/benefits") },
  { label: "Workshops", href: "/workshops", match: (p) => p.startsWith("/workshops") },
  { label: "Story", href: "/#story", match: (p, h) => p === "/" && h === "story" },
  {
    label: "Videos",
    href: "/#videos",
    match: (p, h) => (p === "/" && h === "videos") || p.startsWith("/videos"),
  },
];

// next/navigation exposes the path but not the fragment, and the active-nav dots
// key off the fragment, so read it from the browser directly. Route changes that
// only swap the fragment arrive via pushState rather than "hashchange", but those
// also re-render this component, at which point the snapshot is re-read.
function subscribeToHash(onStoreChange: () => void) {
  window.addEventListener("hashchange", onStoreChange);
  return () => window.removeEventListener("hashchange", onStoreChange);
}

const getHashSnapshot = () => window.location.hash.replace(/^#/, "");
const getServerHashSnapshot = () => "";

function useHash() {
  return useSyncExternalStore(subscribeToHash, getHashSnapshot, getServerHashSnapshot);
}

export function SiteHeader({
  rightSlot,
  cartCount,
  onCartOpen,
}: {
  rightSlot?: ReactNode;
  /** When provided, the mobile hamburger shows a count badge and the sheet gains a Cart entry. */
  cartCount?: number;
  onCartOpen?: () => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const path = usePathname();
  const hash = useHash();

  // Collapse the mobile sheet whenever the route changes, including navigations
  // that start outside this component (browser back, in-page fragment links).
  const route = `${path}#${hash}`;
  const [renderedRoute, setRenderedRoute] = useState(route);
  if (route !== renderedRoute) {
    setRenderedRoute(route);
    setMobileOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    if (mobileOpen) document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen]);

  const isActive = (item: NavItem) => item.match(path, hash);

  return (
    <header className="fixed top-3 md:top-5 left-0 right-0 z-50 px-3 sm:px-5 animate-fade-up">
      <nav
        aria-label="Main"
        className="max-w-7xl mx-auto flex items-center justify-between gap-3 pl-4 pr-2 sm:pl-6 py-2 rounded-full bg-cream/80 backdrop-blur-xl border border-earth/10 shadow-[0_20px_50px_-30px_rgba(30,22,18,0.55)]"
      >
        <Link
          href="/"
          className="flex items-center gap-2.5 min-w-0 shrink group"
          aria-label="Mudkraft home"
        >
          {/* Slightly larger than the bar, so the badge sits on it like a sticker. */}
          <BrandLogo className="w-12 h-12 sm:w-14 sm:h-14 -my-2 -ml-2 sm:-ml-3 drop-shadow-[0_6px_10px_rgba(59,42,34,0.3)] transition-transform duration-700 ease-[var(--ease-clay)] group-hover:-rotate-12 group-hover:scale-105" />
          <span className="font-display text-earth text-2xl sm:text-[1.7rem] font-medium tracking-tight leading-none whitespace-nowrap">
            Mud<span className="italic">kraft</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-[12px] tracking-[0.14em] uppercase text-earth">
          {NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              aria-current={isActive(item) ? "page" : undefined}
              className={`mk-link transition-colors ${isActive(item) ? "text-clay-deep" : "hover:text-clay-deep"}`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {rightSlot}
          <HeaderAccount />
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            className="md:hidden relative inline-flex items-center justify-center w-11 h-11 rounded-full bg-earth text-cream"
          >
            <Menu className="w-5 h-5" />
            {typeof cartCount === "number" && cartCount > 0 && (
              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-clay text-cream text-[10px] font-medium border border-cream">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile sheet: clay floods out from the menu button, then the links rise in. */}
      {mobileOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="md:hidden fixed inset-0 z-[60] bg-clay text-cream grain flex flex-col px-7 pt-6 pb-[max(2rem,env(safe-area-inset-bottom))] overflow-y-auto animate-sheet-open"
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-3 font-display text-2xl font-medium">
              <BrandLogo className="w-12 h-12" />
              <span>
                Mud<span className="italic">kraft</span>
              </span>
            </span>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-cream text-ink"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-16 flex flex-col gap-1">
            {NAV.map((item, i) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                aria-current={isActive(item) ? "page" : undefined}
                className="font-display text-[3.25rem] leading-[1.08] tracking-tight"
              >
                <span className="mk-line">
                  <span style={{ animationDelay: `${0.25 + i * 0.08}s` }}>
                    {isActive(item) ? <em>{item.label}</em> : item.label}
                  </span>
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-auto pt-10 flex flex-col gap-3 animate-fade-up [animation-delay:0.6s]">
            {onCartOpen && (
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  onCartOpen();
                }}
                className="inline-flex items-center justify-center gap-2 min-h-[54px] text-xs tracking-widest uppercase bg-cream text-ink rounded-full"
              >
                Basket
                <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-clay text-cream text-[11px] font-medium">
                  {cartCount ?? 0}
                </span>
              </button>
            )}
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center min-h-[54px] text-xs tracking-widest uppercase bg-ink text-cream rounded-full"
            >
              Enquire on WhatsApp
            </a>
            <p className="mt-2 text-center font-hand text-2xl text-cream/85">
              shaped by hand, held by earth
            </p>
          </div>
        </div>
      )}
    </header>
  );
}
