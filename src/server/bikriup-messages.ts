import { SITE_URL } from "@/lib/seo";
import { bikriup, bikriupEnabled } from "@/server/bikriup";
import { sendEmail } from "@/server/email/client";
import { broadcastEmail, paymentReminderEmail } from "@/server/email/templates";
import { sendRaw, type SendResult } from "@/server/whatsapp";
import { TEMPLATE_LANGUAGE, TEMPLATES, type TemplateDef } from "@/server/whatsapp/templates";

/**
 * Messages Bikriup asks the site to send for it (Bikriup holds no WhatsApp token and no SMTP):
 *
 *   broadcast.send — Grow › Broadcasts: up to 50 people a minute, each on WhatsApp
 *                    (mk_new_stock / mk_offer) or email. Every person is reported back.
 *   reminder.send  — People › Udhaar: one payment reminder (mk_payment_reminder + email) with
 *                    the customer's pay link.
 *
 * Both run after the webhook has answered (Bikriup waits 8 s and would send the batch again).
 * WhatsApp's later delivered / read receipts reach Bikriup through the chat status forwarding
 * (whatsapp/index.ts chatStatus), which Bikriup matches by message id.
 */

interface BroadcastProduct {
  slug?: string;
  name: string;
  price: number;
  image?: string;
}

export interface BroadcastEvent {
  test?: boolean;
  broadcast: {
    id: number;
    kind: "new_stock" | "offer" | "note";
    line: string;
    subject: string;
    note: string;
    shop: string;
    products: BroadcastProduct[];
  };
  recipients: Array<{
    send_id: number;
    channel: "whatsapp" | "email";
    first_name: string;
    phone: string;
    email: string;
    unsubscribe_url: string;
  }>;
}

export interface ReminderEvent {
  reminder_id: number;
  first_name: string;
  phone: string;
  email: string;
  amount_text: string;
  shop: string;
  pay_path: string;
}

interface Result {
  send_id: number;
  status: "sent" | "failed";
  ext_id?: string;
  error?: string;
}

// Meta refuses a parameter with a newline, a tab, more than four spaces in a row, or nothing in it.
const param = (text: string, max = 200) =>
  (text ?? "")
    .replace(/[\n\t]+/g, " ")
    .replace(/ {4,}/g, "   ")
    .trim()
    .slice(0, max) || "-";

function templateMessage(
  def: TemplateDef,
  body: string[],
  button?: string,
): Record<string, unknown> {
  const components: unknown[] = [
    { type: "body", parameters: body.map((text) => ({ type: "text", text: param(text) })) },
  ];
  if (button && def.button?.type === "url") {
    components.push({
      type: "button",
      sub_type: "url",
      index: "0",
      parameters: [{ type: "text", text: button }],
    });
  }
  return {
    type: "template",
    template: { name: def.name, language: { code: TEMPLATE_LANGUAGE }, components },
  };
}

/** A few at a time: quick enough for 50 a minute, gentle on Meta and the mail server. */
async function eachLimited<T>(items: T[], limit: number, fn: (item: T) => Promise<void>) {
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const item = items[next];
      next += 1;
      await fn(item);
    }
  });
  await Promise.all(workers);
}

const fromSend = (send_id: number, sent: SendResult): Result =>
  sent.ok
    ? { send_id, status: "sent", ext_id: sent.id }
    : { send_id, status: "failed", error: sent.error };

export async function sendBroadcast(ev: BroadcastEvent | undefined) {
  if (!ev?.broadcast || !Array.isArray(ev.recipients)) return;
  const b = ev.broadcast;
  const shop = b.shop || "Mudkraft";
  const products = (b.products ?? []).filter((p) => p.name);
  // The button: one product opens its page, several open the shop.
  const path = products.length === 1 && products[0].slug ? `shop/${products[0].slug}` : "shop";
  const items = products.map((p) => ({
    name: p.name,
    pricePaise: Math.round((Number(p.price) || 0) * 100),
    url: p.slug ? `${SITE_URL}/shop/${p.slug}` : `${SITE_URL}/shop`,
    imageUrl: p.image || null,
  }));
  const def =
    b.kind === "new_stock" ? TEMPLATES.new_stock : b.kind === "offer" ? TEMPLATES.offer : null;

  const results: Result[] = [];
  await eachLimited(ev.recipients, 4, async (r) => {
    if (r.channel === "whatsapp") {
      if (!def) {
        results.push({
          send_id: r.send_id,
          status: "failed",
          error: "A note has no WhatsApp template",
        });
        return;
      }
      const sent = await sendRaw(r.phone, templateMessage(def, [r.first_name, shop, b.line], path));
      results.push(fromSend(r.send_id, sent));
      return;
    }
    if (r.channel === "email" && r.email) {
      const mail = broadcastEmail({
        subject: b.subject || `News from ${shop}`,
        kind: b.kind,
        line: b.line,
        note: b.note,
        firstName: r.first_name || "there",
        items,
        unsubscribeUrl: r.unsubscribe_url || `${SITE_URL}/trust`,
      });
      const ok = await sendEmail({ to: r.email, subject: mail.subject, html: mail.html });
      results.push(
        ok
          ? { send_id: r.send_id, status: "sent" }
          : { send_id: r.send_id, status: "failed", error: "The mail server did not take it" },
      );
    }
  });

  // A test ("Send a test to me") has nothing in Bikriup to update.
  if (ev.test || !bikriupEnabled()) return;
  const report = results.filter((r) => r.send_id > 0);
  if (!report.length) return;
  try {
    await bikriup("/broadcasts/status", { method: "POST", body: { results: report } });
  } catch (error) {
    console.error("[broadcast] status report failed:", error);
  }
}

export async function sendPaymentReminder(r: ReminderEvent | undefined) {
  if (!r?.reminder_id) return;
  const payUrl = `${SITE_URL}/pay/${r.pay_path}`;
  let whatsapp: SendResult | null = null;
  if (r.phone) {
    whatsapp = await sendRaw(
      r.phone,
      templateMessage(
        TEMPLATES.payment_reminder,
        [r.first_name, r.shop || "Mudkraft", r.amount_text],
        r.pay_path,
      ),
    );
  }
  let mailed = false;
  if (r.email) {
    const mail = paymentReminderEmail({
      firstName: r.first_name || "there",
      amountText: r.amount_text,
      payUrl,
    });
    mailed = await sendEmail({ to: r.email, subject: mail.subject, html: mail.html });
  }
  if (!bikriupEnabled()) return;
  // WhatsApp decides the status when there is a number; email only when there isn't.
  const body = whatsapp
    ? whatsapp.ok
      ? { reminder_id: r.reminder_id, status: "sent", ext_id: whatsapp.id }
      : mailed
        ? { reminder_id: r.reminder_id, status: "sent", error: "" }
        : { reminder_id: r.reminder_id, status: "failed", error: whatsapp.error }
    : {
        reminder_id: r.reminder_id,
        status: mailed ? "sent" : "failed",
        error: mailed ? "" : "The mail server did not take it",
      };
  try {
    await bikriup("/reminders/status", { method: "POST", body });
  } catch (error) {
    console.error("[remind] status report failed:", error);
  }
}
