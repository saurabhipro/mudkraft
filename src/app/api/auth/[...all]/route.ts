import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/server/auth";

/**
 * Mounts every Better Auth endpoint under /api/auth/*, including the Google
 * callback at /api/auth/callback/google — the URI registered in Google Cloud
 * Console. Changing this path means changing it there too.
 */
export const { GET, POST } = toNextJsHandler(auth.handler);
