import { NextResponse } from "next/server";
import { z } from "zod";

import { getSession } from "@/server/auth-guard";
import { ROLE_ADMIN } from "@/server/auth";
import { createUploadSignature } from "@/server/cloudinary";

const requestSchema = z.object({
  folder: z.enum(["products", "reviews"]),
  resourceType: z.enum(["image", "video"]).default("image"),
});

/**
 * Issues a short-lived Cloudinary upload signature.
 *
 * Admin-only. Customer review photos will need their own rate-limited path
 * before that folder is opened up — an authenticated-but-unlimited signing
 * endpoint is still an abusable write endpoint.
 */
export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  if (session.user.role !== ROLE_ADMIN) {
    return NextResponse.json({ error: "Not permitted" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const signature = createUploadSignature(parsed.data.folder, parsed.data.resourceType);
  return NextResponse.json(signature, {
    headers: { "Cache-Control": "no-store" },
  });
}
