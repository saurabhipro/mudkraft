/**
 * The WhatsApp message templates the site sends. Meta must approve each one
 * before it can be sent, so the wording lives here once: `npm run whatsapp:templates`
 * submits these to Meta, and the sender fills the same {{n}} slots in order.
 *
 * Keep UTILITY templates strictly about the order (no offers, no "shop now"):
 * Meta re-files promotional wording as MARKETING, which costs about 7× more.
 *
 * Pure data on purpose: the submit script imports it outside Next.
 */

export type TemplateButton =
  /** A link whose last part ({{1}}) is filled per message, e.g. the order's status page. */
  | { type: "url"; text: string; path: string; example: string }
  /** A fixed link, the same for everyone. */
  | { type: "static"; text: string; path: string }
  /** Tap to copy a code (MARKETING only). */
  | { type: "copy_code"; example: string };

export interface TemplateDef {
  name: string;
  category: "UTILITY" | "MARKETING";
  body: string;
  /** One example per {{n}} in the body, in order. Meta reviews the template with these. */
  example: string[];
  button?: TemplateButton;
}

const ORDER_PAGE = {
  type: "url",
  text: "View order",
  path: "/checkout/done/{{1}}",
  example: "TUstMTAyNC45ODc2NTQzMjEw.x",
} as const;

export const TEMPLATES = {
  received: {
    name: "mk_order_received",
    category: "UTILITY",
    body: "Hi {{1}}, thank you for your order {{2}} of {{3}} at Mudkraft. We will confirm it shortly and keep you posted here at every step.",
    example: ["Asha", "MK-1024", "₹1,200"],
    button: ORDER_PAGE,
  },
  paid: {
    name: "mk_payment_received",
    category: "UTILITY",
    body: "Hi {{1}}, we have received your payment of {{2}} for order {{3}}. Thank you.",
    example: ["Asha", "₹1,200", "MK-1024"],
    button: ORDER_PAGE,
  },
  payment_failed: {
    name: "mk_payment_failed",
    category: "UTILITY",
    body: "Hi {{1}}, the payment for your order {{2}} did not go through. Your order is held for you, and you can try again with the button below.",
    example: ["Asha", "MK-1024"],
    button: {
      type: "url",
      text: "Pay now",
      path: "/checkout/pay/{{1}}",
      example: "TUstMTAyNC45ODc2NTQzMjEw.x",
    },
  },
  confirmed: {
    name: "mk_order_confirmed",
    category: "UTILITY",
    body: "Hi {{1}}, your order {{2}} is confirmed and we are packing it by hand.\n\nPayment: {{3}}.\nInvoice: {{4}}\n\nWe will message you again when it ships.",
    example: [
      "Asha",
      "MK-1024",
      "cash on delivery, please keep ₹1,200 ready",
      "https://mudkraft.bikriup.com/bill/mudkraft/MK-1024/a1b2c3.pdf",
    ],
    button: ORDER_PAGE,
  },
  packed: {
    name: "mk_order_packed",
    category: "UTILITY",
    body: "Hi {{1}}, your order {{2}} is packed and will be handed to the courier soon. We will send the tracking details as soon as it ships.",
    example: ["Asha", "MK-1024"],
    button: ORDER_PAGE,
  },
  shipped: {
    name: "mk_order_shipped",
    category: "UTILITY",
    body: "Hi {{1}}, your order {{2}} has left the studio with {{3}}.\n\nTracking number: {{4}}\nTrack it here: {{5}}\n\nHandle with care when it arrives, it is handmade clay.",
    example: [
      "Asha",
      "MK-1024",
      "Delhivery",
      "1234567890",
      "https://www.delhivery.com/track/package/1234567890",
    ],
    button: ORDER_PAGE,
  },
  out_for_delivery: {
    name: "mk_order_out_for_delivery",
    category: "UTILITY",
    body: "Hi {{1}}, your order {{2}} is out for delivery today.\n\nPayment: {{3}}.\n\nPlease keep your phone handy for the delivery partner's call.",
    example: ["Asha", "MK-1024", "cash on delivery, please keep ₹1,200 ready"],
    button: ORDER_PAGE,
  },
  delivery_failed: {
    name: "mk_delivery_failed",
    category: "UTILITY",
    body: "Hi {{1}}, the courier could not deliver your order {{2}}. Please reply here with a good time or a corrected address, and we will arrange another attempt.",
    example: ["Asha", "MK-1024"],
    button: ORDER_PAGE,
  },
  delivered: {
    name: "mk_order_delivered",
    category: "UTILITY",
    body: "Hi {{1}}, your order {{2}} has been delivered. Please season your clay before its first use; the care guide is linked below. If anything arrived broken, reply here with a photo within 7 days.",
    example: ["Asha", "MK-1024"],
    button: { type: "static", text: "Care guide", path: "/care/season-your-handi" },
  },
  rto: {
    name: "mk_order_returning",
    category: "UTILITY",
    body: "Hi {{1}}, your order {{2}} could not be delivered and is on its way back to our studio. Reply here if you would still like it delivered.",
    example: ["Asha", "MK-1024"],
    button: ORDER_PAGE,
  },
  cancelled: {
    name: "mk_order_cancelled",
    category: "UTILITY",
    body: "Hi {{1}}, your order {{2}} has been cancelled.\n\nRefund: {{3}}.\n\nReply here if you have any questions.",
    example: [
      "Asha",
      "MK-1024",
      "₹1,200 will reach your original payment method in 5–7 working days",
    ],
    button: ORDER_PAGE,
  },
  return_requested: {
    name: "mk_return_requested",
    category: "UTILITY",
    body: "Hi {{1}}, we have your return request for order {{2}}. We will message you here to arrange the pickup.",
    example: ["Asha", "MK-1024"],
    button: ORDER_PAGE,
  },
  return_received: {
    name: "mk_return_received",
    category: "UTILITY",
    body: "Hi {{1}}, the returned pieces from order {{2}} have reached our studio. We will check them and update you about the refund.",
    example: ["Asha", "MK-1024"],
    button: ORDER_PAGE,
  },
  returned: {
    name: "mk_return_complete",
    category: "UTILITY",
    body: "Hi {{1}}, the return for order {{2}} is complete.\n\nRefund: {{3}}.\n\nThank you for your patience.",
    example: [
      "Asha",
      "MK-1024",
      "₹1,200 will reach your original payment method in 5–7 working days",
    ],
    button: ORDER_PAGE,
  },
  refunded: {
    name: "mk_refund_sent",
    category: "UTILITY",
    body: "Hi {{1}}, we have refunded {{2}} for order {{3}}. It can take 5–7 working days to show in your account.",
    example: ["Asha", "₹1,200", "MK-1024"],
    button: ORDER_PAGE,
  },
  welcome: {
    name: "mk_welcome_offer",
    category: "MARKETING",
    body: "Hi {{1}}, welcome to Mudkraft! Here is your code for {{2}}% off your first order of handmade clay cookware: {{3}}. Use it at checkout on our website.",
    example: ["Asha", "10", "WELCOME10"],
    button: { type: "copy_code", example: "WELCOME10" },
  },
} as const satisfies Record<string, TemplateDef>;

export type TemplateKey = keyof typeof TEMPLATES;

/** Meta's language code for every template above. */
export const TEMPLATE_LANGUAGE = "en";

export const GRAPH_URL = "https://graph.facebook.com/v25.0";
