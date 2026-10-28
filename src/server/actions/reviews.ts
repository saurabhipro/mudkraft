"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";

import { getSession } from "../auth-guard";
import { BikriupError, bikriup, bikriupEnabled } from "../bikriup";
import { db } from "../db";
import { product } from "../db/schema/catalog";
import { review } from "../db/schema/reviews";

/**
 * A shopper's review of a piece. It lands in Bikriup › Reviews as pending and
 * shows on the site only after the studio approves it. Signed-in shoppers are
 * known by their account; everyone else leaves a name and an email so the
 * studio can write back.
 */

const schema = z.object({
  slug: z.string().trim().min(1).max(200),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(120).default(""),
  body: z.string().trim().min(3, "Write a line about the piece").max(2000),
  name: z.string().trim().max(60).default(""),
  email: z.string().trim().max(120).default(""),
  city: z.string().trim().max(60).default(""),
  // Honeypot: people never see this field, bots fill it.
  website: z.string().max(200).default(""),
});

export type ReviewResult = { ok: true; message: string } | { ok: false; error: string };

export async function submitReview(input: unknown): Promise<ReviewResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form" };
  const d = parsed.data;
  if (d.website) return { ok: true, message: "Thank you!" };

  const session = await getSession();
  const name = session?.user.name || d.name;
  const email = session?.user.email || d.email;
  if (!name) return { ok: false, error: "Add your name" };
  if (!z.string().email().safeParse(email).success)
    return { ok: false, error: "Add a valid email" };

  const pending = "Thank you! Your review shows here once the studio approves it.";

  if (bikriupEnabled()) {
    const forwardedFor = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim();
    try {
      await bikriup("/reviews", {
        method: "POST",
        body: {
          product: d.slug,
          rating: d.rating,
          title: d.title,
          body: d.body,
          name,
          email,
          city: d.city,
          phone: session?.user.phone ?? "",
        },
        forwardedFor,
      });
      return { ok: true, message: pending };
    } catch (error) {
      if (error instanceof BikriupError && error.status < 500)
        return { ok: false, error: error.message };
      return { ok: false, error: "Could not send your review just now. Please try again." };
    }
  }

  const [row] = await db
    .select({ id: product.id })
    .from(product)
    .where(eq(product.slug, d.slug))
    .limit(1);
  if (!row) return { ok: false, error: "This piece is no longer listed" };
  await db.insert(review).values({
    productId: row.id,
    userId: session?.user.id ?? null,
    authorName: name,
    authorCity: d.city,
    rating: d.rating,
    title: d.title,
    body: d.body,
  });
  return { ok: true, message: pending };
}
