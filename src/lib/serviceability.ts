/**
 * Where cash on delivery is offered. Shared by the checkout form (to show the
 * option) and `placeOrder` (to enforce it — the client check is UX only).
 *
 * Keyed on the PIN code, never the free-text city/state fields: "Gurugram",
 * "GGN" and "Gurgaon" are the same place, but a PIN is unambiguous.
 */
const COD_PIN_PREFIXES = [
  "110", // Delhi
  "122", // Gurgaon
  "2013", // Noida & Greater Noida
];

export const COD_REGION_LABEL = "Delhi, Noida & Gurgaon";

/**
 * Pay later (cash on delivery) for every PIN code in India, the studio's choice
 * for now (2026-10-28). Set to false to go back to the prefixes above; this is
 * meant to move into an admin setting later.
 */
export const COD_EVERYWHERE = true;

/** Expects the already-validated 6-digit PIN; anything else is ineligible. */
export function isCodEligible(postalCode: string): boolean {
  const pin = postalCode.trim();
  if (!/^[1-9]\d{5}$/.test(pin)) return false;
  if (COD_EVERYWHERE) return true;
  return COD_PIN_PREFIXES.some((prefix) => pin.startsWith(prefix));
}
