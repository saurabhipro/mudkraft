import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgSequence,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth";
import { product } from "./catalog";

/**
 * Mirrors the five-stage narrative already written into the track page, plus
 * the two terminal states an order can fall into.
 */
export const orderStatus = pgEnum("order_status", [
  "pending",
  "confirmed",
  "crafting",
  "dispatched",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "refunded",
]);

export const paymentStatus = pgEnum("payment_status", ["unpaid", "paid", "failed", "refunded"]);

/**
 * Lifecycle of a single payment attempt. `created` means a gateway order was
 * minted and the customer was (or still is) looking at the payment UI; it is
 * the only state an attempt can move out of.
 */
export const paymentTxnStatus = pgEnum("payment_txn_status", [
  "created",
  "captured",
  "failed",
  "refunded",
]);

/** Produces human-readable order numbers (MK-1000, MK-1001, …). */
export const orderNumberSeq = pgSequence("order_number_seq", { startWith: 1000, increment: 1 });

// ---------------------------------------------------------------------------
// Server-side cart — created only once a user signs in. Anonymous carts live
// in the browser until then and are merged into this table at login.
// ---------------------------------------------------------------------------

export const cart = pgTable("cart", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const cartItem = pgTable(
  "cart_item",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cartId: uuid("cart_id")
      .notNull()
      .references(() => cart.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    qty: integer("qty").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("cart_item_qty_positive", sql`${t.qty} > 0`),
    /** One row per product per cart; quantity changes update in place. */
    uniqueIndex("cart_item_unique_product_idx").on(t.cartId, t.productId),
  ],
);

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export const order = pgTable(
  "order",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderNumber: text("order_number")
      .notNull()
      .unique()
      .default(sql`'MK-' || nextval('order_number_seq')`),

    /**
     * Unguessable per-order secret. Order numbers are sequential and emails are
     * often known, so a number+email lookup would let an attacker enumerate
     * other customers' names and addresses. The confirmation link carries this
     * token instead.
     */
    lookupToken: text("lookup_token").notNull().unique(),

    /** Null for guest orders. Set when a signed-in customer checks out. */
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),

    /**
     * Captured at checkout for every order, guest or not, so the record stays
     * reachable even if the account is later deleted.
     */
    contactEmail: text("contact_email"),
    contactPhone: text("contact_phone"),

    shippingName: text("shipping_name").notNull(),
    shippingLine1: text("shipping_line1").notNull(),
    shippingLine2: text("shipping_line2"),
    shippingCity: text("shipping_city").notNull(),
    shippingState: text("shipping_state").notNull(),
    shippingPostalCode: text("shipping_postal_code").notNull(),
    shippingCountry: text("shipping_country").notNull().default("IN"),

    subtotalPaise: integer("subtotal_paise").notNull(),
    shippingPaise: integer("shipping_paise").notNull().default(0),
    discountPaise: integer("discount_paise").notNull().default(0),
    totalPaise: integer("total_paise").notNull(),
    currency: text("currency").notNull().default("INR"),

    status: orderStatus("status").notNull().default("pending"),
    paymentStatus: paymentStatus("payment_status").notNull().default("unpaid"),
    /** `mock` today; swapped for `razorpay`/`stripe` behind the same interface later. */
    paymentProvider: text("payment_provider").notNull().default("mock"),
    paymentRef: text("payment_ref"),

    customerNote: text("customer_note"),
    internalNote: text("internal_note"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    /**
     * An order with neither an email nor a phone is unreachable — we could
     * never send a confirmation or a dispatch update. Guarded in the database
     * rather than only in application code.
     */
    check(
      "order_contact_present",
      sql`${t.contactEmail} IS NOT NULL OR ${t.contactPhone} IS NOT NULL`,
    ),
    check("order_totals_non_negative", sql`${t.subtotalPaise} >= 0 AND ${t.totalPaise} >= 0`),
    index("order_user_idx").on(t.userId, t.createdAt),
    index("order_status_idx").on(t.status, t.createdAt),
    /** Supports the guest lookup fallback on the track page. */
    index("order_contact_email_idx").on(t.contactEmail),
  ],
);

export const orderItem = pgTable(
  "order_item",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => order.id, { onDelete: "cascade" }),

    /**
     * Kept for convenience links only, and nulled rather than cascading if the
     * product is deleted — a historical order must survive catalogue changes.
     */
    productId: uuid("product_id").references(() => product.id, { onDelete: "set null" }),

    /**
     * Snapshot of the product at purchase time. Never join to the live product
     * row to render a past order, or editing a price silently rewrites history.
     */
    productSlug: text("product_slug").notNull(),
    productName: text("product_name").notNull(),
    imagePublicId: text("image_public_id"),
    unitPricePaise: integer("unit_price_paise").notNull(),
    qty: integer("qty").notNull(),
    lineTotalPaise: integer("line_total_paise").notNull(),
  },
  (t) => [
    check("order_item_qty_positive", sql`${t.qty} > 0`),
    index("order_item_order_idx").on(t.orderId),
  ],
);

/** Append-only audit trail; also the data source for the customer-facing timeline. */
export const orderEvent = pgTable(
  "order_event",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => order.id, { onDelete: "cascade" }),
    status: orderStatus("status").notNull(),
    note: text("note"),
    /** Null when the transition was made by the system rather than an admin. */
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("order_event_order_idx").on(t.orderId, t.createdAt)],
);

export const shipment = pgTable(
  "shipment",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => order.id, { onDelete: "cascade" }),
    /** Matches the courier ids offered on the track page. */
    courier: text("courier").notNull(),
    awb: text("awb").notNull(),
    trackingUrl: text("tracking_url"),
    dispatchedAt: timestamp("dispatched_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("shipment_order_idx").on(t.orderId)],
);

/**
 * One row per payment attempt, append-style. An order may accumulate several —
 * a failed card, then a successful UPI — and each keeps its own row; a retry
 * never overwrites history. `order.paymentStatus`/`paymentRef` remain the
 * denormalised summary the rest of the app reads.
 *
 * The FK cascades to match the other order children, but an order with a
 * `captured` transaction represents real money and must never be deleted —
 * any future admin delete must refuse in that case.
 */
export const paymentTransaction = pgTable(
  "payment_transaction",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => order.id, { onDelete: "cascade" }),

    provider: text("provider").notNull().default("razorpay"),
    /** Razorpay's `order_...` id — the key the webhook looks attempts up by. */
    providerOrderId: text("provider_order_id").notNull(),
    /** Razorpay's `pay_...` id, set once the customer actually attempted payment. */
    providerPaymentId: text("provider_payment_id").unique(),

    status: paymentTxnStatus("status").notNull().default("created"),

    /**
     * Snapshot of what this attempt was for. Verified against the amount
     * Razorpay reports before the order is ever marked paid.
     */
    amountPaise: integer("amount_paise").notNull(),
    currency: text("currency").notNull().default("INR"),

    /** `upi` / `card` / `netbanking` / `wallet`, from Razorpay's payment entity. */
    method: text("method"),
    /** Masked detail for support: UPI VPA or card network + last 4. */
    methodDetail: text("method_detail"),

    errorCode: text("error_code"),
    errorDescription: text("error_description"),

    /** Which verified path settled it: `handler` (browser callback) or `webhook`. */
    confirmedVia: text("confirmed_via"),
    /** The verified Razorpay payment entity, kept whole for audits and disputes. */
    rawPayload: jsonb("raw_payload"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("payment_txn_amount_positive", sql`${t.amountPaise} > 0`),
    index("payment_txn_order_idx").on(t.orderId, t.createdAt),
    index("payment_txn_provider_order_idx").on(t.providerOrderId),
  ],
);

/**
 * One-time delivery verification: a QR printed at dispatch and pasted on the
 * box resolves to `/verify/<token>`; the customer proves receipt with an OTP
 * sent to the phone the order was placed with. `verifiedAt` is set exactly
 * once — after that the page only ever says "already verified".
 *
 * Only the OTP's hash is stored, salted with the token; the code itself never
 * touches the database.
 */
export const deliveryVerification = pgTable(
  "delivery_verification",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .unique()
      .references(() => order.id, { onDelete: "cascade" }),

    /** Unguessable QR payload, same trust model as `order.lookupToken`. */
    token: text("token").notNull().unique(),

    otpHash: text("otp_hash"),
    otpExpiresAt: timestamp("otp_expires_at", { withTimezone: true }),
    /** Lifetime counters, not per-OTP: the brakes on SMS abuse and brute force. */
    sendCount: integer("send_count").notNull().default(0),
    attemptCount: integer("attempt_count").notNull().default(0),
    lastSentAt: timestamp("last_sent_at", { withTimezone: true }),

    verifiedAt: timestamp("verified_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
);

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const cartRelations = relations(cart, ({ one, many }) => ({
  user: one(user, { fields: [cart.userId], references: [user.id] }),
  items: many(cartItem),
}));

export const cartItemRelations = relations(cartItem, ({ one }) => ({
  cart: one(cart, { fields: [cartItem.cartId], references: [cart.id] }),
  product: one(product, { fields: [cartItem.productId], references: [product.id] }),
}));

export const orderRelations = relations(order, ({ one, many }) => ({
  user: one(user, { fields: [order.userId], references: [user.id] }),
  items: many(orderItem),
  events: many(orderEvent),
  shipments: many(shipment),
  transactions: many(paymentTransaction),
  deliveryVerification: one(deliveryVerification),
}));

export const deliveryVerificationRelations = relations(deliveryVerification, ({ one }) => ({
  order: one(order, { fields: [deliveryVerification.orderId], references: [order.id] }),
}));

export const paymentTransactionRelations = relations(paymentTransaction, ({ one }) => ({
  order: one(order, { fields: [paymentTransaction.orderId], references: [order.id] }),
}));

export const orderItemRelations = relations(orderItem, ({ one }) => ({
  order: one(order, { fields: [orderItem.orderId], references: [order.id] }),
  product: one(product, { fields: [orderItem.productId], references: [product.id] }),
}));

export const orderEventRelations = relations(orderEvent, ({ one }) => ({
  order: one(order, { fields: [orderEvent.orderId], references: [order.id] }),
}));

export const shipmentRelations = relations(shipment, ({ one }) => ({
  order: one(order, { fields: [shipment.orderId], references: [order.id] }),
}));
