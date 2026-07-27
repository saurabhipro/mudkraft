"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { Search, X } from "lucide-react";

/**
 * Filter state lives in the URL, not in React state.
 *
 * That makes a filtered view shareable, bookmarkable and survivable across a
 * refresh, and it lets the page stay a server component that simply reads
 * searchParams — no client-side data fetching required.
 */
function useSetParam() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const setParam = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") next.delete(key);
        else next.set(key, value);
      }
      const query = next.toString();
      startTransition(() => router.push(query ? `${pathname}?${query}` : pathname));
    },
    [pathname, router, searchParams],
  );

  return { setParam, isPending, searchParams };
}

export function SearchField({
  name = "q",
  placeholder = "Search",
  label,
}: {
  name?: string;
  placeholder?: string;
  label?: string;
}) {
  const { setParam, searchParams, isPending } = useSetParam();
  const current = searchParams.get(name) ?? "";
  const [value, setValue] = useState(current);

  // Keep the input in step when the URL changes from elsewhere (e.g. a reset).
  const [lastSynced, setLastSynced] = useState(current);
  if (current !== lastSynced) {
    setLastSynced(current);
    setValue(current);
  }

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        setParam({ [name]: value.trim() || null });
      }}
      className="relative min-w-[14rem] flex-1 sm:max-w-xs"
    >
      {label && <span className="sr-only">{label}</span>}
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-earth/40"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        aria-label={label ?? placeholder}
        disabled={isPending}
        className="w-full rounded-full border border-earth/15 bg-background py-2 pl-10 pr-9 text-sm text-earth placeholder:text-earth/40 focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/20"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            setValue("");
            setParam({ [name]: null });
          }}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-earth/40 hover:text-earth"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </form>
  );
}

export function FilterSelect({
  name,
  label,
  options,
  allLabel = "All",
}: {
  name: string;
  label: string;
  options: Array<{ value: string; label: string }>;
  allLabel?: string;
}) {
  const { setParam, searchParams, isPending } = useSetParam();
  const value = searchParams.get(name) ?? "";

  return (
    <label className="inline-flex items-center gap-2">
      <span className="text-[11px] tracking-wider uppercase text-earth/50">{label}</span>
      <select
        value={value}
        disabled={isPending}
        onChange={(event) => setParam({ [name]: event.target.value || null })}
        className="rounded-full border border-earth/15 bg-background px-3 py-2 text-sm text-earth focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/20"
      >
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Segmented control, in the `Created | Edited` idiom. */
export function Segmented({
  name,
  label,
  options,
}: {
  name: string;
  label?: string;
  options: Array<{ value: string; label: string }>;
}) {
  const { setParam, searchParams, isPending } = useSetParam();
  const value = searchParams.get(name) ?? options[0]?.value ?? "";

  return (
    <div className="inline-flex items-center gap-2">
      {label && <span className="text-[11px] tracking-wider uppercase text-earth/50">{label}</span>}
      <div className="inline-flex overflow-hidden rounded-full border border-earth/15">
        {options.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              disabled={isPending}
              aria-pressed={active}
              onClick={() => setParam({ [name]: option.value })}
              className={`px-4 py-2 text-xs transition-colors ${
                active ? "bg-earth text-cream" : "bg-background text-earth hover:bg-cream/70"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Clears every filter at once; only rendered when something is set. */
export function ResetFilters({ keys }: { keys: string[] }) {
  const { setParam, searchParams } = useSetParam();
  const hasAny = keys.some((key) => searchParams.get(key));
  if (!hasAny) return null;

  return (
    <button
      type="button"
      onClick={() => setParam(Object.fromEntries(keys.map((key) => [key, null])))}
      className="text-xs tracking-wider uppercase text-clay hover:text-earth"
    >
      Reset
    </button>
  );
}
