"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  confirmRazorpayPayment,
  initiateRazorpayPayment,
  reportRazorpayFailure,
} from "@/server/actions/checkout";

/**
 * Opens Razorpay's hosted checkout modal (checkout.js). The modal collects the
 * card/UPI details on Razorpay's side — no payment data ever touches this app.
 * Success hands back ids plus a signature, which the server verifies before
 * anything is marked paid; this component never decides an order is paid.
 */

interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayFailureResponse {
  error?: {
    code?: string;
    description?: string;
    metadata?: { order_id?: string; payment_id?: string };
  };
}

interface RazorpayCheckout {
  open(): void;
  on(event: "payment.failed", handler: (response: RazorpayFailureResponse) => void): void;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayCheckout;
  }
}

const CHECKOUT_JS = "https://checkout.razorpay.com/v1/checkout.js";

/** Loads checkout.js once; subsequent calls resolve against the same tag. */
function loadCheckoutScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${CHECKOUT_JS}"]`);
    const script = existing ?? document.createElement("script");

    const fail = () => reject(new Error("Could not load the payment window."));
    script.addEventListener("load", () => (window.Razorpay ? resolve() : fail()));
    script.addEventListener("error", fail);

    if (!existing) {
      script.src = CHECKOUT_JS;
      script.async = true;
      document.body.appendChild(script);
    }
  });
}

export function RazorpayGateway({ token }: { token: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"opening" | "verifying" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pay = async () => {
    setError(null);
    setBusy("opening");

    try {
      const [init] = await Promise.all([initiateRazorpayPayment(token), loadCheckoutScript()]);

      if (!init.ok) {
        setError(init.error);
        setBusy(null);
        return;
      }

      const checkout = new window.Razorpay!({
        key: init.keyId,
        order_id: init.gatewayOrderId,
        amount: init.amountPaise,
        currency: init.currency,
        name: "Mudkraft Studio",
        description: `Order ${init.orderNumber}`,
        prefill: {
          name: init.customerName,
          email: init.customerEmail ?? undefined,
          contact: init.customerPhone ?? undefined,
        },
        theme: { color: "#8a5a3b" },
        modal: {
          // Closing the modal is not a failure — the order stays payable.
          ondismiss: () => setBusy(null),
        },
        handler: async (response: RazorpaySuccessResponse) => {
          setBusy("verifying");
          const result = await confirmRazorpayPayment(token, {
            gatewayOrderId: response.razorpay_order_id,
            gatewayPaymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          });

          if (result.ok && result.paid) {
            router.push(`/checkout/done/${token}`);
            return;
          }

          setError(
            result.ok ? "The payment could not be confirmed." : result.error,
          );
          setBusy(null);
          router.refresh();
        },
      });

      checkout.on("payment.failed", (response) => {
        const reason = response.error;
        // Best-effort bookkeeping; the customer-facing state is the message below.
        void reportRazorpayFailure(token, reason?.metadata?.order_id ?? init.gatewayOrderId, {
          code: reason?.code,
          description: reason?.description,
        });
        setError(
          reason?.description ??
            "The payment did not go through. Nothing has been charged — you can try again.",
        );
        setBusy(null);
      });

      checkout.open();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong. Please try again.");
      setBusy(null);
    }
  };

  return (
    <div className="mt-8">
      {error && (
        <p role="alert" className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={pay}
        disabled={busy !== null}
        className="w-full inline-flex items-center justify-center bg-earth text-cream px-6 py-4 rounded-full text-xs tracking-widest uppercase hover:bg-clay transition-colors disabled:opacity-60"
      >
        {busy === "verifying"
          ? "Confirming your payment…"
          : busy === "opening"
            ? "Opening secure payment…"
            : "Pay securely with UPI / card"}
      </button>

      <p className="mt-3 text-center text-[11px] text-muted-foreground">
        Payments are processed by Razorpay. We never see your card or UPI details.
      </p>
    </div>
  );
}
