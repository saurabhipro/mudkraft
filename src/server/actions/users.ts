"use server";

import { and, count, eq, ne } from "drizzle-orm";
import { z } from "zod";

import { ROLE_ADMIN, ROLE_CUSTOMER } from "../auth";
import { requireAdmin } from "../auth-guard";
import { db } from "../db";
import { user } from "../db/schema/auth";
import type { ActionResult } from "./products";

const roleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum([ROLE_ADMIN, ROLE_CUSTOMER]),
});

/**
 * Promote or demote an admin.
 *
 * Two lockout guards, both enforced server-side because the UI can be bypassed:
 * an admin cannot demote themselves (the classic way to lose access with one
 * misclick), and the last remaining admin cannot be demoted at all — that would
 * leave the studio permanently unable to reach its own panel, recoverable only
 * by editing the database by hand.
 */
export async function setUserRole(input: unknown): Promise<ActionResult> {
  const session = await requireAdmin();

  const parsed = roleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid role change." };
  const { userId, role } = parsed.data;

  const target = await db.query.user.findFirst({ where: eq(user.id, userId) });
  if (!target) return { ok: false, error: "User not found." };

  if (role === ROLE_CUSTOMER && target.role === ROLE_ADMIN) {
    if (target.id === session.user.id) {
      return {
        ok: false,
        error: "You cannot remove your own admin access. Ask another admin to do it.",
      };
    }

    const [remaining] = await db
      .select({ n: count() })
      .from(user)
      .where(and(eq(user.role, ROLE_ADMIN), ne(user.id, userId)));

    if ((remaining?.n ?? 0) === 0) {
      return {
        ok: false,
        error: "This is the last admin. Promote someone else before removing this one.",
      };
    }
  }

  await db.update(user).set({ role, updatedAt: new Date() }).where(eq(user.id, userId));
  return { ok: true };
}

const banSchema = z.object({
  userId: z.string().min(1),
  banned: z.coerce.boolean(),
  reason: z.string().trim().max(500).optional(),
});

export async function setUserBanned(input: unknown): Promise<ActionResult> {
  const session = await requireAdmin();

  const parsed = banSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid ban request." };
  const { userId, banned, reason } = parsed.data;

  if (userId === session.user.id) {
    return { ok: false, error: "You cannot ban yourself." };
  }

  const target = await db.query.user.findFirst({ where: eq(user.id, userId) });
  if (!target) return { ok: false, error: "User not found." };

  if (banned && target.role === ROLE_ADMIN) {
    return { ok: false, error: "Remove admin access before banning this account." };
  }

  await db
    .update(user)
    .set({
      banned,
      banReason: banned ? (reason ?? null) : null,
      banExpires: null,
      updatedAt: new Date(),
    })
    .where(eq(user.id, userId));

  return { ok: true };
}
