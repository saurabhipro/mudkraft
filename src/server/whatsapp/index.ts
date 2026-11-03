import { createHmac, timingSafeEqual } from "node:crypto";

import { bikriup, bikriupEnabled } from "../bikriup";
import { serverEnv } from "../env";
import { GRAPH_URL, TEMPLATES, TEMPLATE_LANGUAGE, type TemplateKey } from "./templates";

/**
 * WhatsApp Cloud API, straight to Meta (no reseller, so no monthly fee or markup).
 * Optional like SMTP: without WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN
 * every send is skipped and the site behaves exactly as before.
 *
 * Every message in and out is also logged to Bikriup (People › WhatsApp), so the
 * studio sees the whole chat and can answer from there.
 *
 * Sends never throw: an order step must not fail because a message did not go.
 */

export function whatsappEnabled(): boolean {
  return Boolean(serverEnv.WHATSAPP_PHONE_NUMBER_ID && serverEnv.WHATSAPP_ACCESS_TOKEN);
}

/** Any spelling of an Indian mobile → 91XXXXXXXXXX, the form Meta expects; else null. */
export function waNumber(phone: string): string | null {
  const digits = phone.replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "");
  return /^[6-9]\d{9}$/.test(digits) ? `91${digits}` : null;
}

/* ---------- The Bikriup chat log ---------- */

export type ChatKind =
  "text" | "menu" | "catalog" | "cart" | "form" | "order" | "template" | "media" | "reply";

export interface ChatState {
  mode: "bot" | "human";
  last_menu_at: string;
}

/** Logs one message to Bikriup and answers with the chat's state; null when Bikriup is off or down. */
export async function logChat(entry: {
  phone: string;
  dir: "in" | "out";
  kind: ChatKind;
  body: string;
  name?: string;
  wa_id?: string;
  mode?: "bot" | "human";
}): Promise<ChatState | null> {
  if (!bikriupEnabled()) return null;
  try {
    const out = await bikriup<{ chat: ChatState }>("/chats/messages", {
      method: "POST",
      body: { ...entry, phone: entry.phone.replace(/^91(?=\d{10}$)/, "") },
    });
    return out.chat;
  } catch (error) {
    console.error("[whatsapp] chat log failed:", error);
    return null;
  }
}

/** Tells Bikriup what became of a message: a reply the studio typed, or a delivery receipt. */
export async function chatStatus(status: {
  message_id?: number;
  wa_id?: string;
  status: string;
  error?: string;
}) {
  if (!bikriupEnabled()) return;
  try {
    await bikriup("/chats/status", { method: "POST", body: status });
  } catch (error) {
    console.error("[whatsapp] chat status failed:", error);
  }
}

/* ---------- Sending ---------- */

export type SendResult = { ok: true; id: string } | { ok: false; error: string };

/** Any message Meta accepts (text, interactive, template, …) to one number. */
export async function sendRaw(to: string, payload: Record<string, unknown>): Promise<SendResult> {
  if (!whatsappEnabled()) return { ok: false, error: "WhatsApp is not set up" };
  const number = waNumber(to);
  if (!number) return { ok: false, error: "Not a mobile number" };
  try {
    const res = await fetch(`${GRAPH_URL}/${serverEnv.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serverEnv.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: number,
        ...payload,
      }),
      // Bikriup gives its webhook 8 s; the message must not make it retry the whole event.
      signal: AbortSignal.timeout(5000),
    });
    const json = (await res.json().catch(() => ({}))) as {
      messages?: Array<{ id: string }>;
      error?: { message?: string; error_data?: { details?: string } };
    };
    if (!res.ok) {
      const error = json.error?.error_data?.details || json.error?.message || `HTTP ${res.status}`;
      console.error(`[whatsapp] ${String(payload.type)} to ${number} failed: ${error}`);
      return { ok: false, error };
    }
    return { ok: true, id: json.messages?.[0]?.id ?? "" };
  } catch (error) {
    console.error(`[whatsapp] ${String(payload.type)} to ${number} failed:`, error);
    return { ok: false, error: "Could not reach WhatsApp" };
  }
}

/** A free-form message (only inside 24 h of the customer's last message), logged to the chat. */
export async function sendChat(
  to: string,
  kind: ChatKind,
  logText: string,
  payload: Record<string, unknown>,
  /** Hands the chat to the studio ("human") or back to the bot along with this message. */
  mode?: "bot" | "human",
): Promise<SendResult> {
  const sent = await sendRaw(to, payload);
  if (sent.ok)
    await logChat({
      phone: waNumber(to) ?? to,
      dir: "out",
      kind,
      body: logText,
      wa_id: sent.id,
      mode,
    });
  return sent;
}

export function sendText(
  to: string,
  text: string,
  kind: ChatKind = "text",
  mode?: "bot" | "human",
) {
  return sendChat(
    to,
    kind,
    text,
    { type: "text", text: { body: text, preview_url: /https?:\/\//.test(text) } },
    mode,
  );
}

/* ---------- Templates (messages the studio starts, e.g. order updates) ---------- */

// Meta refuses a parameter with a newline, a tab or more than four spaces in a row, or an empty one.
const clean = (text: string) =>
  text
    .replace(/[\n\t]+/g, " ")
    .replace(/ {4,}/g, "   ")
    .trim() || "-";

export interface WhatsAppMessage {
  template: TemplateKey;
  /** Fills the body's {{1}}, {{2}}, … in order. */
  body: string[];
  /** The URL button's {{1}}, or the code for a copy-code button. */
  button?: string;
}

export async function sendWhatsApp(to: string, message: WhatsAppMessage): Promise<boolean> {
  const def = TEMPLATES[message.template];
  const body = message.body.map(clean);

  const components: unknown[] = [
    { type: "body", parameters: body.map((text) => ({ type: "text", text })) },
  ];
  if (message.button && def.button?.type === "url") {
    components.push({
      type: "button",
      sub_type: "url",
      index: "0",
      parameters: [{ type: "text", text: message.button }],
    });
  }
  if (message.button && def.button?.type === "copy_code") {
    components.push({
      type: "button",
      sub_type: "copy_code",
      index: "0",
      parameters: [{ type: "coupon_code", coupon_code: message.button }],
    });
  }

  // The chat log shows the words the customer read.
  const read = def.body.replace(/\{\{(\d+)\}\}/g, (_, n: string) => body[Number(n) - 1] ?? "");
  const sent = await sendChat(to, "template", read, {
    type: "template",
    template: { name: def.name, language: { code: TEMPLATE_LANGUAGE }, components },
  });
  return sent.ok;
}

/** Meta signs every webhook with the app secret: `X-Hub-Signature-256: sha256=<hex>` over the raw body. */
export function verifyWhatsAppSignature(raw: Buffer, header: string | null): boolean {
  const secret = serverEnv.WHATSAPP_APP_SECRET;
  if (!secret || !header?.startsWith("sha256=")) return false;
  const want = Buffer.from(createHmac("sha256", secret).update(raw).digest("hex"));
  const got = Buffer.from(header.slice("sha256=".length));
  return want.length === got.length && timingSafeEqual(want, got);
}
