"use server";

import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";

import { requireAdmin } from "../auth-guard";
import { db } from "../db";
import { deliveryVerification, order, orderEvent } from "../db/schema/orders";
import { sendOtpSms } from "../sms";

/**
 * One-time delivery verification, driven by the QR pasted on the box.
 *
 * Trust model: the token proves possession of the parcel, the OTP proves
 * possession of the phone the order was placed with. Both are needed, and the
 * pair works exactly once — `verifiedAt` is written under a WHERE that
 * re-checks it is still null, so a second scan can only ever read "verified".
 */

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_SENDS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

function hashOtp(token: string, otp: string): string {
  // Salted with the token so identical OTPs on different parcels never share a
  // hash. A 6-digit space is defended by MAX_ATTEMPTS, not hash strength.
  return createHash("sha256").update(`${token}:${otp}`).digest("hex");
}

export type RequestOtpResult = { ok: true } | { ok: false; error: string };

export async function requestDeliveryOtp(token: string): Promise<RequestOtpResult> {
  if (!token || token.length > 200) return { ok: false, error: "Unknown code." };

  const row = await db.query.deliveryVerification.findFirst({
    where: eq(deliveryVerification.token, token),
    with: { order: { columns: { contactPhone: true, status: true } } },
  });

  if (!row) return { ok: false, error: "Unknown code." };
  if (row.verifiedAt) return { ok: false, error: "This delivery is already verified." };
  if (!row.order.contactPhone) {
    return { ok: false, error: "No phone number is on record for this order." };
  }
  if (row.order.status === "cancelled" || row.order.status === "refunded") {
    return { ok: false, error: "This order is no longer active." };
  }
  if (row.sendCount >= MAX_SENDS) {
    return { ok: false, error: "Too many codes requested. Please contact us on WhatsApp." };
  }
  if (row.lastSentAt && Date.now() - row.lastSentAt.getTime() < RESEND_COOLDOWN_MS) {
    return { ok: false, error: "A code was just sent — give it a minute before trying again." };
  }

  const otp = String(randomInt(100000, 1000000));
  const now = new Date();

  await db
    .update(deliveryVerification)
    .set({
      otpHash: hashOtp(token, otp),
      otpExpiresAt: new Date(now.getTime() + OTP_TTL_MS),
      // A fresh code gets a fresh guess budget; the lifetime send cap still holds.
      attemptCount: 0,
      sendCount: sql`${deliveryVerification.sendCount} + 1`,
      lastSentAt: now,
      updatedAt: now,
    })
    .where(and(eq(deliveryVerification.id, row.id), isNull(deliveryVerification.verifiedAt)));

  const sent = await sendOtpSms(row.order.contactPhone, otp);
  if (!sent) {
    return { ok: false, error: "The SMS could not be sent right now. Please try again shortly." };
  }

  return { ok: true };
}

export type ConfirmOtpResult = { ok: true } | { ok: false; error: string };

export async function confirmDeliveryOtp(token: string, otp: string): Promise<ConfirmOtpResult> {
  if (!token || token.length > 200) return { ok: false, error: "Unknown code." };
  if (!/^\d{6}$/.test(otp)) return { ok: false, error: "Enter the 6-digit code from the SMS." };

  const row = await db.query.deliveryVerification.findFirst({
    where: eq(deliveryVerification.token, token),
    columns: {
      id: true,
      orderId: true,
      otpHash: true,
      otpExpiresAt: true,
      attemptCount: true,
      verifiedAt: true,
    },
  });

  if (!row) return { ok: false, error: "Unknown code." };
  if (row.verifiedAt) return { ok: false, error: "This delivery is already verified." };
  if (!row.otpHash || !row.otpExpiresAt) {
    return { ok: false, error: "Request a code first." };
  }
  if (row.otpExpiresAt.getTime() < Date.now()) {
    return { ok: false, error: "That code has expired. Request a new one." };
  }
  if (row.attemptCount >= MAX_ATTEMPTS) {
    return { ok: false, error: "Too many wrong attempts. Request a new code." };
  }

  const expected = Buffer.from(row.otpHash, "hex");
  const provided = Buffer.from(hashOtp(token, otp), "hex");
  const matches = expected.length === provided.length && timingSafeEqual(expected, provided);

  if (!matches) {
    await db
      .update(deliveryVerification)
      .set({
        attemptCount: sql`${deliveryVerification.attemptCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(deliveryVerification.id, row.id));
    return { ok: false, error: "That code is not right. Check the SMS and try again." };
  }

  const now = new Date();

  await db.batch([
    db
      .update(deliveryVerification)
      .set({ verifiedAt: now, otpHash: null, otpExpiresAt: null, updatedAt: now })
      // Re-checked so two concurrent submissions cannot both verify.
      .where(and(eq(deliveryVerification.id, row.id), isNull(deliveryVerification.verifiedAt))),
    db
      .update(order)
      .set({ status: "delivered", updatedAt: now })
      .where(
        and(
          eq(order.id, row.orderId),
          inArray(order.status, ["confirmed", "crafting", "dispatched", "out_for_delivery"]),
        ),
      ),
    db.insert(orderEvent).values({
      orderId: row.orderId,
      status: "delivered",
      note: "Delivery verified by the customer — QR scanned and OTP confirmed.",
    }),
  ]);

  return { ok: true };
}

export type CreateQrResult = { ok: true } | { ok: false; error: string };

/** Admin: mints the verification token for an order so its QR can be printed. */
export async function createDeliveryQr(orderId: string): Promise<CreateQrResult> {
  await requireAdmin();

  if (!/^[0-9a-f-]{36}$/i.test(orderId)) return { ok: false, error: "Unknown order." };

  const existing = await db.query.deliveryVerification.findFirst({
    where: eq(deliveryVerification.orderId, orderId),
    columns: { id: true },
  });
  if (existing) return { ok: true };

  const target = await db.query.order.findFirst({
    where: eq(order.id, orderId),
    columns: { id: true },
  });
  if (!target) return { ok: false, error: "Unknown order." };

  await db.insert(deliveryVerification).values({
    orderId,
    token: randomBytes(24).toString("base64url"),
  });

  return { ok: true };
}
