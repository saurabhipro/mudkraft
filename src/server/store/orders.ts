import { desc, eq } from "drizzle-orm";

import { bikriupEnabled, getBikriupOrder, siteOrderStatus, sitePaymentProvider, sitePaymentStatus } from "../bikriup";
import { db } from "../db";
import { deliveryVerification, order } from "../db/schema/orders";

/**
 * Order reads for the customer-facing checkout pages.
 *
 * Deliberately uncached, for the same reason as `admin.ts`: someone who has just
 * paid must see the paid order, not a cached copy of the unpaid one they left a
 * second ago. Orders are also read far less often than the catalogue, so there
 * is nothing here worth caching.
 *
 * Every lookup is by `lookupToken`. Order numbers are sequential and emails are
 * often known, so a number-based URL would let an attacker walk the sequence and
 * read other customers' names and addresses.
 */

export interface OrderSummaryItem {
  productSlug: string;
  productName: string;
  imagePublicId: string | null;
  unitPricePaise: number;
  qty: number;
  lineTotalPaise: number;
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  lookupToken: string;
  status: (typeof order.$inferSelect)["status"];
  paymentStatus: (typeof order.$inferSelect)["paymentStatus"];
  paymentProvider: string;
  contactEmail: string | null;
  contactPhone: string | null;
  shippingName: string;
  shippingLine1: string;
  shippingLine2: string | null;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  subtotalPaise: number;
  shippingPaise: number;
  totalPaise: number;
  customerNote: string | null;
  createdAt: Date;
  items: OrderSummaryItem[];
  /** Orders kept in Bikriup: where the parcel is, the invoice and any refund. */
  tracking?: OrderTracking;
}

export interface OrderTracking {
  statusLabel: string;
  courier: string;
  trackingNo: string;
  trackingUrl: string;
  invoiceUrl: string;
  refund: "" | "due" | "done";
}

export interface SavedAddress {
  name: string;
  phone: string | null;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
}

/**
 * The address this customer last shipped to, for pre-filling checkout.
 *
 * Matched strictly on `userId`, never on email. `order.userId` is set only when
 * a signed-in customer checks out, so a guest who typed someone else's email can
 * never cause that person's address to appear in their form. Guests get no
 * prefill at all, by design — there is nothing to match them on that could not
 * be typed by anyone.
 *
 * Reads the most recent order, so a customer who ships a gift elsewhere will see
 * the gift address next time. That is the known cost of not having an address
 * book, and it is visible and editable rather than silent.
 */
export async function getSavedAddressForUser(userId: string): Promise<SavedAddress | null> {
  // Served by order_user_idx on (user_id, created_at).
  const row = await db.query.order.findFirst({
    where: eq(order.userId, userId),
    orderBy: [desc(order.createdAt)],
    columns: {
      shippingName: true,
      contactPhone: true,
      shippingLine1: true,
      shippingLine2: true,
      shippingCity: true,
      shippingState: true,
      shippingPostalCode: true,
    },
  });

  if (!row) return null;

  return {
    name: row.shippingName,
    phone: row.contactPhone,
    line1: row.shippingLine1,
    line2: row.shippingLine2 ?? "",
    city: row.shippingCity,
    state: row.shippingState,
    postalCode: row.shippingPostalCode,
  };
}

export interface DeliveryVerificationView {
  state: "pending" | "verified";
  orderNumber: string;
  customerFirstName: string;
  /** Only ever the masked form; the full number never leaves the server. */
  maskedPhone: string | null;
  verifiedAt: Date | null;
}

function maskPhone(phone: string): string {
  // Stored shape is +91XXXXXXXXXX; show just enough for the customer to
  // recognise their own number.
  const digits = phone.replace(/^\+91/, "");
  if (digits.length !== 10) return "•••";
  return `+91 ${digits[0]}•••••••${digits.slice(8)}`;
}

export async function getDeliveryVerificationByToken(
  token: string,
): Promise<DeliveryVerificationView | null> {
  if (!token || token.length > 200) return null;

  const row = await db.query.deliveryVerification.findFirst({
    where: eq(deliveryVerification.token, token),
    columns: { verifiedAt: true },
    with: {
      order: { columns: { orderNumber: true, shippingName: true, contactPhone: true } },
    },
  });

  if (!row) return null;

  return {
    state: row.verifiedAt ? "verified" : "pending",
    orderNumber: row.order.orderNumber,
    customerFirstName: row.order.shippingName.split(" ")[0] ?? "there",
    maskedPhone: row.order.contactPhone ? maskPhone(row.order.contactPhone) : null,
    verifiedAt: row.verifiedAt,
  };
}

export async function getOrderByToken(token: string): Promise<OrderSummary | null> {
  // A malformed token can never match, and refusing it early keeps obviously
  // junk values from reaching the database at all.
  if (!token || token.length > 200) return null;

  // Orders live in Bikriup once it is switched on; the token is a signed order reference.
  if (bikriupEnabled()) {
    const o = await getBikriupOrder(token);
    if (!o) return null;
    const [line1, ...rest] = o.address.split("\n");
    return {
      id: o.order_no,
      orderNumber: o.order_no,
      lookupToken: token,
      status: siteOrderStatus(o),
      paymentStatus: sitePaymentStatus(o),
      paymentProvider: sitePaymentProvider(o),
      contactEmail: null,
      contactPhone: `+91${o.phone}`,
      shippingName: o.customer_name,
      shippingLine1: line1 ?? "",
      shippingLine2: rest.join(", ") || null,
      shippingCity: o.city,
      shippingState: "",
      shippingPostalCode: o.pincode,
      subtotalPaise: Math.round(o.subtotal * 100),
      shippingPaise: Math.round(o.delivery * 100),
      totalPaise: Math.round(o.total * 100),
      customerNote: null,
      createdAt: new Date(o.created_at),
      tracking: {
        statusLabel: o.status_label,
        courier: o.courier ?? "",
        trackingNo: o.tracking_no ?? "",
        trackingUrl: o.tracking_url ?? "",
        invoiceUrl: o.invoice_url ?? "",
        refund:
          o.payment_status === "refund_due" ? "due" : o.payment_status === "refunded" ? "done" : "",
      },
      items: o.items.map((item) => ({
        productSlug: "",
        productName: [item.name, item.size].filter(Boolean).join(" "),
        imagePublicId: null,
        unitPricePaise: Math.round(item.price * 100),
        qty: item.qty,
        lineTotalPaise: Math.round(item.line_total * 100),
      })),
    };
  }

  const row = await db.query.order.findFirst({
    where: eq(order.lookupToken, token),
    with: { items: true },
  });

  if (!row) return null;

  return {
    id: row.id,
    orderNumber: row.orderNumber,
    lookupToken: row.lookupToken,
    status: row.status,
    paymentStatus: row.paymentStatus,
    paymentProvider: row.paymentProvider,
    contactEmail: row.contactEmail,
    contactPhone: row.contactPhone,
    shippingName: row.shippingName,
    shippingLine1: row.shippingLine1,
    shippingLine2: row.shippingLine2,
    shippingCity: row.shippingCity,
    shippingState: row.shippingState,
    shippingPostalCode: row.shippingPostalCode,
    subtotalPaise: row.subtotalPaise,
    shippingPaise: row.shippingPaise,
    totalPaise: row.totalPaise,
    customerNote: row.customerNote,
    createdAt: row.createdAt,
    items: row.items.map((item) => ({
      productSlug: item.productSlug,
      productName: item.productName,
      imagePublicId: item.imagePublicId,
      unitPricePaise: item.unitPricePaise,
      qty: item.qty,
      lineTotalPaise: item.lineTotalPaise,
    })),
  };
}
