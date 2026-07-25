import { useSyncExternalStore } from "react";
import type { Product } from "./products";

export type CartItem = Product & { qty: number };

const STORAGE_KEY = "mudkraft.cart.v1";
const isBrowser = typeof window !== "undefined";

let state: CartItem[] = load();
const listeners = new Set<() => void>();

function load(): CartItem[] {
  if (!isBrowser) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
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
  return () => listeners.delete(l);
}

function getSnapshot() {
  return state;
}

function getServerSnapshot(): CartItem[] {
  return [];
}

export function useCart() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useCartCount() {
  const cart = useCart();
  return cart.reduce((s, x) => s + x.qty, 0);
}

export function addToCart(p: Product, qty = 1) {
  const existing = state.find((x) => x.slug === p.slug);
  if (existing) {
    state = state.map((x) => (x.slug === p.slug ? { ...x, qty: x.qty + qty } : x));
  } else {
    state = [...state, { ...p, qty }];
  }
  emit();
}

export function updateQty(slug: string, delta: number) {
  state = state
    .map((x) => (x.slug === slug ? { ...x, qty: x.qty + delta } : x))
    .filter((x) => x.qty > 0);
  emit();
}

export function removeItem(slug: string) {
  state = state.filter((x) => x.slug !== slug);
  emit();
}

export function clearCart() {
  state = [];
  emit();
}
