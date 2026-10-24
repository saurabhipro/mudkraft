"use client";

import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";

import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { BROCHURE } from "@/lib/catalogue";
import { whatsappLink } from "@/lib/whatsapp";

type Mode = "confirm" | "preview";

const PAGES = BROCHURE.pages;
const LAST = PAGES.length - 1;

const whatsappCatalogue = () =>
  whatsappLink(["Namaste Mudkraft! Please send me the 2026 catalogue."]);

function DownloadIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 4v11m0 0l-4.5-4.5M12 15l4.5-4.5M5 19h14" />
    </svg>
  );
}

function EyeIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
      className={className}
    >
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
      className="w-[18px] h-[18px]"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

/**
 * Floating "Catalogue 2026" button that sits above the WhatsApp button. It
 * opens a confirmation first (preview or download), and the preview is an
 * in-page page viewer with its own Download button.
 */
export function BrochureButton() {
  const [mode, setMode] = useState<Mode | null>(null);
  const [page, setPage] = useState(0);
  const [toast, setToast] = useState(false);
  const touchX = useRef<number | null>(null);

  const go = (i: number) => setPage(Math.max(0, Math.min(LAST, i)));

  // Warm the neighbouring pages so turning feels instant.
  useEffect(() => {
    if (mode !== "preview") return;
    for (const i of [page - 1, page + 1]) {
      if (i >= 0 && i <= LAST) new Image().src = PAGES[i].src;
    }
  }, [mode, page]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(false), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const onDownload = () => {
    setMode(null);
    setToast(true);
  };

  const openPreview = (at = 0) => {
    setPage(at);
    setMode("preview");
  };

  const downloadLink = (className: string, label: string) => (
    <a href={BROCHURE.href} download={BROCHURE.fileName} onClick={onDownload} className={className}>
      <DownloadIcon />
      {label}
    </a>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setMode("confirm")}
        aria-haspopup="dialog"
        aria-label="Mudkraft catalogue 2026: preview or download"
        className="fixed z-40 right-4 sm:right-6 bottom-[calc(max(1rem,env(safe-area-inset-bottom))+3.75rem)] sm:bottom-[5.75rem] inline-flex items-center gap-3 rounded-full border border-border bg-cream text-ink shadow-2xl p-1 sm:pr-5 sm:py-1.5 sm:pl-1.5 hover:-translate-y-0.5 transition-transform duration-500 ease-[var(--ease-clay)]"
      >
        <span className="grid place-items-center w-10 h-10 rounded-full bg-clay-deep text-cream">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
            className="w-[18px] h-[18px]"
          >
            <path d="M7 3h7l4 4v14H7z" />
            <path d="M14 3v4h4M10 12h5M10 16h5" />
          </svg>
        </span>
        <span className="hidden sm:flex flex-col items-start leading-tight">
          <span className="text-sm font-medium">Catalogue 2026</span>
          <span className="text-[10px] tracking-[0.14em] uppercase text-muted-foreground">
            Preview · Download
          </span>
        </span>
      </button>

      <Dialog.Root open={mode !== null} onOpenChange={(open) => !open && setMode(null)}>
        <Dialog.Portal>
          {mode === "confirm" && (
            <>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-kiln/65 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
              <Dialog.Content className="fixed z-50 inset-x-0 bottom-0 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full sm:w-[min(740px,calc(100vw-2rem))] bg-cream text-ink rounded-t-3xl sm:rounded-[1.75rem] overflow-hidden shadow-2xl sm:flex data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-6 sm:data-[state=open]:slide-in-from-bottom-2 sm:data-[state=open]:fade-in-0">
                <div
                  className="mx-auto mt-3 mb-1 h-1 w-10 rounded-full bg-border sm:hidden"
                  aria-hidden="true"
                />
                <div className="hidden sm:grid place-items-center w-[260px] shrink-0 bg-sand p-8">
                  <button
                    type="button"
                    onClick={() => openPreview(0)}
                    aria-label="Look inside the catalogue"
                    className="group relative"
                  >
                    <img
                      src={PAGES[0].src}
                      alt=""
                      width={190}
                      height={269}
                      className="w-[190px] rounded-md shadow-[0_20px_36px_-18px_rgba(42,26,20,0.6)] transition-transform duration-500 ease-[var(--ease-clay)] group-hover:-translate-y-1"
                    />
                    <span className="absolute left-1/2 bottom-3.5 -translate-x-1/2 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-cream/95 px-3 py-1.5 text-xs">
                      <EyeIcon className="w-3.5 h-3.5" />
                      Look inside
                    </span>
                  </button>
                </div>
                <div className="relative flex-1 px-5 pt-3 pb-7 sm:p-10 sm:pb-8">
                  <Dialog.Close
                    aria-label="Close"
                    className="absolute top-3 right-3 sm:top-4 sm:right-4 grid place-items-center w-11 h-11 rounded-full text-muted-foreground hover:bg-sand transition-colors"
                  >
                    <CloseIcon />
                  </Dialog.Close>
                  <div className="flex items-center gap-4 sm:block">
                    <img
                      src={PAGES[0].thumb}
                      alt=""
                      width={84}
                      height={119}
                      className="w-[84px] rounded shadow-[0_12px_24px_-12px_rgba(42,26,20,0.6)] sm:hidden"
                    />
                    <div className="pr-10 sm:pr-0">
                      <p className="text-[11px] tracking-[0.3em] uppercase text-clay-deep font-medium">
                        Product catalogue 2026
                      </p>
                      <Dialog.Title className="mt-2 sm:mt-3 font-display font-normal text-[1.75rem] sm:text-[2.4rem] leading-[1.05]">
                        The Mudkraft catalogue
                      </Dialog.Title>
                      <p className="mt-1 text-sm text-muted-foreground sm:hidden">
                        PDF · {PAGES.length} pages · {BROCHURE.sizeLabel}
                      </p>
                    </div>
                  </div>
                  <Dialog.Description className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
                    Eight pages: our story, why clay, the full soil report, every piece with its
                    size and price, the seasoning guide and workshops. Read it here first, or save
                    the PDF.
                  </Dialog.Description>
                  <ul className="mt-4 hidden sm:flex flex-wrap gap-2 text-xs text-earth">
                    {["PDF", `${PAGES.length} pages`, BROCHURE.sizeLabel].map((chip) => (
                      <li key={chip} className="rounded-full border border-border px-3 py-1.5">
                        {chip}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 sm:mt-7 grid grid-cols-2 sm:flex sm:flex-wrap gap-2.5 sm:gap-3">
                    <button
                      type="button"
                      onClick={() => openPreview(0)}
                      className="inline-flex items-center justify-center gap-2 sm:gap-2.5 min-h-[50px] px-4 sm:px-6 whitespace-nowrap rounded-full border border-earth text-earth text-xs tracking-[0.12em] sm:tracking-[0.16em] uppercase hover:bg-sand transition-colors"
                    >
                      <EyeIcon />
                      Preview
                    </button>
                    {downloadLink(
                      "inline-flex items-center justify-center gap-2 sm:gap-2.5 min-h-[50px] px-4 sm:px-6 whitespace-nowrap rounded-full bg-earth text-cream text-xs tracking-[0.12em] sm:tracking-[0.16em] uppercase hover:bg-clay-deep transition-colors",
                      "Download PDF",
                    )}
                  </div>
                  <p className="mt-4 text-[13px] text-muted-foreground">
                    Rather have it on your phone?{" "}
                    <a
                      href={whatsappCatalogue()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-clay-deep underline underline-offset-4 hover:text-earth"
                    >
                      Get it on WhatsApp
                    </a>
                  </p>
                </div>
              </Dialog.Content>
            </>
          )}

          {mode === "preview" && (
            <Dialog.Content
              aria-describedby={undefined}
              onKeyDown={(e) => {
                if (e.key === "ArrowLeft") go(page - 1);
                if (e.key === "ArrowRight") go(page + 1);
              }}
              className="fixed inset-0 z-50 flex flex-col bg-[#1a100c] text-cream data-[state=open]:animate-in data-[state=open]:fade-in-0"
            >
              <div className="flex h-16 sm:h-[72px] shrink-0 items-center gap-3 sm:gap-5 border-b border-white/10 pl-5 pr-2 sm:pl-8 sm:pr-6">
                <div className="min-w-0 flex-1 sm:flex sm:items-baseline sm:gap-4">
                  <Dialog.Title className="font-display font-normal text-xl sm:text-[1.65rem] leading-tight truncate">
                    {BROCHURE.title}
                  </Dialog.Title>
                  <span className="block text-xs sm:text-[13px] text-cream/60">
                    {PAGES[page].label}
                  </span>
                </div>
                <span
                  aria-live="polite"
                  className="text-[13px] sm:text-sm tabular-nums text-cream/75"
                >
                  {page + 1} / {PAGES.length}
                </span>
                {downloadLink(
                  "hidden sm:inline-flex items-center gap-2.5 h-11 px-5 rounded-full bg-cream text-ink text-xs tracking-[0.16em] uppercase hover:bg-sand transition-colors",
                  "Download PDF",
                )}
                <Dialog.Close
                  aria-label="Close preview"
                  className="grid place-items-center w-11 h-11 rounded-full sm:border sm:border-white/20 hover:bg-white/10 transition-colors"
                >
                  <CloseIcon />
                </Dialog.Close>
              </div>

              <div
                className="relative flex min-h-0 flex-1 items-center justify-center gap-10 p-4 sm:p-6"
                onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
                onTouchEnd={(e) => {
                  if (touchX.current === null) return;
                  const dx = e.changedTouches[0].clientX - touchX.current;
                  if (Math.abs(dx) > 40) go(dx < 0 ? page + 1 : page - 1);
                  touchX.current = null;
                }}
              >
                <button
                  type="button"
                  onClick={() => go(page - 1)}
                  disabled={page === 0}
                  aria-label="Previous page"
                  className="hidden sm:grid place-items-center w-14 h-14 shrink-0 rounded-full border border-white/20 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden="true"
                    className="w-5 h-5"
                  >
                    <path d="M15 5l-7 7 7 7" />
                  </svg>
                </button>
                <img
                  key={page}
                  src={PAGES[page].src}
                  alt={`Catalogue page ${page + 1}: ${PAGES[page].label}`}
                  width={910}
                  height={1287}
                  className="h-auto max-h-full w-auto max-w-full rounded-[3px] shadow-[0_30px_70px_-20px_rgba(0,0,0,0.8)] animate-in fade-in-0 duration-300"
                />
                <button
                  type="button"
                  onClick={() => go(page + 1)}
                  disabled={page === LAST}
                  aria-label="Next page"
                  className="hidden sm:grid place-items-center w-14 h-14 shrink-0 rounded-full border border-white/20 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden="true"
                    className="w-5 h-5"
                  >
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                {/* Phone: tap either side of the page to turn it. */}
                <button
                  type="button"
                  onClick={() => go(page - 1)}
                  aria-label="Previous page"
                  className="sm:hidden absolute inset-y-0 left-0 w-2/5"
                />
                <button
                  type="button"
                  onClick={() => go(page + 1)}
                  aria-label="Next page"
                  className="sm:hidden absolute inset-y-0 right-0 w-2/5"
                />
              </div>

              <div className="hidden sm:flex h-32 shrink-0 items-center justify-center gap-3 border-t border-white/10 overflow-x-auto px-6">
                {PAGES.map((p, i) => (
                  <button
                    key={p.src}
                    type="button"
                    onClick={() => go(i)}
                    aria-label={`Page ${i + 1}, ${p.label}`}
                    aria-current={i === page ? "page" : undefined}
                    className={`shrink-0 rounded border-2 transition-opacity ${
                      i === page
                        ? "border-[#dba580] opacity-100"
                        : "border-transparent opacity-55 hover:opacity-90"
                    }`}
                  >
                    <img
                      src={p.thumb}
                      alt=""
                      width={60}
                      height={84}
                      className="h-[84px] w-auto rounded-sm"
                    />
                  </button>
                ))}
              </div>

              <div className="sm:hidden flex justify-center pb-2">
                {PAGES.map((p, i) => (
                  <button
                    key={p.src}
                    type="button"
                    onClick={() => go(i)}
                    aria-label={`Page ${i + 1}, ${p.label}`}
                    className="grid place-items-center w-6 h-6"
                  >
                    <span
                      className={`h-1.5 rounded-full transition-all ${i === page ? "w-[18px] bg-[#dba580]" : "w-1.5 bg-white/25"}`}
                    />
                  </button>
                ))}
              </div>
              <div className="sm:hidden flex gap-2.5 border-t border-white/10 px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                {downloadLink(
                  "flex-1 inline-flex items-center justify-center gap-2.5 h-[52px] rounded-full bg-cream text-ink text-xs tracking-[0.16em] uppercase",
                  `Download · ${BROCHURE.sizeLabel}`,
                )}
                <a
                  href={whatsappCatalogue()}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Get the catalogue on WhatsApp"
                  className="grid place-items-center w-[52px] h-[52px] rounded-full bg-[#25D366] text-white"
                >
                  <WhatsAppIcon className="w-6 h-6" />
                </a>
              </div>
            </Dialog.Content>
          )}
        </Dialog.Portal>
      </Dialog.Root>

      {toast && (
        <div
          role="status"
          className="fixed z-[60] left-1/2 -translate-x-1/2 bottom-6 flex items-center gap-3 rounded-2xl bg-cream text-ink px-5 py-3.5 text-sm shadow-2xl animate-in fade-in-0 slide-in-from-bottom-2"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="#2f7a4a"
            strokeWidth="2"
            aria-hidden="true"
            className="w-[18px] h-[18px]"
          >
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
          Downloading {BROCHURE.fileName}
        </div>
      )}
    </>
  );
}
