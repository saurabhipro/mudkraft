import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { formatPaise } from "@/lib/money";
import { SITE_URL } from "@/lib/seo";
import { orderToken, verifyBikriupSignature } from "@/server/bikriup";
import { sendOrderUpdateEmail } from "@/server/email/send";
import { pingIndexNow } from "@/server/indexnow";
import { appBaseUrl } from "@/server/email/templates";
import { CACHE_TAGS } from "@/server/store/tags";
import { chatStatus, sendRaw, sendWhatsApp } from "@/server/whatsapp";
import { orderStepMessage } from "@/server/whatsapp/orders";

/**
 * Bikriup tells the site when something changed, so cached pages refresh at
 * once instead of waiting out the cache TTL. Register this URL, and copy its
 * signing secret into BIKRIUP_WEBHOOK_SECRET, in Bikriup › Shop › Website & API.
 *
 *   catalog.changed — price, stock, photo, new item or an approved review
 *   order.updated   — the studio moved an order on: the buyer gets an email and
 *                     a WhatsApp message (confirmed with the invoice, shipped
 *                     with tracking, …; server/whatsapp/orders.ts lists them)
 *   chat.reply      — the studio answered a WhatsApp chat in Bikriup › WhatsApp:
 *                     send it from the studio's number and report back
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
  data?: { slugs?: string[] } & OrderEventData;
}

/** What the buyer is told for each step; steps not listed send nothing. */
function orderMessage(
  o: OrderEventData,
): { subject: string; headline: string; message: string } | null {
  const no = o.order_no ?? "";
  const cod = o.payment_method === "cod";
  const amount = typeof o.total === "number" ? formatPaise(Math.round(o.total * 100)) : "";
  if (o.change === "payment") {
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
  }

  if (body.event === "order.updated" && body.data?.order_no && body.data.phone) {
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
            clickHereUrl: o.status === "shipped" ? `${appBaseUrl()}/checkout/done/${orderToken(o.order_no!, o.phone!)}` : undefined,
          })
        : null,
      whatsapp ? sendWhatsApp(o.phone!, whatsapp) : null,
    ]);
  }

  if (body.event === "chat.reply") {
    const r = body.data as { message_id?: number; phone?: string; text?: string } | undefined;
    if (r?.phone && r.text) {
      const sent = await sendRaw(r.phone, { type: "text", text: { body: r.text, preview_url: /https?:\/\//.test(r.text) } });
      await chatStatus(
        sent.ok
          ? { message_id: r.message_id, wa_id: sent.id, status: "sent" }
          : { message_id: r.message_id, status: "failed", error: sent.error },
      );
    }
  }

  return NextResponse.json({ received: true });
}
