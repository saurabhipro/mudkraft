import { relations, sql } from "drizzle-orm";
import { check, date, index, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { user } from "./auth";

/** Matches the options offered by the booking form on the workshops page. */
export const enquiryType = pgEnum("enquiry_type", [
  "school",
  "birthday",
  "private_party",
  "corporate",
  "other",
]);

export const enquiryStatus = pgEnum("enquiry_status", ["new", "contacted", "booked", "closed"]);

export const workshopEnquiry = pgTable(
  "workshop_enquiry",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    type: enquiryType("type").notNull().default("other"),
    preferredDate: date("preferred_date"),
    /** Free text — the form accepts "25 children" as readily as a number. */
    guests: text("guests"),
    message: text("message"),

    status: enquiryStatus("status").notNull().default("new"),
    handledBy: text("handled_by").references(() => user.id, { onDelete: "set null" }),
    internalNote: text("internal_note"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    /** An enquiry we cannot reply to is worthless; require at least one channel. */
    check("enquiry_contact_present", sql`${t.email} IS NOT NULL OR ${t.phone} IS NOT NULL`),
    index("workshop_enquiry_status_idx").on(t.status, t.createdAt),
  ],
);

export const workshopEnquiryRelations = relations(workshopEnquiry, ({ one }) => ({
  handler: one(user, { fields: [workshopEnquiry.handledBy], references: [user.id] }),
}));
