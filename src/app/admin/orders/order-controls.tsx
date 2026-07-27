"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { setOrderStatus, setPaymentStatus } from "@/server/actions/moderation";

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "crafting",
  "dispatched",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "refunded",
] as const;

const PAYMENT_STATUSES = ["unpaid", "paid", "failed", "refunded"] as const;

const selectCls =
  "rounded-full border border-earth/25 bg-background px-3 py-1.5 text-xs text-earth " +
  "focus:outline-none focus:ring-2 focus:ring-earth/30 disabled:opacity-60";

export function OrderControls({
  orderId,
  status,
  paymentStatus,
}: {
  orderId: string;
  status: (typeof ORDER_STATUSES)[number];
  paymentStatus: (typeof PAYMENT_STATUSES)[number];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        className={selectCls}
        value={status}
        disabled={isPending}
        onChange={(e) =>
          startTransition(async () => {
            setError(null);
            const result = await setOrderStatus({ orderId, status: e.target.value });
            if (!result.ok) setError(result.error);
            router.refresh();
          })
        }
      >
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.replace(/_/g, " ")}
          </option>
        ))}
      </select>

      <select
        className={selectCls}
        value={paymentStatus}
        disabled={isPending}
        onChange={(e) =>
          startTransition(async () => {
            setError(null);
            const result = await setPaymentStatus({ orderId, paymentStatus: e.target.value });
            if (!result.ok) setError(result.error);
            router.refresh();
          })
        }
      >
        {PAYMENT_STATUSES.map((s) => (
          <option key={s} value={s}>
            payment: {s}
          </option>
        ))}
      </select>

      {error && <span className="text-xs text-red-700">{error}</span>}
    </div>
  );
}
