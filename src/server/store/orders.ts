import { desc, eq } from "drizzle-orm";

import { db } from "../db";
import { order } from "../db/schema/orders";

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

export async function getOrderByToken(token: string): Promise<OrderSummary | null> {
  // A malformed token can never match, and refusing it early keeps obviously
  // junk values from reaching the database at all.
  if (!token || token.length > 200) return null;

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
