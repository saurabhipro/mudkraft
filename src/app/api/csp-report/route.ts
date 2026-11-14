import { NextResponse } from "next/server";

import { clientIp, createLimiter } from "@/server/rate-limit";

/**
 * Receives Content-Security-Policy violation reports (the policy is
 * report-only for now, see next.config.ts) and logs one line per report, so
 * the policy can be tightened from real traffic before it is enforced.
 * Reports never carry customer data worth keeping; only the directive and the
 * blocked source are logged.
 */

const tooMany = createLimiter({ windowMs: 60 * 1000, max: 20 });

interface CspReport {
  "csp-report"?: {
    "document-uri"?: string;
    "violated-directive"?: string;
    "effective-directive"?: string;
    "blocked-uri"?: string;
  };
}

/** Only the origin and path of a URL: query strings can carry tokens. */
function stripQuery(value: string | undefined): string {
  if (!value) return "";
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`;
  } catch {
    return value.slice(0, 60);
  }
}

export async function POST(request: Request) {
  if (tooMany(await clientIp())) return new NextResponse(null, { status: 204 });

  const text = (await request.text()).slice(0, 10_000);
  try {
    const report = (JSON.parse(text) as CspReport)["csp-report"];
    if (report) {
      const directive = report["effective-directive"] ?? report["violated-directive"] ?? "?";
      console.warn(
        `[csp] ${directive} blocked ${stripQuery(report["blocked-uri"]) || "inline"} on ${stripQuery(report["document-uri"])}`,
      );
    }
  } catch {
    // Not a report we understand; nothing to log.
  }
  return new NextResponse(null, { status: 204 });
}
