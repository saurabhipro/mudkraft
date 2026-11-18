import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth";

/**
 * The delivery address a signed-in customer last used, kept so checkout can
 * fill it in next time.
 *
 * Its own table rather than a read of the latest `order` row: in Bikriup mode
 * orders live in Bikriup, so the local order table is empty in production.
 * One row per user, overwritten by every order.
 */
export const customerAddress = pgTable("customer_address", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  line1: text("line1").notNull(),
  line2: text("line2").notNull().default(""),
  city: text("city").notNull(),
  state: text("state").notNull(),
  postalCode: text("postal_code").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
