import { POLICY } from "@/lib/policy";
import { SITE_URL } from "@/lib/seo";

/** Schema.org pieces shared by the product pages and the home page, all read from the policy file. */

export const availability = (stockQty: number) =>
  stockQty > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";

const days = (min: number, max: number) => ({ "@type": "QuantitativeValue", minValue: min, maxValue: max, unitCode: "DAY" });

export const shippingDetails = {
  "@type": "OfferShippingDetails",
  shippingRate: { "@type": "MonetaryAmount", value: 0, currency: "INR" },
  shippingDestination: { "@type": "DefinedRegion", addressCountry: "IN" },
  deliveryTime: {
    "@type": "ShippingDeliveryTime",
    handlingTime: days(2, 3),
    transitTime: days(2, 9),
  },
};

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

export function breadcrumbs(trail: Array<{ name: string; url: string }>) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({ "@type": "ListItem", position: i + 1, name: t.name, item: t.url })),
  };
}
