import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { pricingConfig } from "./pricing";

export const productStatus = pgEnum("product_status", ["draft", "active", "archived"]);
export const mediaType = pgEnum("media_type", ["image", "video"]);

/**
 * How a product reaches the customer. This is a pricing input, not merely a
 * display flag — a pickup-only piece must not carry national freight in its
 * price, which is what makes the heavy water tanks viable at all.
 */
export const fulfilmentMode = pgEnum("fulfilment_mode", [
  "ship_nationwide",
  "local_delivery_only",
  "pickup_only",
]);

export const category = pgTable("category", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const product = pgTable(
  "product",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Public identifier — existing URLs like /shop/surahi-matka depend on this. */
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    /** Short qualifier shown under the name, e.g. "Tea Cup · Set of 6". */
    tag: text("tag").notNull().default(""),
    /** One-line poetic note used on listing cards. */
    note: text("note").notNull().default(""),
    description: text("description").notNull().default(""),
    story: text("story").notNull().default(""),

    /** Free-text size shown next to the name, e.g. "4 L", "750 g", "Set of 6". */
    sizeLabel: text("size_label").notNull().default(""),

    // -- Price (derived from the cost inputs below; see src/server/pricing) --
    /**
     * Money is stored as integer paise. Never float — binary floating point
     * cannot represent decimal currency exactly and the error compounds
     * across line totals.
     *
     * This is an OUTPUT of the pricing formula, persisted rather than computed
     * on read: a customer must never see the price move mid-session because an
     * assumption changed underneath them.
     */
    pricePaise: integer("price_paise").notNull(),
    /** Struck-through "was" price (MRP), also in paise. */
    compareAtPaise: integer("compare_at_paise"),

    // ---------------- Cost inputs (what the costing sheet supplies) ---------
    mfgCostPaise: integer("mfg_cost_paise").notNull().default(0),
    packingCostPaise: integer("packing_cost_paise").notNull().default(0),
    productLengthMm: integer("product_length_mm"),
    productWidthMm: integer("product_width_mm"),
    productHeightMm: integer("product_height_mm"),
    packedWeightGrams: integer("packed_weight_grams"),
    /**
     * False until someone has weighed and measured a real packed unit. The
     * source workbook is explicit that its dimensions and weights are
     * estimates, and freight is billed on volume — so an unverified box size
     * is an unverified price.
     */
    measurementsVerified: boolean("measurements_verified").notNull().default(false),

    fulfilmentMode: fulfilmentMode("fulfilment_mode").notNull().default("ship_nationwide"),

    // ---------------- Derived, recomputed when inputs or config change ------
    chargeableWeightGrams: integer("chargeable_weight_grams"),
    blendedShippingPaise: integer("blended_shipping_paise"),
    breakageProvisionPaise: integer("breakage_provision_paise"),
    totalCostPaise: integer("total_cost_paise"),
    /** Which assumption set produced the stored price. Makes it reproducible. */
    pricingConfigId: uuid("pricing_config_id").references(() => pricingConfig.id, {
      onDelete: "set null",
    }),
    pricedAt: timestamp("priced_at", { withTimezone: true }),

    categoryId: uuid("category_id").references(() => category.id, { onDelete: "set null" }),

    status: productStatus("status").notNull().default("draft"),
    stockQty: integer("stock_qty").notNull().default(0),
    trackInventory: boolean("track_inventory").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),

    /**
     * Ordered label/value pairs. Stored as jsonb rather than a child table:
     * they are only ever read and written as a whole list alongside the
     * product, never queried or filtered on independently.
     */
    specs: jsonb("specs")
      .$type<Array<{ label: string; value: string }>>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    /** Ordered care instructions, same reasoning as specs. */
    care: text("care")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("product_status_idx").on(t.status),
    index("product_category_idx").on(t.categoryId),
  ],
);

export const productImage = pgTable(
  "product_image",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),

    /**
     * We persist Cloudinary's public_id and version rather than a full URL, so
     * that transformations, CDN hostname changes or a folder reorganisation
     * never require a data migration.
     */
    publicId: text("public_id").notNull(),
    version: text("version"),
    resourceType: mediaType("resource_type").notNull().default("image"),
    format: text("format"),
    width: integer("width"),
    height: integer("height"),
    alt: text("alt").notNull().default(""),
    isPrimary: boolean("is_primary").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("product_image_product_idx").on(t.productId, t.sortOrder),
    /** At most one primary image per product, enforced by the database. */
    uniqueIndex("product_image_one_primary_idx")
      .on(t.productId)
      .where(sql`${t.isPrimary}`),
  ],
);

export const categoryRelations = relations(category, ({ many }) => ({
  products: many(product),
}));

export const productRelations = relations(product, ({ one, many }) => ({
  category: one(category, { fields: [product.categoryId], references: [category.id] }),
  pricingConfig: one(pricingConfig, {
    fields: [product.pricingConfigId],
    references: [pricingConfig.id],
  }),
  images: many(productImage),
}));

export const productImageRelations = relations(productImage, ({ one }) => ({
  product: one(product, { fields: [productImage.productId], references: [product.id] }),
}));
