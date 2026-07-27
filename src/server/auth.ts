import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin, oneTap } from "better-auth/plugins";

import { db } from "./db";
import { account, session, user, verification } from "./db/schema/auth";
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
    minPasswordLength: 12,
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
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
