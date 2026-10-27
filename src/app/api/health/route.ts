import { NextResponse } from "next/server";

/**
 * Liveness check for the deploy script on the server: a new release goes live only when this
 * answers. It touches no database or API, so a slow dependency never blocks a deploy.
 */
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ ok: true });
}
