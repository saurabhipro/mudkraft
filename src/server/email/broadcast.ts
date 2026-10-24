import { eq, isNull } from "drizzle-orm";

import { db } from "../db";
import { user } from "../db/schema/auth";
import { order } from "../db/schema/orders";
import { sendEmail } from "./client";
import { safeThumb } from "./send";
import { appBaseUrl, newProductEmail } from "./templates";

/**
 * Product-launch announcements to every known customer: registered accounts
 * plus guests who left an email on an order, deduplicated.
 *
 * Recipients always go in BCC so nobody sees the mailing list, and sends are
 * batched to stay under Titan's per-message recipient limits.
 */

const BCC_BATCH_SIZE = 50;

export async function getAnnouncementRecipients(): Promise<string[]> {
  const [users, guests] = await Promise.all([
    db.select({ email: user.email }).from(user).where(eq(user.banned, false)),
    db
      .selectDistinct({ email: order.contactEmail })
      .from(order)
      .where(isNull(order.userId)),
  ]);

  const unique = new Set<string>();
  for (const row of users) {
    if (row.email) unique.add(row.email.toLowerCase());
  }
  for (const row of guests) {
    if (row.email) unique.add(row.email.toLowerCase());
  }
  return [...unique];
}

export interface AnnounceProductInput {
  slug: string;
  name: string;
  sizeLabel: string;
  tag: string;
  description: string;
  pricePaise: number;
  imagePublicId: string | null;
}

export interface BroadcastResult {
  recipients: number;
  batchesSent: number;
  batchesFailed: number;
}

export async function announceNewProduct(input: AnnounceProductInput): Promise<BroadcastResult> {
  const recipients = await getAnnouncementRecipients();
  if (recipients.length === 0) return { recipients: 0, batchesSent: 0, batchesFailed: 0 };

  const { subject, html } = newProductEmail({
    name: input.name,
    sizeLabel: input.sizeLabel,
    tag: input.tag,
    description: input.description,
    pricePaise: input.pricePaise,
    url: `${appBaseUrl()}/shop/${input.slug}`,
    imageUrl: safeThumb(input.imagePublicId, 800),
  });

  let batchesSent = 0;
  let batchesFailed = 0;

  // Sequential on purpose: parallel bursts are how SMTP rate limits get hit.
  for (let start = 0; start < recipients.length; start += BCC_BATCH_SIZE) {
    const batch = recipients.slice(start, start + BCC_BATCH_SIZE);
    const ok = await sendEmail({ bcc: batch, subject, html });
    if (ok) batchesSent += 1;
    else batchesFailed += 1;
  }

  console.info(
    `[email] Product launch "${input.slug}": ${recipients.length} recipients, ` +
      `${batchesSent} batches sent, ${batchesFailed} failed`,
  );
  return { recipients: recipients.length, batchesSent, batchesFailed };
}
