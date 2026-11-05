import { createHmac, timingSafeEqual } from "node:crypto";

import { cloudinaryUrl } from "@/lib/cloudinary";
import { formatPaise } from "@/lib/money";
import { SITE_URL } from "@/lib/seo";

import { bikriup, bikriupEnabled } from "../bikriup";
import { serverEnv } from "../env";
import type { StoreProduct } from "../store/products";
import {
  MEDIA_MAX,
  MEDIA_TYPES,
  logChat,
  whatsappEnabled,
  type ChatCard,
  type ChatKind,
  type SendResult,
} from "../whatsapp";
import { GRAPH_URL } from "../whatsapp/templates";

/**
 * Instagram and Messenger chats, through the studio's Facebook Page (Meta's
 * Messenger Platform; Instagram uses the same Send API once the account is
 * linked to the Page). Optional like WhatsApp: without META_PAGE_ID and
 * META_PAGE_ACCESS_TOKEN nothing is sent.
 *
 * Every message is logged to Bikriup (People › Chats), like WhatsApp. The bot's
 * settings (first questions, texts, which channels it answers) live in Bikriup ›
 * Your shops › Chats and come here through POST /chats/config.
 *
 * Meta's window: anything within 24 hours of the customer's last message; after
 * that, for 7 days, only a person may answer (the HUMAN_AGENT tag).
 */

export type SocialChannel = "instagram" | "messenger";

export function socialEnabled(): boolean {
  return Boolean(serverEnv.META_PAGE_ID && serverEnv.META_PAGE_ACCESS_TOKEN);
}

const auth = () => ({ Authorization: `Bearer ${serverEnv.META_PAGE_ACCESS_TOKEN}` });

/* ---------- Sending ---------- */

/** One message (text, quick replies, a template) to one person on Instagram or Messenger. */
export async function sendSocialRaw(
  channel: SocialChannel,
  userId: string,
  message: Record<string, unknown>,
  opts: { humanAgent?: boolean } = {},
): Promise<SendResult> {
  if (!socialEnabled()) return { ok: false, error: "Instagram / Messenger is not set up" };
  try {
    const res = await fetch(`${GRAPH_URL}/${serverEnv.META_PAGE_ID}/messages`, {
      method: "POST",
      headers: { ...auth(), "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: userId },
        message,
        ...(opts.humanAgent
          ? { messaging_type: "MESSAGE_TAG", tag: "HUMAN_AGENT" }
          : { messaging_type: "RESPONSE" }),
      }),
      // Bikriup gives its webhook 8 s; a slow send must not make it retry the whole event.
      signal: AbortSignal.timeout(5000),
    });
    const json = (await res.json().catch(() => ({}))) as {
      message_id?: string;
      error?: { message?: string; error_user_msg?: string };
    };
    if (!res.ok) {
      const error = json.error?.error_user_msg || json.error?.message || `HTTP ${res.status}`;
      console.error(`[${channel}] send to ${userId} failed: ${error}`);
      return { ok: false, error };
    }
    return { ok: true, id: json.message_id ?? "" };
  } catch (error) {
    console.error(`[${channel}] send to ${userId} failed:`, error);
    return {
      ok: false,
      error: `Could not reach ${channel === "instagram" ? "Instagram" : "Messenger"}`,
    };
  }
}

/** A bot message, logged to the chat in Bikriup. */
export async function sendSocial(
  channel: SocialChannel,
  userId: string,
  kind: ChatKind,
  logText: string,
  message: Record<string, unknown>,
  opts: { mode?: "bot" | "human"; cards?: ChatCard[] } = {},
): Promise<SendResult> {
  const sent = await sendSocialRaw(channel, userId, message);
  if (sent.ok)
    await logChat({
      channel,
      user_id: userId,
      dir: "out",
      kind,
      body: logText,
      wa_id: sent.id,
      mode: opts.mode,
      cards: opts.cards,
    });
  return sent;
}

/** Quick-reply buttons under a message: Meta allows 13, each title up to 20 characters. */
export function quickReplies(list: Array<{ title: string; payload: string }>) {
  return list.slice(0, 13).map((q) => ({
    content_type: "text",
    title: q.title.length > 20 ? `${q.title.slice(0, 19)}…` : q.title,
    payload: q.payload.slice(0, 1000),
  }));
}

export function sendSocialText(
  channel: SocialChannel,
  userId: string,
  text: string,
  opts: {
    kind?: ChatKind;
    mode?: "bot" | "human";
    quick?: Array<{ title: string; payload: string }>;
  } = {},
) {
  return sendSocial(
    channel,
    userId,
    opts.kind ?? "text",
    text,
    {
      text: text.slice(0, 1000),
      ...(opts.quick?.length ? { quick_replies: quickReplies(opts.quick) } : {}),
    },
    { mode: opts.mode },
  );
}

/* ---------- Product cards ---------- */

/**
 * A link to a product that remembers which chat it came from, so an order placed
 * after it is linked back to the chat (Bikriup › People › Chats › the buyer).
 */
function refKey() {
  return `chat-ref:${serverEnv.BIKRIUP_SECRET_KEY ?? serverEnv.WHATSAPP_APP_SECRET ?? ""}`;
}

/** The cookie /api/chat-ref sets, read by the checkout. */
export const CHAT_REF_COOKIE = "mk_chat";

export function chatRefToken(channel: SocialChannel, userId: string): string {
  const payload = Buffer.from(`${channel}:${userId}`).toString("base64url");
  const mac = createHmac("sha256", refKey()).update(payload).digest("base64url").slice(0, 24);
  return `${payload}.${mac}`;
}

export function readChatRef(token: string): { channel: SocialChannel; userId: string } | null {
  const [payload, mac] = String(token ?? "").split(".");
  if (!payload || !mac) return null;
  const want = Buffer.from(
    createHmac("sha256", refKey()).update(payload).digest("base64url").slice(0, 24),
  );
  const got = Buffer.from(mac);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  const [channel, userId] = Buffer.from(payload, "base64url").toString().split(":");
  if ((channel !== "instagram" && channel !== "messenger") || !/^\d+$/.test(userId ?? ""))
    return null;
  return { channel, userId };
}

export function chatLink(channel: SocialChannel, userId: string, path: string): string {
  return `${SITE_URL}/api/chat-ref?t=${chatRefToken(channel, userId)}&to=${encodeURIComponent(path)}`;
}

function productImage(p: StoreProduct): string {
  const img =
    p.images.find((i) => i.isPrimary && i.resourceType === "image") ??
    p.images.find((i) => i.resourceType === "image");
  if (!img) return "";
  try {
    return cloudinaryUrl({
      publicId: img.publicId,
      version: img.version,
      transforms: ["w_600", "h_600", "c_fill"],
    });
  } catch {
    return "";
  }
}

/** Up to 10 products as a swipeable row of cards, each with Buy on website (and More like this). */
export function productTemplate(channel: SocialChannel, userId: string, products: StoreProduct[]) {
  const list = products.slice(0, 10);
  const cards: ChatCard[] = list.map((p) => ({
    name: [p.name, p.sizeLabel].filter(Boolean).join(" "),
    price: p.pricePaise / 100,
    image: productImage(p),
    url: `${SITE_URL}/shop/${p.slug}`,
  }));
  const message = {
    attachment: {
      type: "template",
      payload: {
        template_type: "generic",
        elements: list.map((p, i) => ({
          title: cards[i]!.name.slice(0, 80),
          subtitle:
            `${formatPaise(p.pricePaise)} · free delivery${p.stockQty <= 0 ? " · out of stock" : ""}`.slice(
              0,
              80,
            ),
          ...(cards[i]!.image ? { image_url: cards[i]!.image } : {}),
          buttons: [
            {
              type: "web_url",
              url: chatLink(channel, userId, `/shop/${p.slug}`),
              title: "Buy on website",
            },
            ...(p.categorySlug
              ? [{ type: "postback", title: "More like this", payload: `cat:${p.categorySlug}` }]
              : []),
          ],
        })),
      },
    },
  };
  return { message, cards };
}

/* ---------- Who the customer is ---------- */

const profiles = new Map<
  string,
  { name: string; handle: string; followers?: number; at: number }
>();

/** Name (and on Instagram the @handle and followers), cached for a day. */
export async function profileOf(channel: SocialChannel, userId: string) {
  const key = `${channel}:${userId}`;
  const hit = profiles.get(key);
  if (hit && Date.now() - hit.at < 24 * 60 * 60e3) return hit;
  const fields = channel === "instagram" ? "name,username,follower_count" : "first_name,last_name";
  try {
    const res = await fetch(`${GRAPH_URL}/${encodeURIComponent(userId)}?fields=${fields}`, {
      headers: auth(),
      signal: AbortSignal.timeout(4000),
    });
    const p = (await res.json()) as {
      name?: string;
      username?: string;
      follower_count?: number;
      first_name?: string;
      last_name?: string;
    };
    const out = {
      name: (p.name ?? [p.first_name, p.last_name].filter(Boolean).join(" ")).trim(),
      handle: p.username ?? "",
      followers: typeof p.follower_count === "number" ? p.follower_count : undefined,
      at: Date.now(),
    };
    if (res.ok) profiles.set(key, out);
    return out;
  } catch {
    return { name: "", handle: "", at: Date.now() };
  }
}

/** A photo, story or file the customer sent, as a data URL for Bikriup. Meta's links here are public but expire. */
export async function fetchAttachment(url: string): Promise<string | null> {
  if (!/^https:\/\//.test(url)) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const type = String(res.headers.get("content-type") ?? "")
      .split(";")[0]!
      .trim()
      .toLowerCase();
    if (!MEDIA_TYPES.test(type)) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (!buf.length || buf.length > MEDIA_MAX) return null;
    return `data:${type};base64,${buf.toString("base64")}`;
  } catch (error) {
    console.error("[social] attachment fetch failed:", error);
    return null;
  }
}

/* ---------- The bot's settings (Bikriup › Your shops › Chats) ---------- */

export type StarterAction = "products" | "best" | "delivery" | "care" | "track" | "bulk" | "human";

export interface ChatConfig {
  on: boolean;
  bot: Record<"whatsapp" | "instagram" | "messenger", boolean>;
  mention: boolean;
  starters: Array<{ title: string; action: StarterAction }>;
  texts: { welcome: string; delivery: string; mention: string };
  changed_at: string;
}

const FALLBACK: ChatConfig = {
  on: true,
  bot: { whatsapp: true, instagram: true, messenger: true },
  mention: true,
  starters: [
    { title: "Browse & order", action: "products" },
    { title: "Delivery & cash on delivery", action: "delivery" },
    { title: "Where is my order?", action: "track" },
    { title: "Talk to someone", action: "human" },
  ],
  texts: {
    welcome:
      "Namaste {first name}! Welcome to Mudkraft: handmade clay cookware from Khurja. How can we help you today?",
    delivery:
      "Delivery is free across India. Pay cash on delivery, or online with UPI, card or net banking.",
    mention: "Thank you for the mention! It means a lot to us.",
  },
  changed_at: "",
};

let cached: { cfg: ChatConfig; at: number } | null = null;
let pageInfo: { page: string; instagram: string } | null = null;
let syncedFor = "";

async function accountNames() {
  if (pageInfo || !socialEnabled()) return pageInfo ?? { page: "", instagram: "" };
  try {
    const res = await fetch(
      `${GRAPH_URL}/${serverEnv.META_PAGE_ID}?fields=name,instagram_business_account{username}`,
      { headers: auth(), signal: AbortSignal.timeout(4000) },
    );
    const p = (await res.json()) as {
      name?: string;
      instagram_business_account?: { username?: string };
    };
    if (res.ok) {
      pageInfo = {
        page: p.name ?? "",
        instagram: p.instagram_business_account?.username
          ? `@${p.instagram_business_account.username}`
          : "",
      };
    }
  } catch {
    /* names are only for the setup tab */
  }
  return pageInfo ?? { page: "", instagram: "" };
}

/** The bot's settings, at most a minute old. Falls back to defaults when Bikriup can't be reached. */
export async function chatConfig(fresh = false): Promise<ChatConfig> {
  if (!fresh && cached && Date.now() - cached.at < 60e3) return cached.cfg;
  if (!bikriupEnabled()) return FALLBACK;
  try {
    const names = await accountNames();
    const ig = Boolean(socialEnabled() && serverEnv.INSTAGRAM_ACCOUNT_ID);
    const cfg = await bikriup<ChatConfig>("/chats/config", {
      method: "POST",
      body: {
        channels: {
          whatsapp: { connected: whatsappEnabled() },
          instagram: { connected: ig, name: ig ? names.instagram : "" },
          messenger: { connected: socialEnabled(), name: socialEnabled() ? names.page : "" },
        },
      },
    });
    cached = { cfg, at: Date.now() };
    // First questions changed (or this server just started): push them to Meta.
    if (cfg.changed_at !== syncedFor) void syncProfiles(cfg);
    return cfg;
  } catch (error) {
    console.error("[social] chat config failed:", error);
    return cached?.cfg ?? FALLBACK;
  }
}

/**
 * The first questions (ice breakers) on both, and Messenger's menu next to the
 * typing box. A channel whose bot is off has them removed.
 */
/** True when the profile's ice breakers / menu were written by this bot (payloads "start:…"). */
async function ownProfile(url: string): Promise<boolean> {
  const res = await fetch(`${url}&fields=ice_breakers,persistent_menu`, {
    headers: auth(),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return false;
  const text = await res.text();
  return text.includes('"payload":"start:');
}

export async function syncProfiles(cfg?: ChatConfig) {
  if (!socialEnabled()) return;
  const c = cfg ?? (await chatConfig(true));
  syncedFor = c.changed_at;
  const starters = c.starters.map((s) => ({ title: s.title, payload: `start:${s.action}` }));
  const iceBreakers = [
    {
      locale: "default",
      call_to_actions: starters.map((s) => ({
        question: s.title.slice(0, 80),
        payload: s.payload,
      })),
    },
  ];
  const targets: Array<{ platform: SocialChannel; on: boolean; body: Record<string, unknown> }> = [
    {
      platform: "messenger",
      on: c.bot.messenger && starters.length > 0,
      body: {
        ice_breakers: iceBreakers,
        persistent_menu: [
          {
            locale: "default",
            composer_input_disabled: false,
            call_to_actions: starters.map((s) => ({
              type: "postback",
              title: s.title.slice(0, 30),
              payload: s.payload,
            })),
          },
        ],
      },
    },
    {
      platform: "instagram",
      on: Boolean(serverEnv.INSTAGRAM_ACCOUNT_ID) && c.bot.instagram && starters.length > 0,
      body: { ice_breakers: iceBreakers },
    },
  ];
  let ok = true;
  for (const t of targets) {
    if (t.platform === "instagram" && !serverEnv.INSTAGRAM_ACCOUNT_ID) continue;
    const url = `${GRAPH_URL}/${serverEnv.META_PAGE_ID}/messenger_profile?platform=${t.platform}`;
    try {
      // Bot off: clear only what this bot set. Questions and menus made in Meta Business
      // Suite (its "Frequently asked questions") live in the same place and are left alone.
      if (!t.on && !(await ownProfile(url))) continue;
      const res = await fetch(url, {
        method: t.on ? "POST" : "DELETE",
        headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify(
          t.on
            ? t.body
            : {
                fields:
                  t.platform === "messenger"
                    ? ["ice_breakers", "persistent_menu"]
                    : ["ice_breakers"],
              },
        ),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        ok = false;
        console.error(
          `[${t.platform}] profile sync failed:`,
          await res.text().catch(() => res.status),
        );
      }
    } catch (error) {
      ok = false;
      console.error(`[${t.platform}] profile sync failed:`, error);
    }
  }
  if (ok && bikriupEnabled()) {
    await bikriup("/chats/config", { method: "POST", body: { synced: true } }).catch(
      () => undefined,
    );
  } else if (!ok) {
    syncedFor = "";
  }
}

/* ---------- Earlier Messenger chats ---------- */

interface ConvMessage {
  id: string;
  message?: string;
  created_time: string;
  from?: { id: string; name?: string };
  attachments?: {
    data?: Array<{ image_data?: { url?: string }; file_url?: string; name?: string }>;
  };
}

interface Conversation {
  updated_time: string;
  participants?: { data?: Array<{ id: string; name?: string }> };
  messages?: { data?: ConvMessage[] };
}

/** Brings the Page's Messenger chats of the last `days` into Bikriup, once (Bikriup skips what it has). */
export async function importMessenger(days = 30): Promise<number> {
  if (!socialEnabled() || !bikriupEnabled()) return 0;
  const since = Date.now() - days * 24 * 60 * 60e3;
  const page = serverEnv.META_PAGE_ID!;
  let url: string | undefined =
    `${GRAPH_URL}/${page}/conversations?platform=messenger&limit=25` +
    `&fields=updated_time,participants,messages.limit(50){id,message,created_time,from,attachments}`;
  let count = 0;
  for (let pages = 0; url && pages < 20; pages += 1) {
    const res: Response = await fetch(url, { headers: auth(), signal: AbortSignal.timeout(15000) });
    const json = (await res.json().catch(() => ({}))) as {
      data?: Conversation[];
      paging?: { next?: string };
      error?: { message?: string };
    };
    if (!res.ok) {
      console.error("[messenger] import failed:", json.error?.message ?? res.status);
      break;
    }
    let older = false;
    for (const conv of json.data ?? []) {
      if (Date.parse(conv.updated_time) < since) {
        older = true;
        continue;
      }
      const person = conv.participants?.data?.find((p) => p.id !== page);
      if (!person) continue;
      const messages = [...(conv.messages?.data ?? [])].sort(
        (a, b) => Date.parse(a.created_time) - Date.parse(b.created_time),
      );
      for (const m of messages) {
        const fromPage = m.from?.id === page;
        const file = m.attachments?.data?.[0];
        const text =
          m.message?.trim() ||
          (file ? (file.image_data ? "Sent a photo" : `Sent ${file.name || "a file"}`) : "");
        if (!text) continue;
        await logChat({
          channel: "messenger",
          user_id: person.id,
          name: person.name,
          dir: fromPage ? "out" : "in",
          kind: fromPage ? "reply" : file ? "media" : "text",
          body: text,
          wa_id: m.id,
          imported: true,
          at: m.created_time,
        });
      }
      count += 1;
    }
    url = older ? undefined : json.paging?.next;
  }
  return count;
}
