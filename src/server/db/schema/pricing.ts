import { relations, sql } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth";
import type { ZoneRate } from "@/server/pricing/types";

/**
 * A versioned snapshot of every assumption that feeds the price formula.
 *
 * Prices are derived, not typed in — so a price is only meaningful alongside
 * the assumptions that produced it. Products reference the config they were
 * priced under, which makes any past price reproducible and lets an admin see
 * exactly why a number is what it is. Editing rates creates a new version
 * rather than mutating an existing one.
 */
export const pricingConfig = pgTable(
  "pricing_config",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    version: integer("version").notNull().unique(),
    label: text("label").notNull(),

    /** Shiprocket volumetric divisor: L x B x H (cm) / divisor = billable kg. */
    volumetricDivisor: integer("volumetric_divisor").notNull().default(5000),
    /** Cushioning per side, added to product dimensions to derive box size. */
    packingPaddingMm: integer("packing_padding_mm").notNull().default(50),

    /** Percentages as integer basis points; 1800 = 18.00%. */
    shippingGstBps: integer("shipping_gst_bps").notNull().default(1800),
    marginBps: integer("margin_bps").notNull().default(5000),
    breakageBps: integer("breakage_bps").notNull().default(800),
    breakageIncludesShipping: boolean("breakage_includes_shipping").notNull().default(true),
    plannedDiscountBps: integer("planned_discount_bps").notNull().default(3000),

    /** Final price rounds up to a multiple of this; 1000 paise = ₹10. */
    roundToPaise: integer("round_to_paise").notNull().default(1000),

    /** Slab rates and assumed order-volume share per delivery zone. */
    zones: jsonb("zones").$type<ZoneRate[]>().notNull(),

    isActive: boolean("is_active").notNull().default(false),
    notes: text("notes"),

    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    /** Exactly one config can be active at a time, enforced by the database. */
    uniqueIndex("pricing_config_one_active_idx")
      .on(t.isActive)
      .where(sql`${t.isActive}`),
  ],
);

export const pricingConfigRelations = relations(pricingConfig, ({ one }) => ({
  author: one(user, { fields: [pricingConfig.createdBy], references: [user.id] }),
}));
