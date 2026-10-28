"use client";

import { useSyncExternalStore } from "react";
import type { ProductView } from "./product-view";

/**
 * Browser cart.
 *
 * Holds a display snapshot (name, image, price) so the drawer can render
 * without a round trip. That snapshot is NOT authoritative: localStorage is
 * fully editable by the visitor, so checkout must re-resolve every price from
 * the database server-side before charging anything.
 */
export type CartItem = {
  slug: string;
  name: string;
  tag: string;
  img: string | null;
  /** Display snapshot only — never trusted for the amount actually charged. */
  pricePaise: number;
  qty: number;
  /** Pieces in stock when last seen; 0 = sold out since it was added. */
  max?: number;
};

const STORAGE_KEY = "mudkraft.cart.v2";
const isBrowser = typeof window !== "undefined";

let state: CartItem[] = load();
const listeners = new Set<() => void>();

function load(): CartItem[] {
  if (!isBrowser) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Drop anything malformed rather than letting it reach the totals.
    return parsed.filter(
      (item): item is CartItem =>
        typeof item?.slug === "string" &&
        typeof item?.pricePaise === "number" &&
        Number.isFinite(item.pricePaise) &&
        typeof item?.qty === "number" &&
        item.qty > 0,
    );
  } catch {
    return [];
  }
}

function persist() {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota / privacy-mode errors
  }
}

function emit() {
  persist();
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

function getSnapshot() {
  return state;
}

/**
 * Must be a stable reference. useSyncExternalStore compares snapshots by
 * identity, so returning a fresh `[]` each call makes every render look like a
 * state change and loops forever.
 */
const EMPTY_CART: CartItem[] = [];

function getServerSnapshot(): CartItem[] {
  return EMPTY_CART;
}

export function useCart() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useCartCount() {
  const cart = useCart();
  return cart.reduce((s, x) => s + x.qty, 0);
}

/** Adds up to what is in stock; returns how many went in (0 when sold out). */
export function addToCart(product: ProductView, qty = 1): number {
  const max = product.stockQty;
  if (max <= 0) return 0;
  const existing = state.find((x) => x.slug === product.slug);
  if (existing) {
    const next = Math.min(existing.qty + qty, max);
    state = state.map((x) => (x.slug === product.slug ? { ...x, qty: next, max } : x));
    emit();
    return next - existing.qty;
  } else {
    qty = Math.min(qty, max);
    state = [
      ...state,
      {
        slug: product.slug,
        name: product.name,
        tag: product.tag,
        img: product.cutout ?? product.img,
        pricePaise: product.pricePaise,
        qty,
        max,
      },
    ];
  }
  emit();
  return qty;
}

export function updateQty(slug: string, delta: number) {
  state = state
    .map((x) => (x.slug === slug ? { ...x, qty: Math.min(x.qty + delta, x.max ?? Infinity) } : x))
    .filter((x) => x.qty > 0);
  emit();
}

/**
 * Fresh stock from the server: lines above what is left come down to it, and
 * sold-out lines stay (marked max 0) so the buyer sees why and removes them.
 */
export function syncStock(stock: Record<string, number>) {
  let changed = false;
  state = state.map((x) => {
    const max = stock[x.slug] ?? 0;
    const qty = max > 0 ? Math.min(x.qty, max) : x.qty;
    if (max === x.max && qty === x.qty) return x;
    changed = true;
    return { ...x, max, qty };
  });
  if (changed) emit();
}

export function removeItem(slug: string) {
  state = state.filter((x) => x.slug !== slug);
  emit();
}

export function clearCart() {
  state = [];
  emit();
}
