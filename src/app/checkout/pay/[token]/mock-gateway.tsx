"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { settleMockPayment } from "@/server/actions/checkout";

/**
 * Both outcomes are offered deliberately. A mock that can only succeed leaves the
 * failure path — which a real gateway will exercise regularly — untested.
 */
export function MockGateway({ token }: { token: string }) {
  const router = useRouter();
  const [pending, setPending] = useState<"success" | "failure" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const settle = async (outcome: "success" | "failure") => {
    setError(null);
    setPending(outcome);

    const result = await settleMockPayment(token, outcome);

    if (!result.ok) {
      setError(result.error);
      setPending(null);
      return;
    }

    if (result.paid) {
      router.push(`/checkout/done/${token}`);
      return;
    }

    // A declined payment leaves the order intact and payable, so stay here and
    // let them try again rather than sending them to a confirmation.
    setError("The payment was declined. Nothing has been charged — you can try again.");
    setPending(null);
    router.refresh();
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
        onClick={() => settle("success")}
        disabled={pending !== null}
        className="w-full inline-flex items-center justify-center bg-earth text-cream px-6 py-4 rounded-full text-xs tracking-widest uppercase hover:bg-clay transition-colors disabled:opacity-60"
      >
        {pending === "success" ? "Processing…" : "Simulate a successful payment"}
      </button>

      <button
        type="button"
        onClick={() => settle("failure")}
        disabled={pending !== null}
        className="mt-3 w-full inline-flex items-center justify-center border border-earth/25 bg-background text-earth px-6 py-4 rounded-full text-xs tracking-widest uppercase hover:bg-earth hover:text-cream transition-colors disabled:opacity-60"
      >
        {pending === "failure" ? "Processing…" : "Simulate a declined payment"}
      </button>
    </div>
  );
}
