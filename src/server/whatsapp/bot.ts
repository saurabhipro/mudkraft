import { createHmac, timingSafeEqual } from "node:crypto";

import { formatPaise } from "@/lib/money";
import { SITE_URL } from "@/lib/seo";
import { isCodEligible } from "@/lib/serviceability";

import { BikriupError, bikriup, orderToken, type BkOrder } from "../bikriup";
import { sendOrderConfirmationEmail } from "../email/send";
import { serverEnv } from "../env";
import { getActiveProducts } from "../store/products";
import { fetchMedia, logChat, sendChat, sendText, type ChatKind } from ".";
import { FLOW_SCREEN } from "./flow";

/**
 * The WhatsApp bot on the studio's number. A customer writes → a welcome with a
 * menu (browse the catalog, bestsellers, delivery, care, track, bulk, talk to us).
 * From the catalog they send a cart → a checkout form (WhatsApp Flow) → the order
 * is placed in Bikriup (Billing › Orders, badge "WhatsApp") and the usual order
 * messages follow.
 *
 * Every message the customer starts is free; so is everything the bot sends back
 * within 24 hours. Messages and the bot/human switch live in Bikriup (People ›
 * WhatsApp): once the studio replies there, the bot keeps quiet in that chat,
 * except for menu taps and forms, which it always answers.
 */

export interface IncomingMessage {
  id: string;
  from: string;
  type: string;
  text?: { body?: string };
  button?: { text?: string; payload?: string };
  interactive?: {
    type: string;
    list_reply?: { id: string; title: string };
    button_reply?: { id: string; title: string };
    nfm_reply?: { response_json?: string };
  };
  image?: { id: string; caption?: string; mime_type?: string };
  sticker?: { id: string; mime_type?: string };
  audio?: { id: string; mime_type?: string; voice?: boolean };
  video?: { id: string; caption?: string; mime_type?: string };
  document?: { id: string; caption?: string; filename?: string; mime_type?: string };
  order?: { product_items?: Array<{ product_retailer_id: string; quantity: number }> };
}

const MENU_GAP_MS = 12 * 60 * 60 * 1000;
const GREETING = /^(hi+|hello|hey|hlo|helo|namaste|namaskar|menu|start|options?)\b/i;
const DIVIDER = "\n\nType MENU any time to see the options again.";

const MENU_ROWS = [
  {
    id: "catalog",
    title: "Browse & order",
    description: "See every piece, add to cart and order right here",
  },
  { id: "best", title: "Bestsellers", description: "Our most-loved clay cookware" },
  {
    id: "delivery",
    title: "Delivery & payment",
    description: "Free delivery, cash on delivery, online payment",
  },
  { id: "care", title: "Seasoning & care", description: "What to do before the first use" },
  { id: "track", title: "Track my order", description: "Where is my parcel?" },
  { id: "bulk", title: "Bulk, gifting, workshops", description: "For events, offices and schools" },
  { id: "human", title: "Talk to us", description: "A person from the studio replies" },
];

/* ---------- Incoming ---------- */

function describe(m: IncomingMessage): { kind: ChatKind; text: string } {
  if (m.type === "text") return { kind: "text", text: m.text?.body ?? "" };
  if (m.type === "order") {
    const n = (m.order?.product_items ?? []).reduce((sum, it) => sum + Number(it.quantity || 0), 0);
    return { kind: "cart", text: `Sent a cart: ${n} item${n === 1 ? "" : "s"}` };
  }
  if (m.type === "interactive") {
    const pick = m.interactive?.list_reply ?? m.interactive?.button_reply;
    if (pick) return { kind: "text", text: pick.title };
    if (m.interactive?.type === "nfm_reply")
      return { kind: "form", text: "Filled in the delivery form" };
  }
  if (m.type === "button") return { kind: "text", text: m.button?.text ?? "" };
  // A caption, when there is one, is what they said; Bikriup shows the file above it.
  if (m.type === "image")
    return { kind: "media", text: m.image?.caption?.trim() || "Sent a photo" };
  if (m.type === "video")
    return { kind: "media", text: m.video?.caption?.trim() || "Sent a video" };
  if (m.type === "audio") return { kind: "media", text: "Sent a voice note" };
  if (m.type === "document") {
    // Bikriup reads the first line as the file name and the rest as the caption.
    const name = m.document?.filename?.trim() || "Sent a document";
    const caption = m.document?.caption?.trim();
    return { kind: "media", text: caption && caption !== name ? `${name}\n${caption}` : name };
  }
  return {
    kind: "media",
    text: `Sent ${m.type === "image" ? "a photo" : m.type === "audio" ? "a voice note" : `a ${m.type}`}`,
  };
}

export async function handleIncoming(m: IncomingMessage, profileName: string): Promise<void> {
  const { kind, text } = describe(m);
  const mediaId = (m.image ?? m.sticker ?? m.audio ?? m.video ?? m.document)?.id;
  const media = mediaId ? await fetchMedia(mediaId) : null;
  const chat = await logChat({
    phone: m.from,
    dir: "in",
    kind,
    body: text,
    name: profileName,
    wa_id: m.id,
    ...(media ? { media } : {}),
  });
  const first = profileName.trim().split(/\s+/)[0] || "";

  // Menu taps, carts and forms answer the bot's own messages, so they work even while the studio is in the chat.
  const pick = m.interactive?.list_reply ?? m.interactive?.button_reply;
  if (pick) return menuChoice(m.from, pick.id, first);
  if (m.interactive?.type === "nfm_reply") return placeOrder(m, profileName);
  if (m.type === "order") return checkout(m.from, cartOf(m), profileName);

  const said = m.type === "text" ? (m.text?.body ?? "").trim() : "";
  // "Type MENU any time": it works even while the studio is answering, and gives the chat back to the bot.
  if (/^(menu|options?)\b/i.test(said)) return sendMenu(m.from, first, "bot");
  if (chat?.mode === "human") return;
  const stale =
    !chat?.last_menu_at || Date.now() - new Date(chat.last_menu_at).getTime() > MENU_GAP_MS;
  if (GREETING.test(said) || stale) return sendMenu(m.from, first);

  // Anything else, once they have seen the menu, is for a person.
  await sendText(
    m.from,
    `Thank you! Someone from the studio will reply here shortly.${DIVIDER}`,
    "text",
    "human",
  );
}

/* ---------- Menu ---------- */

async function sendMenu(to: string, first: string, mode?: "bot") {
  await sendChat(
    to,
    "menu",
    "Welcome message with the menu",
    {
      type: "interactive",
      interactive: {
        type: "list",
        header: { type: "text", text: "Mudkraft" },
        body: {
          text: `Namaste${first ? ` ${first}` : ""}! 🙏 Welcome to Mudkraft: handmade, wood-fired, unglazed clay cookware from Khurja.\n\nHow can we help you today?`,
        },
        footer: { text: "Free delivery across India" },
        action: { button: "See options", sections: [{ title: "Choose one", rows: MENU_ROWS }] },
      },
    },
    mode,
  );
}

async function menuChoice(to: string, id: string, first: string) {
  switch (id) {
    case "catalog":
      return sendCatalog(to);
    case "best":
      return sendBestsellers(to);
    case "delivery":
      await sendText(
        to,
        `🚚 Delivery is free across India and already included in the price.\n💵 Pay cash on delivery, or online with UPI, card or net banking.\n📦 Every piece is packed by hand. Dispatch and delivery times: ${SITE_URL}/shipping-returns${DIVIDER}`,
      );
      return;
    case "care":
      await sendText(
        to,
        `Unglazed clay needs seasoning once before its first use, and then gentle heat. Our step-by-step guide: ${SITE_URL}/care/season-your-handi${DIVIDER}`,
      );
      return;
    case "track":
      await sendText(
        to,
        `You can track any order here with its order number and your mobile: ${SITE_URL}/track\n\nOr just send us your order number and we'll check.${DIVIDER}`,
        "text",
        "human",
      );
      return;
    case "bulk":
      await sendText(
        to,
        `Lovely! Tell us what you have in mind (pieces or event, quantity, date and city) and the studio will reply here. Workshops: ${SITE_URL}/workshops`,
        "text",
        "human",
      );
      return;
    case "human":
      await sendText(
        to,
        `Sure${first ? ` ${first}` : ""}! Someone from the studio will reply here shortly.${DIVIDER}`,
        "text",
        "human",
      );
      return;
    default:
      return sendMenu(to, first);
  }
}

async function sendCatalog(to: string) {
  const sent = await sendChat(to, "catalog", "Shared the catalog", {
    type: "interactive",
    interactive: {
      type: "catalog_message",
      body: {
        text: "Here is everything we make. Open a piece to see its photos and size, add what you like to your cart, and send the cart here to order.",
      },
      footer: { text: "Free delivery across India" },
      action: { name: "catalog_message" },
    },
  });
  if (!sent.ok)
    await sendText(to, `See all our pieces and order online: ${SITE_URL}/#collection${DIVIDER}`);
}

async function sendBestsellers(to: string) {
  const catalogId = serverEnv.WHATSAPP_CATALOG_ID;
  const slugs = catalogId
    ? (await getActiveProducts())
        .filter((p) => p.stockQty > 0)
        .slice(0, 10)
        .map((p) => p.slug)
    : [];
  if (!slugs.length) return sendCatalog(to);
  const sent = await sendChat(to, "catalog", "Shared the bestsellers", {
    type: "interactive",
    interactive: {
      type: "product_list",
      header: { type: "text", text: "Mudkraft bestsellers" },
      body: {
        text: "Handmade, wood-fired and unglazed. Tap a piece to see it, add it to your cart and send the cart here to order.",
      },
      footer: { text: "Free delivery across India" },
      action: {
        catalog_id: catalogId,
        sections: [
          {
            title: "Bestsellers",
            product_items: slugs.map((slug) => ({ product_retailer_id: slug })),
          },
        ],
      },
    },
  });
  if (!sent.ok) await sendCatalog(to);
}

/* ---------- Cart → checkout form ---------- */

type CartLine = { slug: string; qty: number };

function cartOf(m: IncomingMessage): CartLine[] {
  return (m.order?.product_items ?? [])
    .map((it) => ({
      slug: String(it.product_retailer_id),
      qty: Math.max(1, Math.min(50, Number(it.quantity) || 1)),
    }))
    .slice(0, 50);
}

// The form carries the cart and the number, signed, so the answers cannot be pointed at another cart or person.
function signingKey() {
  return serverEnv.WHATSAPP_APP_SECRET || serverEnv.BIKRIUP_SECRET_KEY || "";
}

function cartToken(phone: string, cart: CartLine[]): string {
  const payload = Buffer.from(
    `${phone.slice(-10)}|${cart.map((l) => `${l.slug}:${l.qty}`).join(",")}`,
  ).toString("base64url");
  const mac = createHmac("sha256", signingKey()).update(payload).digest("base64url").slice(0, 32);
  return `${payload}.${mac}`;
}

function readCartToken(token: string): { phone: string; cart: CartLine[] } | null {
  const [payload, mac] = String(token).split(".");
  if (!payload || !mac) return null;
  const want = Buffer.from(
    createHmac("sha256", signingKey()).update(payload).digest("base64url").slice(0, 32),
  );
  const got = Buffer.from(mac);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  const [phone, list] = Buffer.from(payload, "base64url").toString().split("|");
  const cart = (list ?? "")
    .split(",")
    .map((part) => {
      const at = part.lastIndexOf(":");
      return { slug: part.slice(0, at), qty: Number(part.slice(at + 1)) };
    })
    .filter((l) => l.slug && l.qty > 0);
  return phone && cart.length ? { phone, cart } : null;
}

interface Quote {
  lines: Array<{ name: string; size: string; qty: number }>;
  total: number;
}

const itemLine = (l: { name: string; size?: string; qty: number }) =>
  `${l.qty} × ${[l.name, l.size].filter(Boolean).join(" ")}`;

async function checkout(to: string, cart: CartLine[], profileName: string) {
  if (!cart.length) return;
  let quote: Quote;
  try {
    quote = await bikriup<Quote>("/quote", { method: "POST", body: { items: cart } });
  } catch (error) {
    const reason =
      error instanceof BikriupError && error.status < 500
        ? error.message
        : "We could not check your cart just now.";
    await sendText(
      to,
      `Sorry, ${reason.charAt(0).toLowerCase()}${reason.slice(1)} Please change your cart and send it again, or type MENU.`,
    );
    return;
  }
  const total = formatPaise(Math.round(quote.total * 100));
  const summary = `${quote.lines.map(itemLine).join(", ")} · Total ${total}`;
  if (!serverEnv.WHATSAPP_FLOW_ID) {
    await sendText(
      to,
      `Your cart: ${summary}.\n\nTo finish, please order on our website: ${SITE_URL}/#collection`,
    );
    return;
  }
  await sendChat(to, "form", `Checkout form for: ${summary}`, {
    type: "interactive",
    interactive: {
      type: "flow",
      header: { type: "text", text: "Your order" },
      body: {
        text: `${quote.lines.map(itemLine).join("\n")}\n\nTotal: ${total} (free delivery included)\n\nTap below to add your delivery address and choose how to pay.`,
      },
      footer: { text: "Handmade in Khurja" },
      action: {
        name: "flow",
        parameters: {
          flow_message_version: "3",
          flow_token: cartToken(to, cart),
          flow_id: serverEnv.WHATSAPP_FLOW_ID,
          flow_cta: "Add delivery details",
          flow_action: "navigate",
          flow_action_payload: { screen: FLOW_SCREEN, data: { name: profileName || " ", summary } },
        },
      },
    },
  });
}

/* ---------- Form answers → the order ---------- */

interface FormAnswers {
  flow_token?: string;
  name?: string;
  address?: string;
  city?: string;
  pincode?: string;
  email?: string;
  payment?: string;
}

async function placeOrder(m: IncomingMessage, profileName: string) {
  let answers: FormAnswers;
  try {
    answers = JSON.parse(m.interactive?.nfm_reply?.response_json ?? "{}") as FormAnswers;
  } catch {
    return;
  }
  const ref = readCartToken(answers.flow_token ?? "");
  if (!ref || ref.phone !== m.from.slice(-10)) {
    await sendText(
      m.from,
      "Sorry, that form has expired. Please send your cart again from the catalog.",
    );
    return;
  }

  const pincode = String(answers.pincode ?? "").replace(/\D/g, "");
  if (!/^[1-9]\d{5}$/.test(pincode)) {
    await sendText(
      m.from,
      "That pincode doesn't look right. Please check it and fill the form again below.",
    );
    return checkout(m.from, ref.cart, answers.name || profileName);
  }
  const wantsCod = answers.payment !== "online";
  const cod = wantsCod && isCodEligible(pincode);
  const name =
    String(answers.name ?? profileName)
      .trim()
      .slice(0, 80) || "WhatsApp customer";
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answers.email ?? "")
    ? String(answers.email).trim().toLowerCase()
    : "";

  let created: BkOrder;
  try {
    created = await bikriup<BkOrder>("/orders", {
      method: "POST",
      // The message id: if Meta delivers the same answers twice, Bikriup returns the first order.
      idempotencyKey: `wa:${m.id}`,
      body: {
        name,
        phone: ref.phone,
        email,
        address: String(answers.address ?? "")
          .trim()
          .slice(0, 200),
        city: String(answers.city ?? "")
          .trim()
          .slice(0, 60),
        pincode,
        note: "Ordered on WhatsApp",
        payment_method: cod ? "cod" : "online",
        payment_provider: cod ? "cod" : "razorpay",
        source: "whatsapp",
        items: ref.cart,
      },
    });
  } catch (error) {
    const reason =
      error instanceof BikriupError && error.status < 500
        ? error.message
        : "We could not place the order just now.";
    await sendText(
      m.from,
      `Sorry, ${reason.charAt(0).toLowerCase()}${reason.slice(1)} A person from the studio will help you here.`,
      "text",
      "human",
    );
    return;
  }

  const token = orderToken(created.order_no, created.phone);
  const amount = formatPaise(Math.round(created.total * 100));
  const lines = created.items.map(itemLine).join("\n");
  const codNote =
    wantsCod && !cod
      ? "\n\nCash on delivery isn't available for this pincode, so this order is to be paid online."
      : "";
  await sendText(
    m.from,
    `✅ Order ${created.order_no} placed. Thank you, ${name.split(/\s+/)[0]}!\n\n${lines}\nTotal: ${amount} (free delivery included)\n\n${
      cod
        ? `Please keep ${amount} ready in cash at delivery.`
        : "Please complete the payment below to confirm it."
    }${codNote}\n\nWe'll confirm it shortly and keep you posted here. Order details: ${SITE_URL}/checkout/done/${token}`,
    "order",
  );
  if (!cod) {
    await sendChat(m.from, "order", `Payment link for ${created.order_no}`, {
      type: "interactive",
      interactive: {
        type: "cta_url",
        body: { text: `Pay ${amount} securely with UPI, card or net banking.` },
        action: {
          name: "cta_url",
          parameters: { display_text: "Pay now", url: `${SITE_URL}/checkout/pay/${token}` },
        },
      },
    });
  }

  if (email) {
    await sendOrderConfirmationEmail({
      to: email,
      customerName: name,
      orderNumber: created.order_no,
      lookupToken: token,
      method: cod ? "cod" : "gateway",
      items: created.items.map((item) => ({
        productName: [item.name, item.size].filter(Boolean).join(" "),
        qty: item.qty,
        unitPricePaise: Math.round(item.price * 100),
        lineTotalPaise: Math.round(item.line_total * 100),
        imagePublicId: null,
      })),
      subtotalPaise: Math.round(created.subtotal * 100),
      shippingPaise: Math.round(created.delivery * 100),
      totalPaise: Math.round(created.total * 100),
      address: {
        line1: created.address,
        line2: null,
        city: created.city,
        state: "",
        postalCode: created.pincode,
      },
    });
  }
}
