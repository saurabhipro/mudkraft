import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Webhook deliveries already handled, keyed by the sender's event id (Razorpay's
 * `x-razorpay-event-id`). Razorpay retries a delivery until it gets a 2xx and
 * may send the same event more than once; a row here makes the repeat a no-op.
 * Rows carry no customer data and can be pruned after a few weeks.
 */
export const webhookEvent = pgTable(
  "webhook_event",
  {
    /** Prefixed with the provider, e.g. "razorpay:evt_…". */
    id: text("id").primaryKey(),
    /** e.g. "payment.captured". */
    event: text("event").notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("webhook_event_received_idx").on(t.receivedAt)],
);
