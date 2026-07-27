"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { setEnquiryStatus } from "@/server/actions/moderation";

const STATUSES = ["new", "contacted", "booked", "closed"] as const;

export function EnquiryStatusSelect({
  enquiryId,
  status,
}: {
  enquiryId: string;
  status: (typeof STATUSES)[number];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      <select
        value={status}
        disabled={isPending}
        onChange={(e) =>
          startTransition(async () => {
            setError(null);
            const result = await setEnquiryStatus({ enquiryId, status: e.target.value });
            if (!result.ok) setError(result.error);
            router.refresh();
          })
        }
        className="rounded-full border border-earth/25 bg-background px-3 py-1.5 text-xs text-earth focus:outline-none focus:ring-2 focus:ring-earth/30 disabled:opacity-60"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-red-700">{error}</span>}
    </div>
  );
}
