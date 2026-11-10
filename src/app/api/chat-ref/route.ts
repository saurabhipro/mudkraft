import { NextResponse } from "next/server";

import { SITE_URL } from "@/lib/seo";
import { CHAT_REF_COOKIE, readChatRef } from "@/server/social";

/**
 * "Buy on website" on a product card in an Instagram / Messenger chat lands here:
 * the chat is remembered for 30 days (a signed cookie), then the shopper goes on
 * to the product. An order placed with it is linked back to the chat in Bikriup.
 */

export function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const to = params.get("to") ?? "/";
  // Only a path on this site: never an open redirect.
  const safe = /^\/(?![/\\])[\w\-/.?=&%#]*$/.test(to) ? to : "/";
  const res = NextResponse.redirect(new URL(safe, SITE_URL), 302);
  const token = params.get("t") ?? "";
  if (readChatRef(token)) {
    res.cookies.set(CHAT_REF_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });
  }
  return res;
}
