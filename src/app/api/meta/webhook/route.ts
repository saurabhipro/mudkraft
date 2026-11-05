import { NextResponse } from "next/server";

import { serverEnv } from "@/server/env";
import { handleSocial, type MessagingEvent } from "@/server/social/bot";
import { verifyWhatsAppSignature } from "@/server/whatsapp";

/**
 * Meta's webhook for Instagram and Messenger (WhatsApp has its own:
 * /api/whatsapp/webhook). Register it in developers.facebook.com › the Mudkraft
 * app, once under Messenger and once under Instagram:
 *
 *   Callback URL  https://www.mudkraft.com/api/meta/webhook
 *   Verify token  the value of WHATSAPP_VERIFY_TOKEN (the same app)
 *   Fields        messages, messaging_postbacks (Messenger also message_echoes)
 *
 * and subscribe the Facebook Page to the app. GET is Meta's one-time handshake;
 * POST carries the customers' messages, which the bot answers (server/social/bot.ts)
 * and Bikriup › People › Chats shows.
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

interface MetaBody {
  object?: string;
  entry?: Array<{ id?: string; messaging?: MessagingEvent[] }>;
}

export async function POST(request: Request) {
  const raw = Buffer.from(await request.arrayBuffer());
  // The same Meta app as WhatsApp, so the same app secret signs these.
  if (!verifyWhatsAppSignature(raw, request.headers.get("x-hub-signature-256"))) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let body: MetaBody;
  try {
    body = JSON.parse(raw.toString("utf8")) as MetaBody;
  } catch {
    return NextResponse.json({ error: "malformed body" }, { status: 400 });
  }

  const channel =
    body.object === "instagram" ? "instagram" : body.object === "page" ? "messenger" : null;
  if (channel) {
    const work: Promise<void>[] = [];
    for (const entry of body.entry ?? []) {
      for (const ev of entry.messaging ?? []) {
        if (!ev.message && !ev.postback) continue; // read and delivery receipts
        work.push(
          handleSocial(channel, ev).catch((error) => {
            console.error(`[${channel}] bot failed:`, error);
          }),
        );
      }
    }
    await Promise.all(work);
  }

  // Meta retries anything that is not a 200, so this always answers 200 once the signature checks out.
  return NextResponse.json({ received: true });
}
