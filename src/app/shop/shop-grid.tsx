"use client";

import { useState } from "react";

import { FamilyCard, SortPills, sortFamilies, type SortKey } from "@/app/home-page";
import type { ProductFamily } from "@/lib/product-view";

const ALL = "all";

/** The shop's grid: category tiles that filter in place, the sort pills, and the collection cards. */
export function ShopGrid({ families }: { families: ProductFamily[] }) {
  const [category, setCategory] = useState(ALL);
  const [sort, setSort] = useState<SortKey>("featured");

  // One tile per category Bikriup has products in, pictured by its first piece.
  const names = [...new Set(families.flatMap((f) => f.categories))];
  const cover = (list: ProductFamily[]) => {
    const p = list.flatMap((f) => f.sizes).find((s) => s.cutout || s.img);
    return p ? { src: p.cutout ?? p.img!, cutout: Boolean(p.cutout) } : null;
  };
  const tiles = [
    { id: ALL, label: "All pieces", list: families },
    ...names.map((name) => ({
      id: name,
      label: name,
      list: families.filter((f) => f.categories.includes(name)),
    })),
  ];

  const shown = sortFamilies(
    category === ALL ? families : families.filter((f) => f.categories.includes(category)),
    sort,
  );

  return (
    <>
      {tiles.length > 2 && (
        <div
          role="group"
          aria-label="Filter by category"
          className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          {tiles.map((t) => {
            const on = t.id === category;
            const img = cover(t.list);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setCategory(t.id)}
                aria-pressed={on}
                className={`flex items-center gap-4 rounded-3xl border p-2.5 pr-5 text-left transition-colors ${
                  on
                    ? "border-earth bg-earth text-cream"
                    : "border-border bg-[oklch(0.985_0.008_75)] text-earth hover:border-clay"
                }`}
              >
                <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-sand">
                  {img && (
                    <img
                      src={img.src}
                      alt={`${t.label}: handmade clay by Mudkraft`}
                      loading="lazy"
                      className={`h-12 w-12 object-contain ${img.cutout ? "" : "mix-blend-multiply brightness-[1.06]"}`}
                    />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-2xl leading-none">{t.label}</span>
                  <span className={`text-xs ${on ? "text-cream/70" : "text-muted-foreground"}`}>
                    {t.list.length} {t.list.length === 1 ? "piece" : "pieces"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      <section aria-label="All products" className="mt-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[13px] text-muted-foreground" aria-live="polite">
            Showing {shown.length} {shown.length === 1 ? "piece" : "pieces"}
          </p>
          <SortPills value={sort} onChange={setSort} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((f) => (
            <FamilyCard key={f.key} family={f} />
          ))}
        </div>
      </section>
    </>
  );
}
