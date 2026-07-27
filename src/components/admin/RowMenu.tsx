"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MoreVertical } from "lucide-react";

export interface RowMenuItem {
  label: string;
  href?: string;
  onSelect?: () => void;
  danger?: boolean;
  disabled?: boolean;
}

/**
 * The per-row kebab menu. Secondary actions live here so the Actions column
 * shows one obvious primary action instead of a row of competing links.
 */
export function RowMenu({ items, label = "Row actions" }: { items: RowMenuItem[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (items.length === 0) return null;

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={label}
        className="grid h-8 w-8 place-items-center rounded-full text-earth/45 transition-colors hover:bg-earth/8 hover:text-earth"
      >
        <MoreVertical className="h-4 w-4" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-1 w-52 rounded-xl border border-earth/15 bg-background p-1.5 shadow-lg"
        >
          {items.map((item) => {
            const className = `block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
              item.disabled
                ? "cursor-not-allowed text-earth/30"
                : item.danger
                  ? "text-red-700 hover:bg-red-50"
                  : "text-earth hover:bg-cream/70"
            }`;

            if (item.href && !item.disabled) {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={className}
                >
                  {item.label}
                </Link>
              );
            }

            return (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false);
                  item.onSelect?.();
                }}
                className={className}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
