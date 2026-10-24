"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { confirmDeliveryOtp, requestDeliveryOtp } from "@/server/actions/verification";

/**
 * Two-step client flow: request the SMS code, then submit it. The phone number
 * itself never reaches this component — the server sends to the number stored
 * on the order, and the page shows only a masked form of it.
 */
export function VerifyForm({ token }: { token: string }) {
  const router = useRouter();
  const [sent, setSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState<"sending" | "verifying" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const sendCode = async () => {
    setError(null);
    setBusy("sending");
    const result = await requestDeliveryOtp(token);
    if (!result.ok) {
      setError(result.error);
      setBusy(null);
      return;
    }
    setSent(true);
    setBusy(null);
  };

  const verify = async () => {
    setError(null);
    setBusy("verifying");
    const result = await confirmDeliveryOtp(token, otp.trim());
    if (!result.ok) {
      setError(result.error);
      setBusy(null);
      return;
    }
    setDone(true);
    setBusy(null);
    // Re-render the page into its verified state after a beat, so the
    // thank-you below is actually seen.
    setTimeout(() => router.refresh(), 2500);
  };

  if (done) {
    return (
      <p className="mt-6 rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-relaxed text-emerald-800">
        Verified — thank you! Your delivery is confirmed and this code is now used up.
      </p>
    );
  }

  return (
    <div className="mt-6">
      {error && (
        <p role="alert" className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {!sent ? (
        <button
          type="button"
          onClick={sendCode}
          disabled={busy !== null}
          className="w-full inline-flex items-center justify-center bg-earth text-cream px-6 py-4 rounded-full text-xs tracking-widest uppercase hover:bg-clay transition-colors disabled:opacity-60"
        >
          {busy === "sending" ? "Sending…" : "Text me the code"}
        </button>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void verify();
          }}
        >
          <label
            htmlFor="otp"
            className="block text-xs tracking-widest uppercase text-earth/70"
          >
            Enter the 6-digit code
          </label>
          <input
            id="otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
            placeholder="••••••"
            className="mt-2 w-full rounded-2xl border border-earth/25 bg-background px-4 py-3 text-center font-display text-2xl tracking-[0.5em] text-earth placeholder:text-earth/30 focus:outline-none focus:ring-2 focus:ring-earth/40"
          />
          <button
            type="submit"
            disabled={busy !== null || otp.length !== 6}
            className="mt-4 w-full inline-flex items-center justify-center bg-earth text-cream px-6 py-4 rounded-full text-xs tracking-widest uppercase hover:bg-clay transition-colors disabled:opacity-60"
          >
            {busy === "verifying" ? "Verifying…" : "Verify delivery"}
          </button>
          <button
            type="button"
            onClick={sendCode}
            disabled={busy !== null}
            className="mt-3 w-full text-center text-xs text-muted-foreground underline hover:text-earth disabled:opacity-60"
          >
            Didn&apos;t get it? Send again
          </button>
        </form>
      )}
    </div>
  );
}
