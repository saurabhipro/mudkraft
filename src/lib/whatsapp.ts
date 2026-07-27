/**
 * WhatsApp is the studio's primary customer channel, so its number appears on
 * the home page, every product page and the order confirmation. One definition
 * here means changing it is one edit rather than a search.
 *
 * Message copy deliberately stays with each caller — the wording belongs next to
 * the screen it is sent from. Only the number and the link shape live here.
 */

/** Country code and number, no `+` or spaces — the format wa.me expects. */
export const WHATSAPP_NUMBER = "919990649990";

/**
 * Builds a wa.me deep link with a prefilled message.
 *
 * Takes lines rather than a single string because every message in the app is
 * composed as lines, and joining them here keeps the newline handling — which
 * must survive URL encoding — in exactly one place.
 */
export function whatsappLink(lines: string[]): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
}
