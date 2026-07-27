"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { setUserBanned, setUserRole } from "@/server/actions/users";

export function UserControls({
  userId,
  role,
  banned,
  isSelf,
}: {
  userId: string;
  role: string;
  banned: boolean;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    startTransition(async () => {
      setError(null);
      const result = await fn();
      if (!result.ok) setError(result.error ?? "That did not work.");
      router.refresh();
    });

  const isAdmin = role === "admin";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isSelf ? (
        <span className="text-[11px] tracking-widest uppercase text-earth/50">You</span>
      ) : (
        <>
          <button
            type="button"
            disabled={isPending}
            onClick={() => run(() => setUserRole({ userId, role: isAdmin ? "customer" : "admin" }))}
            className="rounded-full border border-earth/30 px-4 py-1.5 text-[10px] tracking-widest uppercase text-earth hover:bg-earth hover:text-cream disabled:opacity-60"
          >
            {isAdmin ? "Remove admin" : "Make admin"}
          </button>

          {!isAdmin && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => run(() => setUserBanned({ userId, banned: !banned }))}
              className="rounded-full px-4 py-1.5 text-[10px] tracking-widest uppercase text-red-700/80 hover:text-red-700 disabled:opacity-60"
            >
              {banned ? "Unban" : "Ban"}
            </button>
          )}
        </>
      )}
      {error && <span className="text-xs text-red-700">{error}</span>}
    </div>
  );
}
