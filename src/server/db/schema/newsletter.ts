import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * "Letters from the kiln": emails left in the home page's subscribe form.
 * One row per address; unsubscribing keeps the row and stamps `unsubscribedAt`,
 * so a later re-subscribe simply clears it.
 */
export const newsletterSubscriber = pgTable("newsletter_subscriber", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** Always stored lower-cased and trimmed. */
  email: text("email").notNull().unique(),
  /** Where the address came from, e.g. "home". */
  source: text("source").notNull().default("home"),
  /** Random secret for the one-click unsubscribe link in every letter. */
  unsubscribeToken: text("unsubscribe_token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
});
