import { formatPaise } from "@/lib/money";
import { SITE_URL } from "@/lib/seo";

import { orderToken } from "../bikriup";
import type { WhatsAppMessage } from ".";

/**
 * Which WhatsApp message each Bikriup order step sends: every step the studio
 * takes on a web order (Billing › Orders) reaches the buyer, the same steps the
 * order emails cover plus packed, returning-to-studio and payment receipts.
 */

export interface OrderEvent {
  order_no?: string;
  status?: string;
  payment_status?: string;
  payment_method?: string;
  change?: string;
  customer_name?: string;
  phone?: string;
  total?: number;
  courier?: string;
  tracking_no?: string;
  tracking_url?: string;
  invoice_url?: string;
}

const firstName = (name: string | undefined) => (name ?? "").trim().split(/\s+/)[0] || "there";

/** The message for a new order, sent by checkout itself (Bikriup has no event for it). */
export function orderReceived(
  name: string,
  orderNo: string,
  totalPaise: number,
  token: string,
): WhatsAppMessage {
  return {
    template: "received",
    body: [firstName(name), orderNo, formatPaise(totalPaise)],
    button: token,
  };
}

export function orderStepMessage(o: OrderEvent): WhatsAppMessage | null {
  const no = o.order_no ?? "";
  if (!no || !o.phone) return null;
  const name = firstName(o.customer_name);
  const token = orderToken(no, o.phone);
  const amount = typeof o.total === "number" ? formatPaise(Math.round(o.total * 100)) : "";
  const cod = o.payment_method === "cod";

  if (o.change === "payment") {
    switch (o.payment_status) {
      // COD marked paid is the courier's cash reaching the studio: nothing new for the buyer.
      case "paid":
        return cod ? null : { template: "paid", body: [name, amount, no], button: token };
      case "failed":
        return { template: "payment_failed", body: [name, no], button: token };
      case "refunded":
        return { template: "refunded", body: [name, amount, no], button: token };
      default:
        return null;
    }
  }

  const payment =
    o.payment_status === "paid"
      ? "paid, thank you"
      : cod
        ? `cash on delivery, please keep ${amount} ready`
        : `${amount} due, you can pay from the order page`;
  const statusPage = `${SITE_URL}/checkout/done/${token}`;

  switch (o.status) {
    case "confirmed":
      return {
        template: "confirmed",
        body: [name, no, payment, o.invoice_url || statusPage],
        button: token,
      };
    case "packed":
      return { template: "packed", body: [name, no], button: token };
    case "shipped":
      return {
        template: "shipped",
        body: [
          name,
          no,
          !o.courier
            ? "our courier"
            : o.courier === "Shop delivery"
              ? "our own delivery team"
              : o.courier,
          o.tracking_no || "shared on the order page",
          o.tracking_url || statusPage,
        ],
        button: token,
      };
    case "out_for_delivery":
      return { template: "out_for_delivery", body: [name, no, payment], button: token };
    case "delivery_failed":
      return { template: "delivery_failed", body: [name, no], button: token };
    case "delivered":
      return { template: "delivered", body: [name, no] };
    case "rto":
      return { template: "rto", body: [name, no], button: token };
    case "cancelled":
      return {
        template: "cancelled",
        body: [
          name,
          no,
          o.payment_status === "refund_due"
            ? `${amount} will reach your original payment method in 5–7 working days`
            : "nothing was charged, so no refund is due",
        ],
        button: token,
      };
    case "return_requested":
      return { template: "return_requested", body: [name, no], button: token };
    case "return_received":
      return { template: "return_received", body: [name, no], button: token };
    // A parcel back from the courier (RTO) also ends here; with no money to return the
    // buyer was already told by the RTO message.
    case "returned":
      if (o.payment_status !== "refund_due") return null;
      return {
        template: "returned",
        body: [name, no, "it is being processed and we will message you when it is sent"],
        button: token,
      };
    default:
      return null;
  }
}
