import { NextResponse } from "next/server";

import { serverEnv } from "@/server/env";

/**
 * The udhaar reminder's WhatsApp button opens mudkraft.com/pay/<shop>/<id>/<sig> (a template's
 * link must sit on one fixed domain, and customers trust ours). The pay page itself — today's
 * balance, UPI button and QR, "I have paid" — is Bikriup's, so this only forwards there.
 */
export function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  return params.then(({ path }) => {
    const parts = path ?? [];
    // <shop>/<customer id>/<signature>, nothing else.
    if (
      parts.length !== 3 ||
      !/^[a-z0-9-]{1,60}$/i.test(parts[0]) ||
      !/^\d{1,10}$/.test(parts[1]) ||
      !/^[a-f0-9]{16}$/.test(parts[2])
    ) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }
    const base = (serverEnv.BIKRIUP_PAY_URL ?? "https://bikriup.com").replace(/\/$/, "");
    return NextResponse.redirect(`${base}/pay/${parts.map(encodeURIComponent).join("/")}`, 302);
  });
}
