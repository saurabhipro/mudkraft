"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { authClient, useSession } from "@/lib/auth-client";

/**
 * Account control for the site header: a Sign in link when signed out, and the
 * user's name with a small menu when signed in.
 */
export function HeaderAccount() {
  const { data: session, isPending } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  // Google avatar URLs can 403/404 after they expire; tracking the failed src
  // (rather than a boolean) resets the fallback if the session's image changes.
  const [failedImageSrc, setFailedImageSrc] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click and on Escape.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Reserve the space while the session resolves, so the header doesn't jump.
  if (isPending) {
    return <span className="block w-16 sm:w-20 h-9" aria-hidden="true" />;
  }

  if (!session) {
    return (
      <Link
        href={`/sign-in?next=${encodeURIComponent(pathname)}`}
        className="inline-flex items-center text-xs tracking-widest uppercase border border-earth/30 text-earth px-4 sm:px-5 py-2.5 rounded-full hover:bg-earth hover:text-cream transition-colors"
      >
        Sign in
      </Link>
    );
  }

  const displayName = session.user.name?.split(" ")[0] || session.user.email;
  const isAdmin = session.user.role === "admin";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center gap-2 text-xs tracking-widest uppercase border border-earth/30 text-earth px-3 sm:px-4 py-2.5 rounded-full hover:bg-earth hover:text-cream transition-colors max-w-[7rem] sm:max-w-[10rem]"
      >
        {session.user.image && session.user.image !== failedImageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={session.user.image}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setFailedImageSrc(session.user.image ?? null)}
            className="w-5 h-5 rounded-full"
          />
        ) : (
          <span className="w-5 h-5 rounded-full bg-clay/30 grid place-items-center text-[10px] text-earth">
            {displayName.charAt(0).toUpperCase()}
          </span>
        )}
        <span className="truncate">{displayName}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-52 max-w-[calc(100vw-2rem)] rounded-2xl border border-earth/15 bg-background shadow-lg p-2 z-50"
        >
          <div className="px-3 py-2 text-xs text-muted-foreground truncate border-b border-earth/10">
            {session.user.email}
          </div>

          {isAdmin && (
            <Link
              href="/admin"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-3 py-2.5 text-sm text-earth hover:bg-cream/70 rounded-xl"
            >
              Admin panel
            </Link>
          )}

          <button
            type="button"
            role="menuitem"
            onClick={async () => {
              setOpen(false);
              await authClient.signOut();
              router.refresh();
            }}
            className="w-full text-left px-3 py-2.5 text-sm text-earth hover:bg-cream/70 rounded-xl"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
