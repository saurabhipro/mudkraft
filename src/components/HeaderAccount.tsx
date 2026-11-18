"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ChevronDown, LogOut, Package, Shield, ShoppingBag } from "lucide-react";

import { suppressOneTapAfterSignOut } from "@/components/GoogleOneTap";
import { authClient, useSession } from "@/lib/auth-client";
import { firstNameOf, fullNameOf, initialsOf } from "@/lib/display-name";

/**
 * Account control for the site header: a Sign in link when signed out; when
 * signed in, an avatar pill (photo or initials + first name) opening a menu.
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

  const firstName = firstNameOf(session.user);
  const isAdmin = session.user.role === "admin";
  const image =
    session.user.image && session.user.image !== failedImageSrc ? session.user.image : null;
  const onImageError = () => setFailedImageSrc(session.user.image ?? null);

  const itemCls =
    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-earth hover:bg-sand/70 transition-colors";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Account: ${fullNameOf(session.user)}`}
        className={`group inline-flex h-[42px] items-center gap-2 rounded-full border pl-1 pr-3 transition-colors ${
          open
            ? "border-earth bg-earth text-cream"
            : "border-earth/25 bg-background/60 text-earth hover:border-earth/60"
        }`}
      >
        <Avatar user={session.user} image={image} onError={onImageError} size="sm" />
        <span className="hidden max-w-[7.5rem] truncate text-xs tracking-widest uppercase sm:inline">
          {firstName}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-64 max-w-[calc(100vw-2rem)] overflow-hidden rounded-3xl border border-earth/15 bg-background shadow-[0_24px_60px_-24px_rgba(59,42,34,0.5)]"
        >
          <div className="flex items-center gap-3 bg-sand/60 px-4 py-4">
            <Avatar user={session.user} image={image} onError={onImageError} size="lg" />
            <div className="min-w-0">
              <div className="truncate font-display text-lg leading-tight text-earth">
                {fullNameOf(session.user)}
              </div>
              <div className="truncate text-xs text-earth/60">{session.user.email}</div>
            </div>
          </div>

          <div className="p-2">
            <Link
              href="/checkout"
              role="menuitem"
              onClick={() => setOpen(false)}
              className={itemCls}
            >
              <ShoppingBag className="h-4 w-4 text-earth/60" aria-hidden="true" />
              Your basket
            </Link>
            <Link href="/track" role="menuitem" onClick={() => setOpen(false)} className={itemCls}>
              <Package className="h-4 w-4 text-earth/60" aria-hidden="true" />
              Track an order
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                role="menuitem"
                onClick={() => setOpen(false)}
                className={itemCls}
              >
                <Shield className="h-4 w-4 text-earth/60" aria-hidden="true" />
                Admin panel
              </Link>
            )}
            <div className="my-1 h-px bg-earth/10" />
            <button
              type="button"
              role="menuitem"
              onClick={async () => {
                setOpen(false);
                suppressOneTapAfterSignOut();
                await authClient.signOut();
                router.refresh();
              }}
              className={itemCls}
            >
              <LogOut className="h-4 w-4 text-earth/60" aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Photo when Google gave us one (and it still loads), otherwise initials on clay. */
function Avatar({
  user,
  image,
  onError,
  size,
}: {
  user: { name?: string | null; email?: string | null };
  image: string | null;
  onError?: () => void;
  size: "sm" | "lg";
}) {
  const box = size === "sm" ? "h-8 w-8 text-[11px]" : "h-11 w-11 text-sm";
  if (image) {
    return (
      <img
        src={image}
        alt=""
        referrerPolicy="no-referrer"
        onError={onError}
        className={`${box} shrink-0 rounded-full object-cover ring-2 ring-cream`}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`${box} grid shrink-0 place-items-center rounded-full bg-clay font-medium tracking-wide text-cream ring-2 ring-cream`}
    >
      {initialsOf(user)}
    </span>
  );
}

/**
 * The same account control for the mobile menu sheet, where there is room for
 * full-width rows instead of a dropdown.
 */
export function SheetAccount({ onNavigate }: { onNavigate: () => void }) {
  const { data: session, isPending } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  if (isPending) return <div className="min-h-[54px]" aria-hidden="true" />;

  if (!session) {
    return (
      <Link
        href={`/sign-in?next=${encodeURIComponent(pathname)}`}
        onClick={onNavigate}
        className="inline-flex items-center justify-center min-h-[54px] text-xs tracking-widest uppercase border border-cream/40 text-cream rounded-full"
      >
        Sign in
      </Link>
    );
  }

  const isAdmin = session.user.role === "admin";

  return (
    <div className="flex items-center gap-3 rounded-full border border-cream/30 pl-2 pr-2 min-h-[58px]">
      {session.user.image ? (
        <img
          src={session.user.image}
          alt=""
          referrerPolicy="no-referrer"
          className="h-10 w-10 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-cream text-sm font-medium text-earth"
        >
          {initialsOf(session.user)}
        </span>
      )}
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block truncate text-sm">{fullNameOf(session.user)}</span>
        <span className="block truncate text-[11px] text-cream/60">{session.user.email}</span>
      </span>
      {isAdmin && (
        <Link
          href="/admin"
          onClick={onNavigate}
          className="shrink-0 px-3 py-2 text-xs tracking-widest uppercase rounded-full hover:bg-cream/10"
        >
          Admin
        </Link>
      )}
      <button
        type="button"
        onClick={async () => {
          onNavigate();
          suppressOneTapAfterSignOut();
          await authClient.signOut();
          router.refresh();
        }}
        className="shrink-0 px-4 py-2.5 text-xs tracking-widest uppercase rounded-full bg-cream text-ink"
      >
        Sign out
      </button>
    </div>
  );
}
