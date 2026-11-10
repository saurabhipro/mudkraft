import { SITE_URL } from "@/lib/seo";

import { BikriupError, bikriup, orderToken, type BkOrder } from "../bikriup";
import { serverEnv } from "../env";
import { getActiveProducts, type StoreProduct } from "../store/products";
import { logChat, type ChatKind } from "../whatsapp";
import {
  chatConfig,
  fetchAttachment,
  productTemplate,
  profileOf,
  sendSocial,
  sendSocialText,
  type ChatConfig,
  type SocialChannel,
  type StarterAction,
} from ".";

/**
 * The bot on Instagram and Messenger. It mirrors the WhatsApp bot (server/whatsapp/bot.ts)
 * with what these channels can do: no in-chat cart, so products come as cards with
 * "Buy on website"; the first questions (ice breakers) and Messenger's menu come from
 * Bikriup › Your shops › Chats.
 *
 * Menu taps always get an answer; anything typed is left to the studio once a person
 * has taken the chat over (Bikriup › People › Chats › You), or when the channel's bot is off.
 */

export interface MessagingEvent {
  sender: { id: string };
  recipient: { id: string };
  timestamp?: number;
  message?: {
    mid: string;
    text?: string;
    is_echo?: boolean;
    app_id?: number | string;
    is_deleted?: boolean;
    is_unsupported?: boolean;
    quick_reply?: { payload?: string };
    reply_to?: { story?: { url?: string; id?: string } };
    attachments?: Array<{ type: string; payload?: { url?: string; title?: string } }>;
  };
  postback?: { mid?: string; title?: string; payload?: string };
}

const MENU_GAP_MS = 12 * 60 * 60 * 1000;
const GREETING = /^(hi+|hello|hey|hlo|helo|namaste|namaskar|menu|start|options?)\b/i;
const ORDER_NO = /\b([A-Z]{2,4}\d{5,})\b/i;
const MOBILE = /(?:\+?91[\s-]*)?\b([6-9]\d{9})\b/;
const FILE_WORD: Record<string, string> = {
  image: "a photo",
  video: "a video",
  audio: "a voice note",
  file: "a file",
};

/* ---------- Incoming ---------- */

async function describe(
  m: NonNullable<MessagingEvent["message"]>,
): Promise<{ kind: ChatKind; text: string; media?: string }> {
  const att = m.attachments?.[0];
  if (att?.type === "story_mention") {
    return {
      kind: "mention",
      text: "Mentioned you in a story",
      media: (await fetchAttachment(att.payload?.url ?? "")) ?? undefined,
    };
  }
  if (m.reply_to?.story) {
    const media = (await fetchAttachment(m.reply_to.story.url ?? "")) ?? undefined;
    return { kind: "story", text: m.text?.trim() || "Replied to your story", media };
  }
  if (att && FILE_WORD[att.type]) {
    const media = (await fetchAttachment(att.payload?.url ?? "")) ?? undefined;
    return { kind: "media", text: m.text?.trim() || `Sent ${FILE_WORD[att.type]}`, media };
  }
  if (att) {
    // A shared post, reel or link: keep its address so the studio can open it.
    const url = att.payload?.url ?? "";
    return {
      kind: "text",
      text: [m.text?.trim(), `Shared a ${att.type.replace(/_/g, " ")}${url ? `: ${url}` : ""}`]
        .filter(Boolean)
        .join("\n"),
    };
  }
  if (m.is_unsupported)
    return { kind: "text", text: "Sent something this inbox can't show. Open it in the app." };
  return { kind: "text", text: m.text ?? "" };
}

export async function handleSocial(channel: SocialChannel, ev: MessagingEvent): Promise<void> {
  const m = ev.message;

  // Our page wrote: our own sends are logged already; a reply typed in Meta's inbox is the studio answering.
  if (m?.is_echo) {
    // Without META_APP_ID our own sends can't be told apart, so echoes are skipped altogether.
    if (!serverEnv.META_APP_ID || String(m.app_id ?? "") === serverEnv.META_APP_ID) return;
    const { kind, text, media } = await describe(m);
    if (!text && !media) return;
    await logChat({
      channel,
      user_id: ev.recipient.id,
      dir: "out",
      kind: kind === "text" ? "reply" : kind,
      body: text,
      wa_id: m.mid,
      mode: "human",
      ...(media ? { media } : {}),
    });
    return;
  }
  if (m?.is_deleted) return;

  const userId = ev.sender.id;
  const who = await profileOf(channel, userId);
  const first = who.name.split(/\s+/)[0] ?? "";
  const tap = ev.postback?.payload ?? m?.quick_reply?.payload ?? "";
  const said =
    m && !tap
      ? await describe(m)
      : { kind: "text" as ChatKind, text: ev.postback?.title ?? m?.text ?? "" };
  if (!said.text && !("media" in said && said.media)) return;

  const chat = await logChat({
    channel,
    user_id: userId,
    dir: "in",
    kind: said.kind,
    body: said.text,
    name: who.name,
    handle: who.handle,
    followers: who.followers,
    wa_id: m?.mid ?? ev.postback?.mid,
    ...("media" in said && said.media ? { media: said.media } : {}),
  });
  const cfg = await chatConfig();
  const botOn = cfg.bot[channel] !== false;

  if (said.kind === "mention") {
    if (cfg.mention && botOn) await sendSocialText(channel, userId, cfg.texts.mention);
    return;
  }

  // Menu taps and first questions answer the bot's own buttons, so they work even while the studio is in the chat.
  if (tap) return choose(channel, userId, tap, first, cfg);
  const starter = cfg.starters.find(
    (s) => s.title.toLowerCase() === said.text.trim().toLowerCase(),
  );
  if (starter) return choose(channel, userId, `start:${starter.action}`, first, cfg);

  if (!botOn) return;
  const text = said.kind === "text" ? said.text.trim() : "";
  // "MENU" works even while the studio is answering, and gives the chat back to the bot.
  if (/^(menu|options?)\b/i.test(text)) return sendWelcome(channel, userId, first, cfg, "bot");
  if (chat?.mode === "human") return;

  // An order number (and the mobile it was placed with) gets its status straight away.
  const orderNo = ORDER_NO.exec(text)?.[1];
  if (orderNo) return orderStatus(channel, userId, orderNo.toUpperCase(), MOBILE.exec(text)?.[1]);

  const stale =
    !chat?.last_menu_at || Date.now() - new Date(chat.last_menu_at).getTime() > MENU_GAP_MS;
  if (GREETING.test(text) || stale) return sendWelcome(channel, userId, first, cfg);

  await sendSocialText(
    channel,
    userId,
    "Thank you! Someone from the studio will reply here shortly.",
    {
      mode: "human",
      quick: [{ title: "Main menu", payload: "menu" }],
    },
  );
}

/* ---------- Menu ---------- */

const starterButtons = (cfg: ChatConfig) =>
  cfg.starters.map((s) => ({ title: s.title, payload: `start:${s.action}` }));

async function sendWelcome(
  channel: SocialChannel,
  userId: string,
  first: string,
  cfg: ChatConfig,
  mode?: "bot",
) {
  const text = cfg.texts.welcome
    .replace(/\{first name\}/g, first)
    .replace(/\s+!/g, "!")
    .replace(/ {2,}/g, " ");
  await sendSocialText(channel, userId, text, { kind: "menu", mode, quick: starterButtons(cfg) });
}

async function choose(
  channel: SocialChannel,
  userId: string,
  payload: string,
  first: string,
  cfg: ChatConfig,
) {
  if (payload === "menu") return sendWelcome(channel, userId, first, cfg, "bot");
  if (payload.startsWith("cat:"))
    return sendProducts(channel, userId, { category: payload.slice(4) });
  const action = (payload.startsWith("start:") ? payload.slice(6) : payload) as StarterAction;
  const menu = [
    { title: "Main menu", payload: "menu" },
    { title: "Talk to someone", payload: "start:human" },
  ];
  switch (action) {
    case "products":
      return sendProducts(channel, userId, {});
    case "best":
      return sendProducts(channel, userId, { best: true });
    case "delivery":
      await sendSocialText(
        channel,
        userId,
        `${cfg.texts.delivery}\n\nDispatch and delivery times: ${SITE_URL}/shipping-returns`,
        { quick: menu },
      );
      return;
    case "care":
      await sendSocialText(
        channel,
        userId,
        `Unglazed clay needs seasoning once before its first use, and then gentle heat. Our step-by-step guide: ${SITE_URL}/care/season-your-handi`,
        { quick: menu },
      );
      return;
    case "track":
      await sendSocialText(
        channel,
        userId,
        "Send me your order number (it starts with MK) and the mobile number you ordered with, and I'll check where it is.",
      );
      return;
    case "bulk":
      await sendSocialText(
        channel,
        userId,
        `Lovely! Tell us what you have in mind (pieces or event, quantity, date and city) and the studio will reply here. Workshops: ${SITE_URL}/workshops`,
        { mode: "human" },
      );
      return;
    case "human":
      await sendSocialText(
        channel,
        userId,
        `Sure${first ? ` ${first}` : ""}! Someone from the studio will reply here shortly.`,
        {
          mode: "human",
        },
      );
      return;
    default:
      return sendWelcome(channel, userId, first, cfg);
  }
}

/* ---------- Products ---------- */

async function sendProducts(
  channel: SocialChannel,
  userId: string,
  opts: { category?: string; best?: boolean },
) {
  const all = await getActiveProducts();
  const inStock = all.filter((p) => p.stockQty > 0);
  const list: StoreProduct[] = opts.category
    ? inStock.filter((p) => p.categorySlug === opts.category)
    : inStock;
  if (!list.length) {
    await sendSocialText(
      channel,
      userId,
      `See all our pieces and order online: ${SITE_URL}/#collection`,
    );
    return;
  }
  const categories = [
    ...new Map(
      all
        .filter((p) => p.categorySlug && p.categoryName)
        .map((p) => [p.categorySlug!, p.categoryName!]),
    ),
  ];
  const intro = opts.category
    ? `More from ${list[0]?.categoryName ?? "this range"}. Swipe to see them all.`
    : opts.best
      ? "Our bestsellers. Swipe for more, or pick a category below."
      : "Here's what we make. Swipe for more, or pick a category below.";
  await sendSocialText(channel, userId, intro, { kind: "catalog" });
  const { message, cards } = productTemplate(channel, userId, list);
  const sent = await sendSocial(
    channel,
    userId,
    "catalog",
    `Shared ${cards.length} products`,
    message,
    { cards },
  );
  if (!sent.ok) {
    await sendSocialText(
      channel,
      userId,
      `See all our pieces and order online: ${SITE_URL}/#collection`,
    );
    return;
  }
  await sendSocialText(
    channel,
    userId,
    "Tap Buy on website to order. Doorstep delivery, cash on delivery available.",
    {
      quick: [
        ...categories
          .filter(([slug]) => slug !== opts.category)
          .slice(0, 10)
          .map(([slug, name]) => ({ title: name, payload: `cat:${slug}` })),
        { title: "Talk to someone", payload: "start:human" },
      ],
    },
  );
}

/* ---------- Order status ---------- */

async function orderStatus(
  channel: SocialChannel,
  userId: string,
  orderNo: string,
  phone?: string,
) {
  if (!phone) {
    await sendSocialText(
      channel,
      userId,
      `Thanks! Please send ${orderNo} again together with the mobile number you ordered with, in one message, so I can check it.`,
    );
    return;
  }
  let o: BkOrder;
  try {
    o = await bikriup<BkOrder>(`/orders/${encodeURIComponent(orderNo)}?phone=${phone}`);
  } catch (error) {
    const missing = error instanceof BikriupError && error.status === 404;
    await sendSocialText(
      channel,
      userId,
      missing
        ? `I couldn't find ${orderNo} for that mobile number. Please check both, or tap Talk to someone.`
        : "I couldn't check that just now. Someone from the studio will reply here shortly.",
      {
        mode: missing ? undefined : "human",
        quick: [{ title: "Talk to someone", payload: "start:human" }],
      },
    );
    return;
  }
  const items = o.items
    .map((i) => `${i.qty} × ${[i.name, i.size].filter(Boolean).join(" ")}`)
    .join(", ");
  const link = `${SITE_URL}/checkout/done/${orderToken(o.order_no, o.phone)}`;
  const tracking = o.tracking_url || link;
  const sent = await sendSocial(
    channel,
    userId,
    "order",
    `Order ${o.order_no}: ${o.status_label}`,
    {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [
            {
              title: `Order ${o.order_no} · ${o.status_label}`.slice(0, 80),
              subtitle: [
                items,
                o.courier ? `${o.courier}${o.tracking_no ? ` ${o.tracking_no}` : ""}` : "",
              ]
                .filter(Boolean)
                .join(" · ")
                .slice(0, 80),
              buttons: [
                {
                  type: "web_url",
                  url: tracking,
                  title: o.tracking_url ? "Track parcel" : "See order",
                },
              ],
            },
          ],
        },
      },
    },
  );
  if (!sent.ok)
    await sendSocialText(
      channel,
      userId,
      `Order ${o.order_no}: ${o.status_label}. Details: ${link}`,
      { kind: "order" },
    );
}
