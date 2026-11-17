import type { DeliveryTerms } from "@/lib/delivery";
import { POLICY } from "@/lib/policy";
import type { ProductView } from "@/lib/product-view";
import { SITE_URL } from "@/lib/seo";

/** Schema.org pieces shared by the product pages and the home page, all read from the policy file. */

export const availability = (stockQty: number) =>
  stockQty > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";

const days = (min: number, max: number) => ({ "@type": "QuantitativeValue", minValue: min, maxValue: max, unitCode: "DAY" });

/** What delivery adds to the price, or null when no single figure is true (priced per PIN code). */
export function shippingRatePaise(terms: DeliveryTerms): number | null {
  if (terms.mode === "included") return 0;
  if (terms.mode === "flat") return terms.feePaise;
  return null;
}

export const shippingDetails = (terms: DeliveryTerms) => ({
  "@type": "OfferShippingDetails",
  // Per PIN code there is no one true rate, so none is stated. A flat fee is stated in full, even
  // where an order may cross the free threshold: overstating is safe, understating is not.
  shippingRate:
    shippingRatePaise(terms) === null
      ? undefined
      : { "@type": "MonetaryAmount", value: (shippingRatePaise(terms)! / 100).toFixed(2), currency: "INR" },
  shippingDestination: { "@type": "DefinedRegion", addressCountry: "IN" },
  deliveryTime: {
    "@type": "ShippingDeliveryTime",
    handlingTime: days(2, 3),
    transitTime: days(2, 9),
  },
});

export const returnPolicy = {
  "@type": "MerchantReturnPolicy",
  applicableCountry: "IN",
  returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
  merchantReturnDays: POLICY.returnDays,
  returnMethod: "https://schema.org/ReturnByMail",
  merchantReturnLink: `${SITE_URL}/shipping-returns`,
};

/** A year from now, as a date: Google wants an expiry on prices it shows. */
export const priceValidUntil = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
};

/**
 * Id shared by the sizes of one piece, or null for a piece with a single size. A product type can
 * hold different pieces (Handi and Dahi Handi), so siblings are told apart by name, where a
 * suffix like "· Small" still counts as the same piece.
 */
export function variantGroupId(p: ProductView, siblings: ProductView[]): string | null {
  const base = (name: string) => name.split("·")[0].trim().toLowerCase();
  const same = siblings.filter((s) => base(s.name) === base(p.name));
  return same.length > 1 ? `mudkraft-${base(p.name).replace(/[^a-z0-9]+/g, "-")}` : null;
}

export function breadcrumbs(trail: Array<{ name: string; url: string }>) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({ "@type": "ListItem", position: i + 1, name: t.name, item: t.url })),
  };
}
