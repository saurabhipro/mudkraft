"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { requireAdmin } from "../auth-guard";
import { db } from "../db";
import { product } from "../db/schema/catalog";
import { order, orderEvent } from "../db/schema/orders";
import { review } from "../db/schema/reviews";
import { workshopEnquiry } from "../db/schema/workshops";
import { revalidateReviews } from "../store/revalidate";
import type { ActionResult } from "./products";

// --------------------------------------------------------------------- reviews

const reviewModerationSchema = z.object({
  reviewId: z.string().uuid(),
  status: z.enum(["pending", "approved", "rejected"]),
});

export async function moderateReview(input: unknown): Promise<ActionResult> {
  const session = await requireAdmin();

  const parsed = reviewModerationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid moderation request." };

  const row = await db.query.review.findFirst({
    where: eq(review.id, parsed.data.reviewId),
    with: { product: true },
  });
  if (!row) return { ok: false, error: "Review not found." };

  await db
    .update(review)
    .set({
      status: parsed.data.status,
      moderatedBy: session.user.id,
      moderatedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(review.id, parsed.data.reviewId));

  if (row.product) revalidateReviews(row.product.slug);
  return { ok: true };
}

// ---------------------------------------------------------------------- orders

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "crafting",
  "dispatched",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "refunded",
] as const;

const orderStatusSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum(ORDER_STATUSES),
  note: z.string().trim().max(500).optional(),
});

/**
 * Status changes are append-only in `order_event` as well as being written to
 * the order row. The event log is what drives the customer-facing timeline, and
 * it means "who moved this to dispatched, and when" is always answerable.
 */
export async function setOrderStatus(input: unknown): Promise<ActionResult> {
  const session = await requireAdmin();

  const parsed = orderStatusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid order status change." };
  const d = parsed.data;

  const existing = await db.query.order.findFirst({ where: eq(order.id, d.orderId) });
  if (!existing) return { ok: false, error: "Order not found." };

  await db
    .update(order)
    .set({ status: d.status, updatedAt: new Date() })
    .where(eq(order.id, d.orderId));

  await db.insert(orderEvent).values({
    orderId: d.orderId,
    status: d.status,
    note: d.note ?? null,
    createdBy: session.user.id,
  });

  return { ok: true };
}

const paymentStatusSchema = z.object({
  orderId: z.string().uuid(),
  paymentStatus: z.enum(["unpaid", "paid", "failed", "refunded"]),
});

/**
 * Manual payment marking, for the mock provider and for genuinely offline
 * payments. When a real gateway is wired in, its webhook becomes the source of
 * truth and this stays only as an admin override.
 */
export async function setPaymentStatus(input: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsed = paymentStatusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid payment status." };

  await db
    .update(order)
    .set({ paymentStatus: parsed.data.paymentStatus, updatedAt: new Date() })
    .where(eq(order.id, parsed.data.orderId));

  return { ok: true };
}

// ------------------------------------------------------------------- enquiries

const enquiryStatusSchema = z.object({
  enquiryId: z.string().uuid(),
  status: z.enum(["new", "contacted", "booked", "closed"]),
  internalNote: z.string().trim().max(1000).optional(),
});

export async function setEnquiryStatus(input: unknown): Promise<ActionResult> {
  const session = await requireAdmin();

  const parsed = enquiryStatusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid enquiry status." };
  const d = parsed.data;

  await db
    .update(workshopEnquiry)
    .set({
      status: d.status,
      handledBy: session.user.id,
      ...(d.internalNote !== undefined ? { internalNote: d.internalNote } : {}),
      updatedAt: new Date(),
    })
    .where(eq(workshopEnquiry.id, d.enquiryId));

  return { ok: true };
}

/** Referenced so the product import is used by the type-level query above. */
export type ProductRef = typeof product.$inferSelect;
