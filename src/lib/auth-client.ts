"use client";

import { adminClient, inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

/**
 * Browser-side auth. No baseURL is given on purpose: the client calls the same
 * origin it was served from, so localhost and production each work without a
 * build-time value.
 *
 * Note the absence of `oneTapClient`. Its declaration in better-auth 1.6.25 is
 * incompatible with `BetterAuthClientPlugin`, and any cast used to force it in
 * widens the plugins array enough to collapse Better Auth's inference —
 * `session.user` degrades to `never`. Google One Tap therefore talks to the
 * server plugin's endpoint directly from components/GoogleOneTap.tsx, which
 * keeps this client fully typed.
 */

/**
 * OAuth client IDs are public by design — they appear in every authorisation
 * URL — so exposing this one to the browser is expected, unlike the client
 * *secret*, which stays in src/server/env.ts.
 */
export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export const authClient = createAuthClient({
  plugins: [
    adminClient(),
    /**
     * `role` and `phone` live on our user table but are not part of Better
     * Auth's base user type. Declaring them here is what makes
     * `session.user.role` type-safe rather than a cast at every call site.
     */
    inferAdditionalFields({
      user: {
        role: { type: "string" },
        phone: { type: "string", required: false },
      },
    }),
  ],
});

export const { signIn, signOut, signUp, useSession } = authClient;
