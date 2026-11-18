"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useCart } from "@/lib/cart";
import { formatPaise } from "@/lib/money";

/**
 * A glance at the basket on the sign-in page, so a shopper sent here from
 * checkout can see their picks are safe. The cart lives in localStorage, so
 * nothing renders until after hydration.
 */
export function BasketPeek() {
  const cart = useCart();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setHydrated(true), 0);
    return () => window.clearTimeout(t);
  }, []);

  if (!hydrated || cart.length === 0) return null;

  const pieces = cart.reduce((n, item) => n + item.qty, 0);
  const total = cart.reduce((sum, item) => sum + item.pricePaise * item.qty, 0);

  return (
    <div className="rounded-2xl border border-cream/20 bg-cream/10 p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] tracking-[0.3em] uppercase text-cream/70">
          Your basket · saved
        </div>
        <Link
          href="/checkout"
          className="text-[11px] tracking-widest uppercase text-gold hover:text-cream"
        >
          View
        </Link>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="flex -space-x-3">
          {cart.slice(0, 4).map((item) =>
            item.img ? (
              <div
                key={item.slug}
                className="grid h-12 w-12 place-items-center overflow-hidden rounded-full border-2 border-earth bg-[radial-gradient(circle_at_50%_40%,oklch(0.97_0.02_75),oklch(0.86_0.05_65))]"
              >
                <img
                  src={item.img}
                  alt=""
                  className="h-full w-full object-contain p-1 mix-blend-multiply"
                />
              </div>
            ) : (
              <div
                key={item.slug}
                className="h-12 w-12 rounded-full border-2 border-earth bg-clay/60"
              />
            ),
          )}
        </div>
        <div className="min-w-0 text-sm leading-snug text-cream">
          <div className="truncate">
            {cart.length === 1 ? cart[0].name : `${cart[0].name} + ${cart.length - 1} more`}
          </div>
          <div className="text-cream/70">
            {pieces} {pieces === 1 ? "piece" : "pieces"} · {formatPaise(total)}
          </div>
        </div>
      </div>
    </div>
  );
}
