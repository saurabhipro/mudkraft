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

/** Expects the already-validated 6-digit PIN; anything else is ineligible. */
export function isCodEligible(postalCode: string): boolean {
  const pin = postalCode.trim();
  if (!/^[1-9]\d{5}$/.test(pin)) return false;
  return COD_PIN_PREFIXES.some((prefix) => pin.startsWith(prefix));
}
