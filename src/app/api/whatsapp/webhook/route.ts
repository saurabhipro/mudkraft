import { NextResponse } from "next/server";

import { serverEnv } from "@/server/env";
import { chatStatus, verifyWhatsAppSignature } from "@/server/whatsapp";
import { handleIncoming, type IncomingMessage } from "@/server/whatsapp/bot";

/**
 * Meta's WhatsApp webhook. Register it in developers.facebook.com › the Mudkraft
 * app › WhatsApp › Configuration:
 *
 *   Callback URL  https://www.mudkraft.com/api/whatsapp/webhook
 *   Verify token  the value of WHATSAPP_VERIFY_TOKEN
 *   Fields        messages
 *
 * GET is Meta's one-time handshake. POST carries the customers' messages (the
 * bot answers them, server/whatsapp/bot.ts) and the sent / delivered / read /
 * failed receipts of what we send, which show as ticks in Bikriup › WhatsApp.
 */

export function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const token = serverEnv.WHATSAPP_VERIFY_TOKEN;
  if (params.get("hub.mode") === "subscribe" && token && params.get("hub.verify_token") === token) {
    return new Response(params.get("hub.challenge") ?? "", {
      headers: { "Content-Type": "text/plain" },
    });
  }
  return new Response("forbidden", { status: 403 });
}

interface WaStatus {
  id: string;
  status: string;
  recipient_id: string;
  errors?: Array<{
    code?: number;
    title?: string;
    message?: string;
    error_data?: { details?: string };
  }>;
}

interface WaValue {
  contacts?: Array<{ wa_id?: string; profile?: { name?: string } }>;
  messages?: IncomingMessage[];
  statuses?: WaStatus[];
}

export async function POST(request: Request) {
  const raw = Buffer.from(await request.arrayBuffer());
  if (!verifyWhatsAppSignature(raw, request.headers.get("x-hub-signature-256"))) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let body: { entry?: Array<{ changes?: Array<{ field?: string; value?: WaValue }> }> };
  try {
    body = JSON.parse(raw.toString("utf8"));
  } catch {
    return NextResponse.json({ error: "malformed body" }, { status: 400 });
  }

  const work: Promise<void>[] = [];
  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== "messages" || !change.value) continue;
      const value = change.value;
      for (const s of value.statuses ?? []) {
        // "sent" is already known when Meta accepts the message; the later receipts are the news.
        if (!["delivered", "read", "failed"].includes(s.status)) continue;
        const e = s.errors?.[0];
        const error = e
          ? `${e.title ?? e.message ?? ""}${e.error_data?.details ? `: ${e.error_data.details}` : ""}`
          : "";
        if (s.status === "failed")
          console.error(
            `[whatsapp] message to ${s.recipient_id} failed: ${e?.code ?? ""} ${error}`,
          );
        work.push(chatStatus({ wa_id: s.id, status: s.status, error }));
      }
      for (const m of value.messages ?? []) {
        const name = value.contacts?.find((c) => c.wa_id === m.from)?.profile?.name ?? "";
        work.push(
          handleIncoming(m, name).catch((error) => {
            console.error("[whatsapp] bot failed:", error);
          }),
        );
      }
    }
  }
  await Promise.all(work);

  // Meta retries anything that is not a 200, so this always answers 200 once the signature checks out.
  return NextResponse.json({ received: true });
}
