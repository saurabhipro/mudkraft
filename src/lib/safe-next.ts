/** Only same-origin paths are accepted, so `?next=` cannot become an open redirect. */
export function safeNextPath(raw: string | undefined): string {
  if (!raw) return "/";
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return "/";
  return raw;
}
