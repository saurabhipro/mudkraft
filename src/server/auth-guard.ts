import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { ROLE_ADMIN, auth } from "./auth";

/**
 * The real authorisation boundary.
 *
 * src/proxy.ts also gates /admin, but only by looking for a session cookie —
 * it cannot verify the signature cheaply at the edge, and a cookie can be
 * forged or stale. Treat the proxy as a redirect convenience; every admin page
 * and every admin server action must call one of these helpers.
 */

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireUser(nextPath: string) {
  const session = await getSession();
  if (!session) {
    redirect(`/sign-in?next=${encodeURIComponent(nextPath)}`);
  }
  return session;
}

export async function requireAdmin(nextPath = "/admin") {
  const session = await requireUser(nextPath);

  if (session.user.role !== ROLE_ADMIN) {
    // Deliberately a redirect to the storefront, not a 403 page: telling a
    // signed-in non-admin that /admin exists and they merely lack the role is
    // more information than they need.
    redirect("/");
  }

  return session;
}

/** Non-throwing variant, for conditionally rendering an "Admin" link. */
export async function isAdmin(): Promise<boolean> {
  const session = await getSession();
  return session?.user.role === ROLE_ADMIN;
}
