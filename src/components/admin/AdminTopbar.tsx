"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, ExternalLink, Search } from "lucide-react";

import { authClient } from "@/lib/auth-client";

/**
 * Sticky top bar: wordmark, global product search, account menu.
 *
 * The search is deliberately real rather than decorative — it routes to the
 * products list with a `q` filter, which is the only search the admin panel
 * currently has data to answer.
 */
export function AdminTopbar({ email, name }: { email: string; name: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-earth/12 bg-background/95 backdrop-blur">
      <div className="flex h-[4.25rem] items-center gap-4 px-4 md:px-6">
        <Link href="/admin" className="flex shrink-0 items-center gap-2.5">
          <span
            className="grid h-9 w-9 -rotate-6 place-items-center rounded-full font-display text-lg text-cream"
            style={{ background: "var(--gradient-clay)" }}
          >
            M
          </span>
          <span className="hidden font-display text-xl leading-none text-earth sm:block">
            Mudkraft <span className="italic text-clay">admin</span>
          </span>
        </Link>

        <form
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            const trimmed = query.trim();
            router.push(trimmed ? `/admin/products?q=${encodeURIComponent(trimmed)}` : "/admin/products");
          }}
          className="relative mx-auto hidden w-full max-w-xl sm:block"
        >
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-earth/40"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products by name or SKU"
            aria-label="Search products"
            className="w-full rounded-full border border-earth/15 bg-cream/50 py-2.5 pl-11 pr-4 text-sm text-earth placeholder:text-earth/40 focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/20"
          />
        </form>

        <div className="ml-auto flex items-center gap-2 sm:gap-4">
          <Link
            href="/"
            target="_blank"
            className="hidden items-center gap-1.5 text-xs tracking-wider uppercase text-earth/60 hover:text-earth sm:inline-flex"
          >
            View site
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>

          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              className="flex items-center gap-2 rounded-full border border-earth/15 py-1.5 pl-1.5 pr-3 text-sm text-earth transition-colors hover:bg-cream/70"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-clay/25 text-xs font-medium text-earth">
                {(name || email).charAt(0).toUpperCase()}
              </span>
              <span className="hidden max-w-[9rem] truncate sm:block">{name || email}</span>
              <ChevronDown className="h-4 w-4 text-earth/50" aria-hidden="true" />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-56 rounded-2xl border border-earth/15 bg-background p-2 shadow-lg"
              >
                <div className="truncate border-b border-earth/10 px-3 py-2 text-xs text-muted-foreground">
                  {email}
                </div>
                <Link
                  href="/"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-xl px-3 py-2.5 text-sm text-earth hover:bg-cream/70"
                >
                  Go to storefront
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  onClick={async () => {
                    setMenuOpen(false);
                    await authClient.signOut();
                    router.push("/");
                    router.refresh();
                  }}
                  className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-earth hover:bg-cream/70"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
