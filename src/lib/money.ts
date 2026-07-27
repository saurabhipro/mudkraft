/**
 * Money is stored and computed as integer paise everywhere. Convert to rupees
 * only at the point of display — never do arithmetic on the formatted value.
 */

const PAISE_PER_RUPEE = 100;

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const inrWithPaiseFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 124_000 -> "₹1,240". Prices are always whole rupees, so paise are hidden. */
export function formatPaise(paise: number): string {
  return inrFormatter.format(paise / PAISE_PER_RUPEE);
}

/** Use where an exact figure matters, such as an invoice line. */
export function formatPaiseExact(paise: number): string {
  return inrWithPaiseFormatter.format(paise / PAISE_PER_RUPEE);
}

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * PAISE_PER_RUPEE);
}

export function paiseToRupees(paise: number): number {
  return paise / PAISE_PER_RUPEE;
}
