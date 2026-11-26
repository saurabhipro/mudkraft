import { SITE_URL } from "@/lib/seo";
import { bikriup, BikriupError, bikriupEnabled, orderToken } from "@/server/bikriup";
import { sendEmail } from "@/server/email/client";
import { paymentLinkEmail } from "@/server/email/templates";
import {
  cancelPaymentLink,
  fetchGatewayPayment,
  fetchPaymentLink,
  createPaymentLink,
  isFullyRefundedError,
  isRazorpayError,
  razorpayConfigured,
  refundPayment,
  type GatewayPaymentLink,
} from "@/server/razorpay";

/**
 * Bikriup › Orders › Payment link. Bikriup holds no Razorpay keys, so it asks the site:
 *
 *   paylink.create — make the link; report its URL (or why not) on /paylinks/status
 *   paylink.cancel — cancel it at Razorpay (a newer link replaced it, or staff cancelled it)
 *   paylink.check  — read it again and report paid / expired / cancelled
 *   paylink.email  — mail it to the buyer; report on /paylinks/status (email_status)
 *
 * The WhatsApp copy comes as a chat.reply with template "payment_link". Razorpay's
 * `payment_link.paid` webhook (api/razorpay/webhook) calls `settlePaymentLink`, which tells
 * Bikriup on /paylinks/paid and refunds the payment when the order was already paid.
 *
 * Every link's reference is `PL<link id>-<order no>`: never an order number, so the checkout
 * settlement path (which reads a gateway order's receipt as the order number) leaves it alone.
 */

export interface PayLinkCreateEvent {
  link_id: number;
  order_no: string;
  reference_id: string;
  amount_paise: number;
  description: string;
  customer: { name?: string; phone?: string; email?: string };
  expire_by: number;
}

export interface PayLinkEmailEvent {
  link_id: number;
  to: string;
  first_name: string;
  order_no: string;
  amount_text: string;
  part: boolean;
  order_total_text: string;
  url: string;
  ext_id: string;
  expires_on: string;
}

/** The order a link's reference belongs to: "PL12-MK260012" → "MK260012". */
export function payLinkOrderNo(reference: string | null | undefined): string | null {
  const m = /^PL(\d+)-(.+)$/.exec(reference ?? "");
  return m ? m[2] : null;
}
const payLinkId = (reference: string | null | undefined) =>
  Number(/^PL(\d+)-/.exec(reference ?? "")?.[1] ?? 0);

/** A link Razorpay serves only when it is https and on Razorpay's own short domain. */
const isRazorpayUrl = (url: string) =>
  /^https:\/\/(rzp\.io|[a-z0-9-]+\.razorpay\.com)\//i.test(url);

async function report(path: "status" | "paid", body: Record<string, unknown>) {
  if (!bikriupEnabled()) return null;
  return bikriup<Record<string, unknown>>(`/paylinks/${path}`, { method: "POST", body });
}

function linkState(link: GatewayPaymentLink): "active" | "expired" | "cancelled" | null {
  if (link.status === "created" || link.status === "partially_paid") return "active";
  if (link.status === "expired") return "expired";
  if (link.status === "cancelled") return "cancelled";
  return null;
}

export async function createBikriupPayLink(ev: PayLinkCreateEvent | undefined) {
  if (!ev?.link_id) return;
  if (!razorpayConfigured()) {
    await report("status", {
      link_id: ev.link_id,
      status: "failed",
      error: "Razorpay is not set up on the website",
    });
    return;
  }
  const phone = (ev.customer?.phone ?? "").replace(/\D/g, "").slice(-10);
  const orderPage =
    phone.length === 10 ? `${SITE_URL}/checkout/done/${orderToken(ev.order_no, phone)}` : SITE_URL;
  try {
    const link = await createPaymentLink({
      amountPaise: Math.round(Number(ev.amount_paise)),
      referenceId: ev.reference_id,
      description: ev.description,
      customer: {
        name: ev.customer?.name,
        contact: phone.length === 10 ? `+91${phone}` : undefined,
        email: ev.customer?.email,
      },
      expireBy: Number(ev.expire_by),
      callbackUrl: orderPage,
      notes: { order_no: ev.order_no, bikriup_link: String(ev.link_id), order_page: orderPage },
    });
    await report("status", {
      link_id: ev.link_id,
      status: "active",
      url: link.short_url,
      ext_id: link.id,
    });
  } catch (error) {
    const reason = isRazorpayError(error)
      ? error.error.description || error.error.code
      : "Could not reach Razorpay";
    console.error(`[paylink] create ${ev.reference_id} failed: ${reason}`);
    await report("status", { link_id: ev.link_id, status: "failed", error: reason.slice(0, 200) });
  }
}

export async function cancelBikriupPayLink(ev: { link_id?: number; ext_id?: string } | undefined) {
  if (!ev?.ext_id || !/^plink_[A-Za-z0-9]+$/.test(ev.ext_id) || !razorpayConfigured()) return;
  const link = await cancelPaymentLink(ev.ext_id);
  // Paid just before the cancel landed: that payment still counts.
  if (link.status === "paid") await settlePaymentLink(link);
}

/** Read the link again (staff pressed Check): paid while a webhook was missed, or expired. */
export async function checkBikriupPayLink(ev: { link_id?: number; ext_id?: string } | undefined) {
  if (!ev?.ext_id || !/^plink_[A-Za-z0-9]+$/.test(ev.ext_id) || !razorpayConfigured()) return;
  const link = await fetchPaymentLink(ev.ext_id);
  if (link.status === "paid") {
    await settlePaymentLink(link);
    return;
  }
  const state = linkState(link);
  if (state && state !== "active")
    await report("status", { link_id: ev.link_id ?? payLinkId(link.reference_id), status: state });
}

export async function emailBikriupPayLink(ev: PayLinkEmailEvent | undefined) {
  if (!ev?.link_id || !ev.to) return;
  let sent = false;
  let error = "The mail server did not take it";
  if (isRazorpayUrl(ev.url ?? "")) {
    const mail = paymentLinkEmail({
      firstName: ev.first_name || "there",
      orderNo: ev.order_no,
      amountText: ev.amount_text,
      part: Boolean(ev.part),
      orderTotalText: ev.order_total_text,
      payUrl: /^plink_[A-Za-z0-9]+$/.test(ev.ext_id ?? "")
        ? `${SITE_URL}/paylink/${ev.ext_id}`
        : ev.url,
      expiresOn: (ev.expires_on ?? "").split("-").reverse().join("-"),
    });
    sent = await sendEmail({ to: ev.to, subject: mail.subject, html: mail.html });
  } else {
    error = "The payment link is not a Razorpay link";
  }
  await report("status", {
    link_id: ev.link_id,
    email_status: sent ? "sent" : "failed",
    error: sent ? "" : error,
  });
}

/**
 * The buyer paid a link. Bikriup records it on the order; if the order was paid some other way
 * in the meantime it answers already_paid and this payment is given back in full.
 */
export async function settlePaymentLink(link: GatewayPaymentLink, paymentId?: string) {
  const orderNo = payLinkOrderNo(link.reference_id);
  if (!orderNo) return; // not one of Bikriup's links (another integration on the same account)
  let pid = paymentId ?? "";
  if (!pid) {
    // A link fetched without its payment: the paid payment is in Razorpay's list for the link.
    const full = (await fetchPaymentLink(link.id)) as GatewayPaymentLink & {
      payments?: Array<{ payment_id?: string; status?: string }> | null;
    };
    pid = full.payments?.find((p) => p.status === "captured")?.payment_id ?? "";
    if (!pid) return;
  }
  const payment = await fetchGatewayPayment(pid);
  if (payment.status !== "captured") return;
  try {
    await report("paid", {
      link_id: payLinkId(link.reference_id),
      ext_id: link.id,
      order_no: orderNo,
      payment_id: payment.id,
      amount: payment.amount / 100,
    });
  } catch (error) {
    if (!(error instanceof BikriupError) || error.status >= 500) throw error;
    if (error.code !== "already_paid") {
      console.error(
        `[paylink] ${link.id} paid (${payment.id}) but Bikriup refused: ${error.message}`,
      );
      return;
    }
    const left = payment.amount - (payment.amount_refunded ?? 0);
    if (left <= 0) return;
    try {
      const refund = await refundPayment(payment.id, {
        amountPaise: left,
        notes: { reason: "duplicate", order_no: orderNo, payment_link: link.id },
      });
      console.warn(
        `[razorpay] audit: link ${link.id} paid ${payment.id} on ${orderNo}, already paid; refunded ${left} paise as ${refund.id}`,
      );
    } catch (refundError) {
      if (!isFullyRefundedError(refundError)) throw refundError;
    }
  }
}

/** /paylink/<id>: the WhatsApp and email button. Open → Razorpay's page; otherwise the order page. */
export async function payLinkTarget(id: string): Promise<string> {
  if (!/^plink_[A-Za-z0-9]+$/.test(id) || !razorpayConfigured()) return SITE_URL;
  try {
    const link = await fetchPaymentLink(id);
    if (!payLinkOrderNo(link.reference_id)) return SITE_URL;
    if (linkState(link) === "active" && isRazorpayUrl(link.short_url)) return link.short_url;
    const page = link.notes.order_page ?? "";
    return page.startsWith(SITE_URL) ? page : SITE_URL;
  } catch {
    return SITE_URL;
  }
}

/** Razorpay closed a link (expired, or cancelled from the dashboard): Bikriup shows it. */
export async function payLinkClosed(link: GatewayPaymentLink, state: "expired" | "cancelled") {
  const id = payLinkId(link.reference_id);
  if (id) await report("status", { link_id: id, status: state });
}

/** Razorpay's webhook entity, in the shape the rest of this module reads. */
export function linkFromWebhook(entity: Record<string, unknown>): GatewayPaymentLink {
  return {
    id: String(entity.id ?? ""),
    short_url: String(entity.short_url ?? ""),
    status: String(entity.status ?? ""),
    amount: Number(entity.amount ?? 0),
    amount_paid: Number(entity.amount_paid ?? 0),
    reference_id: typeof entity.reference_id === "string" ? entity.reference_id : null,
    notes:
      entity.notes && typeof entity.notes === "object" && !Array.isArray(entity.notes)
        ? (entity.notes as Record<string, string>)
        : {},
  };
}
