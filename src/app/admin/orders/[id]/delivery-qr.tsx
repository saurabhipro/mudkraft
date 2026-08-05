"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createDeliveryQr } from "@/server/actions/verification";

/**
 * The print path deliberately avoids a dedicated route: a throwaway window
 * with just the label keeps the admin chrome out of the printout without any
 * print-CSS gymnastics.
 */
export function DeliveryQrActions({
  orderId,
  orderNumber,
  qrDataUrl,
}: {
  orderId: string;
  orderNumber: string;
  /** Null until the QR has been generated. */
  qrDataUrl: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!qrDataUrl) {
    return (
      <div>
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              const result = await createDeliveryQr(orderId);
              if (!result.ok) setError(result.error);
              router.refresh();
            })
          }
          className="inline-flex items-center justify-center bg-earth text-cream px-5 py-2.5 rounded-full text-xs tracking-widest uppercase hover:bg-clay transition-colors disabled:opacity-60"
        >
          {isPending ? "Generating…" : "Generate delivery QR"}
        </button>
        {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
      </div>
    );
  }

  const print = () => {
    const w = window.open("", "_blank", "width=480,height=640");
    if (!w) return;
    w.document.write(`<!doctype html>
<html><head><title>Delivery QR — ${orderNumber}</title>
<style>
  body { font-family: Georgia, serif; text-align: center; padding: 32px; color: #3d3229; }
  img { width: 320px; height: 320px; }
  h1 { font-size: 20px; font-weight: normal; margin: 16px 0 4px; }
  p { font-size: 12px; color: #8b7d70; margin: 4px 0; }
</style></head>
<body>
  <img src="${qrDataUrl}" alt="Delivery verification QR">
  <h1>Mudkraft · ${orderNumber}</h1>
  <p>Scan after your parcel arrives to confirm delivery.</p>
  <p>Works once, only with the phone this order was placed with.</p>
  <script>window.onload = () => { window.print(); }</script>
</body></html>`);
    w.document.close();
  };

  return (
    <button
      type="button"
      onClick={print}
      className="inline-flex items-center justify-center border border-earth/25 bg-background text-earth px-5 py-2.5 rounded-full text-xs tracking-widest uppercase hover:bg-earth hover:text-cream transition-colors"
    >
      Print QR label
    </button>
  );
}
