import { revalidateTag } from "next/cache";
import { after, NextResponse } from "next/server";

import { formatPaise } from "@/lib/money";
import { SITE_URL } from "@/lib/seo";
import { orderToken, verifyBikriupSignature } from "@/server/bikriup";
import {
  sendBroadcast,
  sendPaymentReminder,
  sendProspectBrochure,
  sendQuotationEmail,
  type BroadcastEvent,
  type ProspectEmailEvent,
  type QuoteEmailEvent,
  type ReminderEvent,
} from "@/server/bikriup-messages";
import { sendOrderUpdateEmail } from "@/server/email/send";
import { describeError } from "@/server/redact";
import { claimWebhookEvent } from "@/server/webhook-events";
import {
  cancelBikriupPayLink,
  checkBikriupPayLink,
  createBikriupPayLink,
  emailBikriupPayLink,
  type PayLinkCreateEvent,
  type PayLinkEmailEvent,
} from "@/server/bikriup-paylinks";
import { pingIndexNow } from "@/server/indexnow";
import { pushCatalogPrices } from "@/server/meta-catalog";
import { appBaseUrl } from "@/server/email/templates";
import { CACHE_TAGS } from "@/server/store/tags";
import { importMessenger, productTemplate, sendSocialRaw, syncProfiles } from "@/server/social";
import { getProductBySlug, type StoreProduct } from "@/server/store/products";
import { chatStatus, sendRaw, sendWhatsApp, type SendResult } from "@/server/whatsapp";
import { orderStepMessage } from "@/server/whatsapp/orders";
import { TEMPLATE_LANGUAGE, TEMPLATES, type TemplateDef } from "@/server/whatsapp/templates";

/**
 * Bikriup tells the site when something changed, so cached pages refresh at
 * once instead of waiting out the cache TTL. Register this URL, and copy its
 * signing secret into BIKRIUP_WEBHOOK_SECRET, in Bikriup › Shop › Website & API.
 *
 *   catalog.changed — price, stock, photo, new item or an approved review
 *   order.updated   — the studio moved an order on: the buyer gets an email and
 *                     a WhatsApp message (confirmed with the invoice, shipped
 *                     with tracking, …; server/whatsapp/orders.ts lists them)
 *   chat.reply      — the studio answered a chat in Bikriup › People › Chats
 *                     (WhatsApp, Instagram or Messenger; text and/or product
 *                     cards), or sent an order's invoice / shipping slip PDF or
 *                     tracking to any number from Orders: send it and report back
 *   chat.config     — Your shops › Chats changed: push the first questions to Meta
 *   chat.import     — bring in the Page's earlier Messenger chats
 *   broadcast.send  — Grow › Broadcasts: a batch of people for WhatsApp / email
 *   reminder.send   — People › Udhaar: one payment reminder with the pay link
 *   quote.email     — People › Leads: a quotation emailed with its PDF attached
 *   prospect.email  — People › Prospects: the brochure emailed to one business (sent once per delivery id)
 *   paylink.create / .cancel / .check / .email — Orders › Payment link: a Razorpay link for what
 *                     is due on an order (server/bikriup-paylinks.ts); WhatsApp goes as chat.reply
 *   welcome.changed — Grow › Coupons › Signup popup changed: drop the cached popup offer
 */

const IMMEDIATELY = { expire: 0 } as const;

interface OrderEventData {
  order_no?: string;
  status?: string;
  payment_status?: string;
  payment_method?: string;
  change?: string;
  customer_name?: string;
  phone?: string;
  email?: string;
  total?: number;
  courier?: string;
  tracking_no?: string;
  tracking_url?: string;
  invoice_url?: string;
}

interface BikriupEvent {
  event?: string;
  created_at?: string;
  data?: { slugs?: string[] } & OrderEventData;
}

/**
 * Bikriup retries a delivery it did not see answered in time, so the buyer
 * could get the same message twice. Each delivery has an id, and the payload's
 * created_at is fixed across retries; together they key the dedupe row. When
 * the table cannot be reached the message is sent anyway — a rare duplicate
 * beats a missing confirmation.
 */
async function firstDelivery(request: Request, body: BikriupEvent): Promise<boolean> {
  const delivery = request.headers.get("x-bikriup-delivery");
  if (!delivery) return true;
  try {
    return await claimWebhookEvent(
      `bikriup:${delivery.slice(0, 40)}:${String(body.created_at ?? "").slice(0, 40)}`,
      body.event ?? "",
    );
  } catch (error) {
    console.warn(`[bikriup] webhook dedupe unavailable: ${describeError(error)}`);
    return true;
  }
}

/** What the buyer is told for each step; steps not listed send nothing. */
function orderMessage(
  o: OrderEventData,
): { subject: string; headline: string; message: string } | null {
  const no = o.order_no ?? "";
  const cod = o.payment_method === "cod";
  const amount = typeof o.total === "number" ? formatPaise(Math.round(o.total * 100)) : "";
  if (o.change === "payment") {
    // An online payment that has just arrived. Cash collected on delivery also
    // turns "paid", but that buyer has already had the delivered message.
    if (o.payment_status === "paid" && !cod) {
      return {
        subject: `Payment received for order ${no}`,
        headline: "Thank you — payment received",
        message: `We have received ${amount} for order ${no}. Our potters will start wrapping your pieces, and we will write again when they leave the studio.`,
      };
    }
    if (o.payment_status !== "refunded") return null;
    return {
      subject: `Refund sent for order ${no}`,
      headline: "Your refund is on its way",
      message: `We have refunded ${amount} for order ${no}. It can take 5–7 working days to show in your account.`,
    };
  }
  switch (o.status) {
    case "confirmed":
      return {
        subject: `Order ${no} confirmed — your invoice`,
        headline: "Your order is confirmed",
        message: `We are packing order ${no} by hand. Your invoice is attached as a link below.${cod ? ` Please keep ${amount} ready in cash for the delivery.` : ""}`,
      };
    case "shipped":
      return {
        subject: `Order ${no} is on its way`,
        headline: "Your pieces are on their way",
        message: `Order ${no} has left the studio${o.courier ? ` with ${o.courier}` : ""}${o.tracking_no ? ` (tracking no. ${o.tracking_no})` : ""}.`,
      };
    case "out_for_delivery":
      return {
        subject: `Order ${no} is out for delivery`,
        headline: "Arriving today",
        message: `Order ${no} is out for delivery.${cod ? ` Please keep ${amount} ready in cash.` : ""}`,
      };
    case "delivery_failed":
      return {
        subject: `We missed you — order ${no}`,
        headline: "The courier could not deliver",
        message: `The courier could not deliver order ${no}. Reply on WhatsApp if you would like it delivered again.`,
      };
    case "delivered":
      return {
        subject: `Order ${no} delivered`,
        headline: "Delivered — enjoy your clay",
        message: `Order ${no} has been delivered. If anything arrived broken, write to us within 7 days with a photo. If you are enjoying it, a short review helps other cooks find us.`,
      };
    case "cancelled":
      return {
        subject: `Order ${no} cancelled`,
        headline: "Your order is cancelled",
        message: `Order ${no} has been cancelled.${o.payment_status === "refund_due" ? ` Your refund of ${amount} is being processed.` : ""}`,
      };
    case "returned":
      return {
        subject: `Return complete — order ${no}`,
        headline: "We have your return",
        message: `The pieces from order ${no} are back with us.${o.payment_status === "refund_due" ? " Your refund is being processed." : ""}`,
      };
    default:
      return null;
  }
}

interface ChatReply {
  message_id?: number;
  channel?: "whatsapp" | "instagram" | "messenger";
  phone?: string;
  user_id?: string;
  text?: string;
  products?: Array<{ slug?: string; name: string; price: number }>;
  human_agent?: boolean;
  /** WhatsApp, shop writes first: an approved template ("hello") with its {{n}} values. */
  template?: string;
  params?: string[];
  /** template "payment_link": the Razorpay payment link id for the Pay now button. */
  button?: string;
  /** template "document" / "quotation": the PDF to attach (Orders › Documents, Leads › Quotations). */
  document?: { url?: string; filename?: string };
  /** template "shipped": the order whose tracking is sent (to the buyer or anyone else). */
  order?: {
    order_no?: string;
    phone?: string;
    customer_name?: string;
    courier?: string;
    tracking_no?: string;
    tracking_url?: string;
  };
}

// Meta refuses a parameter with a newline, a tab or more than four spaces in a row, or an empty one.
const param = (text: unknown, max = 200) =>
  String(text ?? "")
    .replace(/[\n\t]+/g, " ")
    .replace(/ {4,}/g, "   ")
    .trim()
    .slice(0, max) || "-";

/** The studio sent an order document or its tracking from Bikriup, to any number: a template. */
async function sendOrderTemplate(r: ChatReply): Promise<SendResult> {
  if (r.template === "document" || r.template === "quotation") {
    const url = r.document?.url ?? "";
    if (!/^https:\/\//.test(url)) return { ok: false, error: "The document link must be https" };
    const def = r.template === "quotation" ? TEMPLATES.quotation : TEMPLATES.document;
    return sendRaw(r.phone!, {
      type: "template",
      template: {
        name: def.name,
        language: { code: TEMPLATE_LANGUAGE },
        components: [
          {
            type: "header",
            parameters: [
              {
                type: "document",
                document: { link: url, filename: param(r.document?.filename, 120) },
              },
            ],
          },
          {
            type: "body",
            parameters: (r.params ?? [])
              .slice(0, 3)
              .map((text) => ({ type: "text", text: param(text, 60) })),
          },
        ],
      },
    });
  }
  // "shipped": the same message the buyer gets when the order ships; its button opens the order.
  const o = r.order ?? {};
  const message = orderStepMessage({ ...o, status: "shipped" });
  if (!message) return { ok: false, error: "Order details missing" };
  const def: TemplateDef = TEMPLATES[message.template];
  const components: unknown[] = [
    { type: "body", parameters: message.body.map((text) => ({ type: "text", text: param(text) })) },
  ];
  if (message.button && def.button?.type === "url") {
    components.push({
      type: "button",
      sub_type: "url",
      index: "0",
      parameters: [{ type: "text", text: message.button }],
    });
  }
  return sendRaw(r.phone!, {
    type: "template",
    template: { name: def.name, language: { code: TEMPLATE_LANGUAGE }, components },
  });
}

/** A reply typed in Bikriup › People › Chats: text, product cards, or both. */
async function sendChatReply(r: ChatReply | undefined) {
  if (!r) return;
  const text = (r.text ?? "").trim();
  const found = await Promise.all(
    (r.products ?? []).map((p) => (p.slug ? getProductBySlug(p.slug) : null)),
  );
  const products = found.filter((p): p is StoreProduct => Boolean(p));

  if ((r.channel === "instagram" || r.channel === "messenger") && r.user_id) {
    const opts = { humanAgent: r.human_agent };
    let sent: Awaited<ReturnType<typeof sendSocialRaw>> | null = null;
    if (text) sent = await sendSocialRaw(r.channel, r.user_id, { text: text.slice(0, 1000) }, opts);
    if (products.length && (!sent || sent.ok)) {
      sent = await sendSocialRaw(
        r.channel,
        r.user_id,
        productTemplate(r.channel, r.user_id, products).message,
        opts,
      );
    }
    if (!sent) sent = { ok: false, error: "Those products are not on the website" };
    await chatStatus(
      sent.ok
        ? { message_id: r.message_id, wa_id: sent.id, status: "sent" }
        : { message_id: r.message_id, status: "failed", error: sent.error },
    );
    return;
  }

  if (!r.phone) return;
  if (r.template === "document" || r.template === "quotation" || r.template === "shipped") {
    const sent = await sendOrderTemplate(r);
    await chatStatus(
      sent.ok
        ? { message_id: r.message_id, wa_id: sent.id, status: "sent" }
        : { message_id: r.message_id, status: "failed", error: sent.error },
    );
    return;
  }
  if (r.template === "payment_link") {
    const def = TEMPLATES.payment_link;
    const id = r.button ?? "";
    const sent = /^plink_[A-Za-z0-9]+$/.test(id)
      ? await sendRaw(r.phone, {
          type: "template",
          template: {
            name: def.name,
            language: { code: TEMPLATE_LANGUAGE },
            components: [
              {
                type: "body",
                parameters: (r.params ?? [])
                  .slice(0, 3)
                  .map((text) => ({ type: "text", text: param(text, 60) })),
              },
              {
                type: "button",
                sub_type: "url",
                index: "0",
                parameters: [{ type: "text", text: id }],
              },
            ],
          },
        })
      : ({ ok: false, error: "The payment link is missing" } as SendResult);
    await chatStatus(
      sent.ok
        ? { message_id: r.message_id, wa_id: sent.id, status: "sent" }
        : { message_id: r.message_id, status: "failed", error: sent.error },
    );
    return;
  }
  if (r.template === "hello") {
    const def = TEMPLATES.hello;
    const sent = await sendRaw(r.phone, {
      type: "template",
      template: {
        name: def.name,
        language: { code: TEMPLATE_LANGUAGE },
        components: [
          {
            type: "body",
            parameters: (r.params ?? [])
              .slice(0, 2)
              .map((text) => ({ type: "text", text: String(text).slice(0, 60) })),
          },
        ],
      },
    });
    await chatStatus(
      sent.ok
        ? { message_id: r.message_id, wa_id: sent.id, status: "sent" }
        : { message_id: r.message_id, status: "failed", error: sent.error },
    );
    return;
  }
  // WhatsApp: products go as links under the text (the catalogue cards need Meta's catalogue ids).
  const lines = products.map(
    (p) =>
      `• ${[p.name, p.sizeLabel].filter(Boolean).join(" ")}, ${formatPaise(p.pricePaise)}\n  ${SITE_URL}/shop/${p.slug}`,
  );
  const bodyText = [text, lines.join("\n")].filter(Boolean).join("\n\n");
  if (!bodyText) return;
  const sent = await sendRaw(r.phone, {
    type: "text",
    text: { body: bodyText, preview_url: /https?:\/\//.test(bodyText) },
  });
  await chatStatus(
    sent.ok
      ? { message_id: r.message_id, wa_id: sent.id, status: "sent" }
      : { message_id: r.message_id, status: "failed", error: sent.error },
  );
}

export async function POST(request: Request) {
  const raw = await request.text();
  if (!verifyBikriupSignature(raw, request.headers.get("x-bikriup-signature"))) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let body: BikriupEvent;
  try {
    body = JSON.parse(raw) as BikriupEvent;
  } catch {
    return NextResponse.json({ error: "malformed body" }, { status: 400 });
  }

  if (body.event === "catalog.changed") {
    revalidateTag(CACHE_TAGS.products, IMMEDIATELY);
    const slugs = body.data?.slugs ?? [];
    for (const slug of slugs) {
      revalidateTag(CACHE_TAGS.product(slug), IMMEDIATELY);
      revalidateTag(CACHE_TAGS.reviews(slug), IMMEDIATELY);
    }
    // Not awaited: the shop's save must not wait on Bing.
    void pingIndexNow([`${SITE_URL}/`, ...slugs.map((slug) => `${SITE_URL}/shop/${slug}`)]);
    // WhatsApp carts show Meta's copy of the price: send the new one now, after replying.
    after(() => pushCatalogPrices(slugs));
  }

  if (
    body.event === "order.updated" &&
    body.data?.order_no &&
    body.data.phone &&
    (await firstDelivery(request, body))
  ) {
    const o = body.data;
    const text = orderMessage(o);
    const whatsapp = orderStepMessage(o);
    await Promise.all([
      text && o.email
        ? sendOrderUpdateEmail(o.email, {
            ...text,
            customerName: (o.customer_name ?? "").split(" ")[0] || "there",
            orderNumber: o.order_no!,
            statusUrl: `${appBaseUrl()}/checkout/done/${orderToken(o.order_no!, o.phone!)}`,
            status: o.status,
            courier: o.courier,
            trackingNo: o.tracking_no,
            invoiceUrl: o.invoice_url ?? "",
            trackingUrl: o.tracking_url ?? "",
            clickHereUrl:
              o.status === "shipped"
                ? `${appBaseUrl()}/checkout/done/${orderToken(o.order_no!, o.phone!)}`
                : undefined,
          })
        : null,
      whatsapp ? sendWhatsApp(o.phone!, whatsapp) : null,
    ]);
  }

  if (body.event === "chat.reply") {
    await sendChatReply(body.data as ChatReply | undefined);
  }

  if (body.event === "welcome.changed") {
    revalidateTag(CACHE_TAGS.welcomeOffer, IMMEDIATELY);
  }

  if (body.event === "chat.config") {
    await syncProfiles();
  }

  if (body.event === "chat.import") {
    // A Page's history takes a while; Bikriup only waits 8 s for this answer.
    void importMessenger(Number((body.data as { days?: number } | undefined)?.days) || 30).catch(
      (error) => {
        console.error("[messenger] import failed:", error);
      },
    );
  }

  // Up to 50 sends: answered now, sent after (Bikriup would retry a slow answer and send twice).
  if (body.event === "broadcast.send") {
    void sendBroadcast(body.data as unknown as BroadcastEvent).catch((error) => {
      console.error("[broadcast] send failed:", error);
    });
  }

  // A cold email must go once: a resent delivery (slow answer) is ignored.
  if (body.event === "prospect.email" && (await firstDelivery(request, body))) {
    void sendProspectBrochure(body.data as unknown as ProspectEmailEvent).catch((error) => {
      console.error("[prospect] email failed:", error);
    });
  }

  if (body.event === "quote.email") {
    void sendQuotationEmail(body.data as unknown as QuoteEmailEvent).catch((error) => {
      console.error("[quote] email failed:", error);
    });
  }

  // Razorpay calls take a moment: answered now, done after (Bikriup waits 8 s, then resends).
  const payLinkJobs: Record<string, (data: unknown) => Promise<void>> = {
    "paylink.create": (d) => createBikriupPayLink(d as PayLinkCreateEvent),
    "paylink.cancel": (d) => cancelBikriupPayLink(d as { link_id?: number; ext_id?: string }),
    "paylink.check": (d) => checkBikriupPayLink(d as { link_id?: number; ext_id?: string }),
    "paylink.email": (d) => emailBikriupPayLink(d as PayLinkEmailEvent),
  };
  const payLinkJob = body.event ? payLinkJobs[body.event] : undefined;
  // A resent create or email must not make a second link or a second mail.
  if (
    payLinkJob &&
    (body.event === "paylink.cancel" ||
      body.event === "paylink.check" ||
      (await firstDelivery(request, body)))
  ) {
    void payLinkJob(body.data).catch((error) => {
      console.error(`[paylink] ${body.event} failed:`, error);
    });
  }

  if (body.event === "reminder.send") {
    void sendPaymentReminder(body.data as unknown as ReminderEvent).catch((error) => {
      console.error("[remind] send failed:", error);
    });
  }

  return NextResponse.json({ received: true });
}
