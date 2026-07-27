import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
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
