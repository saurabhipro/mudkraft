import { NextResponse } from "next/server";

import { payLinkTarget } from "@/server/bikriup-paylinks";

/**
 * The "Pay now" button of the mk_payment_link WhatsApp template and the payment-link email:
 * /paylink/<Razorpay payment link id>. While the link is open it forwards to Razorpay's page; once
 * it is paid, expired or cancelled, to the order's page (or the home page).
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.redirect(await payLinkTarget(id), {
    status: 302,
    headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });
}
