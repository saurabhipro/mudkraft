/**
 * All money is integer paise. All rates are integer basis points (1 bps =
 * 0.01%). Nothing in this module uses a floating-point percentage, because
 * currency arithmetic in binary floating point accumulates error across the
 * cost -> margin -> total chain.
 */

export const BPS = 10_000;

export type ZoneCode = "A" | "B" | "C" | "D" | "E";

/**
 * A courier slab rate for one delivery zone, plus that zone's assumed share of
 * order volume. `weightBps` across all zones must sum to exactly BPS.
 */
export interface ZoneRate {
  code: ZoneCode;
  label: string;
  /** Charge for the first 500 g, before GST. */
  firstSlabPaise: number;
  /** Charge for each additional 500 g, before GST. */
  addlSlabPaise: number;
  /** Share of national order volume, in basis points. */
  weightBps: number;
}

export interface PricingAssumptions {
  /** Shiprocket volumetric divisor: L x B x H (cm) / divisor = billable kg. */
  volumetricDivisor: number;
  /** Cushioning added to each side of the product to derive box dimensions. */
  packingPaddingMm: number;
  /** GST charged on courier freight. */
  shippingGstBps: number;
  /** Margin applied to total landed cost. */
  marginBps: number;
  /** Provision for pieces lost to breakage in transit. */
  breakageBps: number;
  /**
   * When true the breakage provision is calculated on goods + freight rather
   * than goods alone. A piece that breaks costs the pot, the freight already
   * spent, and the replacement shipment - so freight belongs in the basis.
   */
  breakageIncludesShipping: boolean;
  /** Headroom built into MRP so a discount can be run without going below price. */
  plannedDiscountBps: number;
  /** Final price is rounded up to a multiple of this many paise. */
  roundToPaise: number;
  zones: ZoneRate[];
}

/**
 * How a product reaches the customer. This is a pricing input, not just a
 * display flag: a pickup-only product must not carry national freight in its
 * price, and a locally-delivered one should carry Zone A freight only.
 */
export type FulfilmentMode = "ship_nationwide" | "local_delivery_only" | "pickup_only";

export interface CostInputs {
  mfgCostPaise: number;
  packingCostPaise: number;
  productLengthMm: number;
  productWidthMm: number;
  productHeightMm: number;
  packedWeightGrams: number;
  fulfilmentMode: FulfilmentMode;
}

export interface PriceBreakdown {
  volumetricWeightGrams: number;
  chargeableWeightGrams: number;
  /** Freight per zone, for admin inspection. Empty when nothing is shipped. */
  zoneShippingPaise: Partial<Record<ZoneCode, number>>;
  /** The single nationwide freight figure folded into the price. */
  blendedShippingPaise: number;
  breakageProvisionPaise: number;
  totalCostPaise: number;
  marginPaise: number;
  /** Before rounding, for audit. */
  rawPricePaise: number;
  /** The customer-facing price. */
  pricePaise: number;
  /** Struck-through "was" price, with discount headroom. */
  mrpPaise: number;
}
