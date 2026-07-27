import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic gate only. (Next 16 renamed this convention from `middleware` to
 * `proxy`; the exported function must be named `proxy` or be the default.)
 *
 * This checks that a session cookie is PRESENT. It does not validate the
 * signature, check expiry, or read the user's role — doing so would mean a
 * database round trip on every request. Its job is to bounce obviously
 * signed-out visitors to /sign-in without rendering the page first.
 *
 * The authorisation decision that actually matters happens in
 * src/server/auth-guard.ts, which every admin page and action calls. Never add
 * a route here and consider it protected.
 */
export function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

/**
 * /checkout is deliberately absent: guest checkout is supported, so requiring a
 * session there would put a signup wall at the point of purchase.
 */
export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
};
