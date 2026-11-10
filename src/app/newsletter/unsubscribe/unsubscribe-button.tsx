"use client";

import Link from "next/link";
import { useState } from "react";

import { unsubscribeNewsletter } from "@/server/actions/newsletter";

export function UnsubscribeButton({ token }: { token: string }) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  async function go() {
    setState("busy");
    const out = await unsubscribeNewsletter(token).catch(() => ({ ok: false }));
    setState(out.ok ? "done" : "error");
  }

  if (state === "done") {
    return (
      <div role="status">
        <p className="mt-4 text-sm text-muted-foreground">
          You&apos;re unsubscribed. We won&apos;t send you any more letters.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block text-sm text-clay-deep underline underline-offset-4"
        >
          Back to Mudkraft
        </Link>
      </div>
    );
  }
  return (
    <>
      <p className="mt-4 text-sm text-muted-foreground">
        Stop the monthly letters to this email address?
      </p>
      <button
        type="button"
        onClick={go}
        disabled={state === "busy"}
        className="mt-6 min-h-[48px] rounded-full bg-clay-deep px-8 text-sm font-semibold text-white transition-colors hover:bg-earth disabled:opacity-70"
      >
        {state === "busy" ? "Unsubscribing…" : "Unsubscribe"}
      </button>
      {state === "error" && (
        <p role="alert" className="mt-3 text-sm text-red-800">
          That didn&apos;t work. Please try again, or write to sales@mudkraft.com.
        </p>
      )}
    </>
  );
}
