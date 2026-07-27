"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { moderateReview } from "@/server/actions/moderation";

export function ReviewActions({
  reviewId,
  status,
}: {
  reviewId: string;
  status: "pending" | "approved" | "rejected";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const act = (next: "approved" | "rejected" | "pending") =>
    startTransition(async () => {
      setError(null);
      const result = await moderateReview({ reviewId, status: next });
      if (!result.ok) setError(result.error);
      router.refresh();
    });

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status !== "approved" && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => act("approved")}
          className="rounded-full bg-earth px-4 py-1.5 text-[10px] tracking-widest uppercase text-cream hover:bg-clay disabled:opacity-60"
        >
          Approve
        </button>
      )}
      {status !== "rejected" && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => act("rejected")}
          className="rounded-full border border-earth/30 px-4 py-1.5 text-[10px] tracking-widest uppercase text-earth hover:bg-earth hover:text-cream disabled:opacity-60"
        >
          Reject
        </button>
      )}
      {status !== "pending" && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => act("pending")}
          className="text-[10px] tracking-widest uppercase text-clay hover:text-earth disabled:opacity-60"
        >
          Reset
        </button>
      )}
      {error && <span className="text-xs text-red-700">{error}</span>}
    </div>
  );
}
