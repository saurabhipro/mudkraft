/**
 * One source for the delivery and returns promises. Every page that states one imports it from here,
 * so the shipping page, FAQ, trust page and product pages cannot disagree.
 */
export const POLICY = {
  delivery: "Free delivery across India, included in the price",
  dispatch: "2–3 working days",
  packing: "cushioned recycled paper and a double-walled carton",
  breakage:
    "If a piece arrives cracked or broken, share an unboxing photo or video within 48 hours on WhatsApp and we will send a free replacement or a full refund.",
  returnDays: 7,
  refundDays: 5,
  cod: "Cash on delivery is available across India.",
  payments: "UPI, cards and net banking online, or cash on delivery.",
} as const;

export const SHIP_ZONES: { zone: string; days: string }[] = [
  { zone: "Delhi NCR", days: "2–4 working days" },
  { zone: "North India", days: "3–6 working days" },
  { zone: "Rest of India", days: "5–9 working days" },
];
