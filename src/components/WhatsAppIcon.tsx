/**
 * The WhatsApp glyph, used wherever the studio offers its primary channel —
 * header, footer, product pages and checkout.
 *
 * Always `aria-hidden`: every place it appears sits inside a link or button that
 * already carries its own text, so announcing the icon as well would read the
 * destination twice. If it ever appears alone, give the surrounding control an
 * `aria-label` rather than making this icon speak.
 *
 * No `"use client"` — it renders no state and no handlers, so it stays a server
 * component and is importable from both sides of the boundary.
 */
export function WhatsAppIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.52 3.48A11.86 11.86 0 0 0 12.04 0C5.5 0 .2 5.3.2 11.84c0 2.09.55 4.13 1.6 5.93L0 24l6.4-1.68a11.82 11.82 0 0 0 5.64 1.44h.01c6.54 0 11.84-5.3 11.84-11.84 0-3.16-1.23-6.13-3.37-8.44ZM12.05 21.4h-.01a9.55 9.55 0 0 1-4.87-1.34l-.35-.21-3.8 1 1.02-3.7-.23-.38a9.53 9.53 0 0 1-1.46-5.08c0-5.28 4.3-9.58 9.6-9.58 2.56 0 4.97.99 6.78 2.8a9.53 9.53 0 0 1 2.81 6.79c0 5.28-4.3 9.58-9.59 9.58Zm5.26-7.18c-.29-.14-1.7-.84-1.96-.94-.26-.1-.45-.14-.64.14-.19.29-.74.94-.9 1.13-.17.19-.33.21-.62.07-.29-.14-1.22-.45-2.32-1.43-.86-.77-1.44-1.72-1.6-2-.17-.29-.02-.44.13-.58.13-.13.29-.33.43-.5.14-.17.19-.29.29-.48.1-.19.05-.36-.02-.5-.07-.14-.64-1.54-.88-2.11-.23-.55-.47-.48-.64-.49h-.55c-.19 0-.5.07-.76.36-.26.29-1 .98-1 2.38 0 1.4 1.02 2.75 1.17 2.94.14.19 2.02 3.09 4.9 4.33.68.29 1.22.47 1.63.6.68.22 1.31.19 1.8.11.55-.08 1.7-.7 1.94-1.37.24-.67.24-1.25.17-1.37-.07-.12-.26-.19-.55-.34Z" />
    </svg>
  );
}
