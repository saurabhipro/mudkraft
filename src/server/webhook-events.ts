import { eq } from "drizzle-orm";

import { db } from "./db";
import { webhookEvent } from "./db/schema/webhooks";

/**
 * Claim-then-process dedupe for webhook deliveries. The claim is an insert on
 * the event id's primary key, so of two concurrent deliveries exactly one wins.
 * If processing then fails, the claim is released so the sender's retry is
 * handled instead of being dropped as a duplicate.
 */

/** True when this delivery is new and the caller should process it. */
export async function claimWebhookEvent(id: string, event: string): Promise<boolean> {
  const inserted = await db
    .insert(webhookEvent)
    .values({ id, event })
    .onConflictDoNothing({ target: webhookEvent.id })
    .returning({ id: webhookEvent.id });
  return inserted.length > 0;
}

export async function releaseWebhookEvent(id: string): Promise<void> {
  await db.delete(webhookEvent).where(eq(webhookEvent.id, id));
}
