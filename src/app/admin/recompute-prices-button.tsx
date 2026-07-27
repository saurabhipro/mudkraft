"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { recomputeAllPrices } from "@/server/actions/products";

export function RecomputePricesButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-4">
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            setMessage(null);
            const result = await recomputeAllPrices();
            setMessage(
              result.ok
                ? `Re-priced ${result.updated ?? 0} products.`
                : result.error,
            );
            router.refresh();
          })
        }
        className="inline-flex items-center bg-earth text-cream px-6 py-3 rounded-full text-xs tracking-widest uppercase hover:bg-clay transition-colors disabled:opacity-60"
      >
        {isPending ? "Re-pricing…" : "Re-price all products"}
      </button>
      {message && <span className="text-sm text-earth/80">{message}</span>}
    </div>
  );
}
