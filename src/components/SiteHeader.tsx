import { useState, useEffect, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";

const WHATSAPP_NUMBER = "919990649990";

type NavItem = { label: string; to: string; hash?: string; match: (path: string, hash: string) => boolean };

const NAV: NavItem[] = [
  { label: "Collection", to: "/", hash: "collection", match: (p, h) => p === "/" && h === "collection" },
  { label: "Benefits", to: "/benefits", match: (p) => p.startsWith("/benefits") },
  { label: "Workshops", to: "/workshops", match: (p) => p.startsWith("/workshops") },
  { label: "Story", to: "/", hash: "story", match: (p, h) => p === "/" && h === "story" },
];

export function SiteHeader({ rightSlot }: { rightSlot?: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { location } = useRouterState();
  const path = location.pathname;
  const hash = location.hash?.replace(/^#/, "") ?? "";

  useEffect(() => {
    setMobileOpen(false);
  }, [path, hash]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const isActive = (item: NavItem) => item.match(path, hash);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/40">
      <nav className="max-w-7xl mx-auto flex items-center justify-between gap-3 px-5 sm:px-6 md:px-10 py-4 md:py-5">
        <Link to="/" className="flex items-center gap-3 min-w-0 shrink group" aria-label="Mudkraft home">
          {/* Craft Seal Mark */}
          <span className="relative flex items-center justify-center shrink-0">
            <span
              className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shadow-sm overflow-hidden -rotate-6 transition-transform duration-500 group-hover:rotate-0"
              style={{ background: "var(--gradient-clay)" }}
            >
              <span
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: "radial-gradient(circle at center, #000 1px, transparent 1px)",
                  backgroundSize: "3px 3px",
                }}
              />
              <span className="relative font-display text-cream text-xl sm:text-2xl font-semibold leading-none -mt-0.5">
                M
              </span>
            </span>
            {/* Gold kiln mark dot */}
            <span
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background"
              style={{ backgroundColor: "var(--gold)" }}
            />
          </span>

          {/* Wordmark */}
          <span className="flex flex-col leading-none min-w-0">
            <span className="font-display text-earth text-2xl sm:text-3xl md:text-4xl font-medium tracking-tight leading-none whitespace-nowrap">
              Mud<span className="italic">kraft</span>
            </span>
            <span className="hidden sm:flex items-center gap-2 mt-1.5">
              <span className="h-px w-5 bg-clay/40" />
              <span className="text-[9px] uppercase tracking-[0.28em] text-earth/60 font-sans">
                Slow Craft Studio
              </span>
            </span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-10 text-sm text-muted-foreground">
          {NAV.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              hash={item.hash}
              className={`relative transition-colors ${
                isActive(item) ? "text-clay" : "hover:text-clay"
              }`}
            >
              {item.label}
              {isActive(item) && (
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-clay" />
              )}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {rightSlot}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-full border border-earth/30 text-earth hover:bg-earth hover:text-cream transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile sheet */}
      <div
        className={`md:hidden overflow-hidden transition-[max-height,opacity] duration-500 ease-out ${
          mobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-6 pb-8 pt-2 flex flex-col divide-y divide-border/40 border-t border-border/40 bg-background/95 backdrop-blur-md">
          {NAV.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              hash={item.hash}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center justify-between py-4 text-lg font-display tracking-tight ${
                isActive(item) ? "text-clay" : "text-earth"
              }`}
            >
              <span>{item.label}</span>
              <span className="text-xs tracking-widest uppercase text-muted-foreground">
                {isActive(item) ? "Now" : "→"}
              </span>
            </Link>
          ))}
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 text-center text-xs tracking-widest uppercase bg-earth text-cream px-5 py-3 rounded-full"
          >
            Enquire on WhatsApp
          </a>
        </div>
      </div>
    </header>
  );
}
