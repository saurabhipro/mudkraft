"use client";

import { useEffect } from "react";

import { track, type AnalyticsItem } from "@/lib/analytics";

/** Sends GA4 `purchase` once per order; the order page can be reopened by its link. */
export function PurchaseEvent({
  orderNumber,
  value,
  shipping,
  items,
}: {
  orderNumber: string;
  value: number;
  shipping: number;
  items: AnalyticsItem[];
}) {
  useEffect(() => {
    const key = `mk.purchase.${orderNumber}`;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, "1");
    } catch {
      // Storage blocked: better a rare repeat than a missing sale.
    }
    track("purchase", { transaction_id: orderNumber, currency: "INR", value, shipping, items });
  }, [orderNumber, value, shipping, items]);

  return null;
}
