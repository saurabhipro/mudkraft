import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { admin, magicLink, oneTap } from "better-auth/plugins";

import { PASSWORD_MIN_LENGTH, checkPassword } from "@/lib/password-policy";

import { db } from "./db";
import { account, session, user, verification } from "./db/schema/auth";
import { sendMagicLinkEmail, sendPasswordResetEmail, sendWelcomeEmail } from "./email/send";
import { serverEnv } from "./env";

export const ROLE_ADMIN = "admin";
export const ROLE_CUSTOMER = "customer";

export const auth = betterAuth({
  appName: "Mudkraft",
  secret: serverEnv.BETTER_AUTH_SECRET,
  baseURL: serverEnv.BETTER_AUTH_URL,

  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification },
  }),

  /**
   * Kept enabled alongside Google so the seeded admin can always get in. If
   * admin access depended solely on Google, an outage or a locked Workspace
   * account would lock the studio out of its own catalogue.
   */
  emailAndPassword: {
    enabled: true,
    // Length only; the capital / small / special rules are enforced in `hooks.before`.
    minPasswordLength: PASSWORD_MIN_LENGTH,
    resetPasswordTokenExpiresIn: 60 * 60, // 1 hour
    // A reset is often "someone else got in": sign every device out.
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail(user.email, user.name, url);
    },
  },

  /**
   * The forms show the same checklist, but they are only a convenience: this
   * is where a weak password is actually refused, for sign-up and reset alike.
   */
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email" && ctx.path !== "/reset-password") return;
      const body = ctx.body as { password?: unknown; newPassword?: unknown } | undefined;
      const password = ctx.path === "/sign-up/email" ? body?.password : body?.newPassword;
      const problem = checkPassword(typeof password === "string" ? password : "");
      if (problem) throw new APIError("BAD_REQUEST", { message: problem });
    }),
  },

  /**
   * Better Auth's limiter is on in production by default. Anything that sends
   * an email gets a tighter window so the form cannot be used to spam inboxes.
   */
  rateLimit: {
    customRules: {
      "/sign-in/magic-link": { window: 60, max: 3 },
      "/request-password-reset": { window: 60, max: 3 },
    },
  },

  socialProviders: {
    google: {
      clientId: serverEnv.GOOGLE_CLIENT_ID,
      clientSecret: serverEnv.GOOGLE_CLIENT_SECRET,
    },
  },

  user: {
    additionalFields: {
      phone: { type: "string", required: false, input: true },
    },
  },

  databaseHooks: {
    user: {
      create: {
        /**
         * Fires exactly once per account, for every signup path — email &
         * password, Google redirect and One Tap alike. `sendWelcomeEmail`
         * never throws, so a mail outage cannot break signup.
         */
        after: async (newUser) => {
          await sendWelcomeEmail(newUser.email, newUser.name);
        },
      },
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh at most once a day
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },

  /**
   * Order matters: nextCookies() must be last so it can write cookies set by
   * every plugin before it.
   */
  plugins: [
    admin({ defaultRole: ROLE_CUSTOMER, adminRoles: [ROLE_ADMIN] }),
    /**
     * Verifies the Google ID token that the One Tap prompt returns. New
     * visitors accepting "Continue as …" are created with the default
     * `customer` role, exactly like any other Google sign-in.
     */
    oneTap(),
    /**
     * Passwordless sign-in and sign-up: a new email gets an account on first
     * click (and the welcome email via the user-create hook above).
     */
    magicLink({
      expiresIn: 60 * 10,
      sendMagicLink: async ({ email, url }) => {
        await sendMagicLinkEmail(email, url);
      },
    }),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
