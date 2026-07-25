import { useState } from "react";

type Props = {
  title?: string;
  text?: string;
  url?: string;
  label?: string;
  className?: string;
  compact?: boolean;
};

function getShareUrl(url?: string) {
  if (url) return url;
  if (typeof window !== "undefined") return window.location.href;
  return "";
}

export function ShareButton({
  title = "Mudkraft",
  text = "Handcrafted clay from the banks of the Ganges.",
  url,
  label = "Share",
  className = "",
  compact = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = getShareUrl(url);
  const encoded = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(`${title} — ${text}`);

  const handleNative = async () => {
    if (typeof navigator !== "undefined" && (navigator as Navigator & { share?: unknown }).share) {
      try {
        await navigator.share({ title, text, url: shareUrl });
        return;
      } catch {
        /* user dismissed — fall through to menu */
      }
    }
    setOpen((o) => !o);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={handleNative}
        className={
          compact
            ? "inline-flex items-center gap-1.5 text-xs tracking-widest uppercase text-earth/80 hover:text-earth transition-colors"
            : "inline-flex items-center gap-2 border border-earth/30 text-earth px-5 py-3 rounded-full text-xs tracking-widest uppercase hover:bg-earth hover:text-cream transition-colors"
        }
        aria-label={label}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4" aria-hidden="true">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
        </svg>
        {label}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute z-30 mt-2 right-0 min-w-[220px] rounded-2xl border border-earth/15 bg-cream shadow-2xl p-2"
          onMouseLeave={() => setOpen(false)}
        >
          <a
            href={`https://wa.me/?text=${encodedText}%20${encoded}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-3 py-2 rounded-lg text-sm text-earth hover:bg-earth hover:text-cream transition-colors"
          >
            WhatsApp
          </a>
          <a
            href={`https://twitter.com/intent/tweet?url=${encoded}&text=${encodedText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-3 py-2 rounded-lg text-sm text-earth hover:bg-earth hover:text-cream transition-colors"
          >
            X / Twitter
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encoded}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-3 py-2 rounded-lg text-sm text-earth hover:bg-earth hover:text-cream transition-colors"
          >
            Facebook
          </a>
          <a
            href={`https://pinterest.com/pin/create/button/?url=${encoded}&description=${encodedText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-3 py-2 rounded-lg text-sm text-earth hover:bg-earth hover:text-cream transition-colors"
          >
            Pinterest
          </a>
          <a
            href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodedText}%20${encoded}`}
            className="block px-3 py-2 rounded-lg text-sm text-earth hover:bg-earth hover:text-cream transition-colors"
          >
            Email
          </a>
          <button
            type="button"
            onClick={handleCopy}
            className="w-full text-left block px-3 py-2 rounded-lg text-sm text-earth hover:bg-earth hover:text-cream transition-colors"
          >
            {copied ? "Link copied ✓" : "Copy link"}
          </button>
        </div>
      )}
    </div>
  );
}
