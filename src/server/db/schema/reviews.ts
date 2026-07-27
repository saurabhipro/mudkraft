import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth";
import { product } from "./catalog";

export const reviewStatus = pgEnum("review_status", ["pending", "approved", "rejected"]);

export const review = pgTable(
  "review",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    /** Null for reviews submitted by guests. */
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),

    authorName: text("author_name").notNull(),
    authorCity: text("author_city").notNull().default(""),
    rating: smallint("rating").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    /** Cloudinary public_id of an optional customer photo. */
    photoPublicId: text("photo_public_id"),

    /**
     * Defaults to `pending`. Public queries must filter to `approved` — an
     * unmoderated public review form is a spam and abuse vector.
     */
    status: reviewStatus("status").notNull().default("pending"),
    /** Set by the server when the reviewer has a delivered order for this product. */
    verifiedPurchase: boolean("verified_purchase").notNull().default(false),

    moderatedBy: text("moderated_by").references(() => user.id, { onDelete: "set null" }),
    moderatedAt: timestamp("moderated_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("review_rating_range", sql`${t.rating} BETWEEN 1 AND 5`),
    /** Drives the public product page: approved reviews, newest first. */
    index("review_product_status_idx").on(t.productId, t.status, t.createdAt),
    /** Drives the admin moderation queue. */
    index("review_status_idx").on(t.status, t.createdAt),
  ],
);

export const reviewRelations = relations(review, ({ one }) => ({
  product: one(product, { fields: [review.productId], references: [product.id] }),
  author: one(user, { fields: [review.userId], references: [user.id] }),
}));
