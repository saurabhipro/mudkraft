"use server";

import { randomBytes } from "node:crypto";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";

import { db } from "../db";
import { newsletterSubscriber } from "../db/schema";
import { sendNewsletterStudioNote, sendNewsletterWelcomeEmail } from "../email/send";

/**
 * "Letters from the kiln" on the home page. The address is saved in the
 * `newsletter_subscriber` table and gets a thank-you email with a one-click
 * unsubscribe link; the studio inbox gets a short note for each new one.
 * Submitting an address that is already subscribed sends nothing again.
 */

const schema = z.object({
  email: z.string().trim().toLowerCase().email("That email doesn't look right").max(120),
  /** Honeypot: people never see this field, bots fill it. */
  website: z.string().max(200).default(""),
});

export type SubscribeResult = { ok: true; already: boolean } | { ok: false; error: string };

// A few tries per address per hour is plenty; the site runs as one process.
const WINDOW_MS = 60 * 60 * 1000;
const MAX_TRIES = 8;
const tries = new Map<string, { n: number; until: number }>();

function tooMany(key: string): boolean {
  const now = Date.now();
  const hit = tries.get(key);
  if (!hit || hit.until < now) {
    tries.set(key, { n: 1, until: now + WINDOW_MS });
    if (tries.size > 5000) for (const [k, v] of tries) if (v.until < now) tries.delete(k);
    return false;
  }
  hit.n += 1;
  return hit.n > MAX_TRIES;
}

export async function subscribeNewsletter(input: unknown): Promise<SubscribeResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please enter a valid email address." };
  const { email, website } = parsed.data;
  if (website) return { ok: true, already: false };

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (tooMany(ip)) return { ok: false, error: "Too many tries from here. Please try again later." };

  try {
    const [existing] = await db
      .select()
      .from(newsletterSubscriber)
      .where(eq(newsletterSubscriber.email, email))
      .limit(1);

    if (existing && !existing.unsubscribedAt) return { ok: true, already: true };

    let token: string;
    if (existing) {
      token = existing.unsubscribeToken;
      await db
        .update(newsletterSubscriber)
        .set({ unsubscribedAt: null })
        .where(eq(newsletterSubscriber.id, existing.id));
    } else {
      token = randomBytes(24).toString("base64url");
      await db
        .insert(newsletterSubscriber)
        .values({ email, source: "home", unsubscribeToken: token })
        .onConflictDoNothing({ target: newsletterSubscriber.email });
    }

    await Promise.all([sendNewsletterWelcomeEmail(email, token), sendNewsletterStudioNote(email)]);
    return { ok: true, already: false };
  } catch (error) {
    console.error("[newsletter] subscribe failed:", error);
    return { ok: false, error: "We couldn't save that just now. Please try again in a minute." };
  }
}

/** The unsubscribe page's button. Unknown tokens answer the same, so nothing leaks. */
export async function unsubscribeNewsletter(token: string): Promise<{ ok: boolean }> {
  const t = String(token || "").slice(0, 100);
  if (!t) return { ok: false };
  try {
    await db
      .update(newsletterSubscriber)
      .set({ unsubscribedAt: new Date() })
      .where(eq(newsletterSubscriber.unsubscribeToken, t));
    return { ok: true };
  } catch (error) {
    console.error("[newsletter] unsubscribe failed:", error);
    return { ok: false };
  }
}
