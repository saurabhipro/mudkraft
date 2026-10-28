import { formatPaiseExact } from "@/lib/money";

import { serverEnv } from "../env";

/**
 * HTML templates for transactional mail. Table-based layout with inline styles
 * only — email clients ignore stylesheets. Every user-supplied string passes
 * through `escapeHtml` before interpolation.
 */

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function appBaseUrl(): string {
  return serverEnv.BETTER_AUTH_URL.replace(/\/+$/, "");
}

const BRAND = "#8a5a3b"; // terracotta, matches the studio's earthy palette
const TEXT = "#3d3229";
const MUTED = "#8b7d70";
const RULE = "#e8e0d8";

function layout(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#f6f1ec;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f1ec;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;font-family:Georgia,'Times New Roman',serif;color:${TEXT};">
        <tr><td style="background:${BRAND};padding:18px 32px;">
          <!-- The site's logo is CSS-drawn (no image asset exists), so the email
               recreates the clay-seal mark inline: a round disc with the M,
               beside the wordmark. Outlook squares the disc; acceptable. -->
          <a href="${appBaseUrl()}" style="text-decoration:none;">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr>
              <td style="width:40px;height:40px;background:#b0714a;border-radius:50%;text-align:center;vertical-align:middle;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:bold;color:#f6f1ec;">M</td>
              <td style="padding-left:12px;vertical-align:middle;">
                <span style="display:block;color:#ffffff;font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:1;">Mud<i>kraft</i></span>
                <span style="display:block;margin-top:4px;color:#f6f1ec;opacity:0.75;font-size:9px;letter-spacing:3px;text-transform:uppercase;">Slow Craft Studio</span>
              </td>
            </tr></table>
          </a>
        </td></tr>
        <tr><td style="padding:32px;">
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid ${RULE};font-size:12px;color:${MUTED};">
          Handcrafted pottery from Mudkraft Studio ·
          <a href="${appBaseUrl()}/shop" style="color:${BRAND};">mudkraft.com</a><br>
          You are receiving this because you have an account or an order with us.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:15px;">${escapeHtml(label)}</a>`;
}

export interface RenderedEmail {
  subject: string;
  html: string;
}

// --- Welcome ---------------------------------------------------------------

export function welcomeEmail(name: string): RenderedEmail {
  const first = escapeHtml(name.trim().split(/\s+/)[0] || "there");
  return {
    subject: "Welcome to Mudkraft 🌿",
    html: layout(
      "Welcome to Mudkraft",
      `<h1 style="margin:0 0 16px;font-size:24px;font-weight:normal;">Welcome, ${first}.</h1>
       <p style="margin:0 0 16px;line-height:1.6;">Thank you for joining Mudkraft. Every piece in our studio is
       thrown, glazed and fired by hand — no two are ever quite the same.</p>
       <p style="margin:0 0 24px;line-height:1.6;">Have a look at what is on the shelves right now:</p>
       ${button(`${appBaseUrl()}/shop`, "Browse the collection")}`,
    ),
  };
}

// --- Order confirmation ----------------------------------------------------

export interface OrderEmailItem {
  name: string;
  qty: number;
  unitPricePaise: number;
  lineTotalPaise: number;
  imageUrl: string | null;
}

export interface OrderEmailData {
  customerName: string;
  orderNumber: string;
  method: "gateway" | "whatsapp" | "cod";
  items: OrderEmailItem[];
  subtotalPaise: number;
  shippingPaise: number;
  totalPaise: number;
  address: {
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    postalCode: string;
  };
  statusUrl: string;
}

export function orderConfirmationEmail(data: OrderEmailData): RenderedEmail {
  const rows = data.items
    .map(
      (item) => `<tr>
        <td style="padding:12px 0;border-bottom:1px solid ${RULE};">
          ${
            item.imageUrl
              ? `<img src="${item.imageUrl}" width="56" height="56" alt="" style="border-radius:6px;vertical-align:middle;margin-right:12px;">`
              : ""
          }
          <span style="font-size:14px;">${escapeHtml(item.name)}</span>
        </td>
        <td align="center" style="padding:12px 8px;border-bottom:1px solid ${RULE};font-size:14px;white-space:nowrap;">× ${item.qty}</td>
        <td align="right" style="padding:12px 0;border-bottom:1px solid ${RULE};font-size:14px;white-space:nowrap;">${formatPaiseExact(item.lineTotalPaise)}</td>
      </tr>`,
    )
    .join("");

  const totals = `
    <tr><td></td><td align="right" style="padding:12px 8px 4px;font-size:14px;color:${MUTED};">Subtotal</td>
      <td align="right" style="padding:12px 0 4px;font-size:14px;">${formatPaiseExact(data.subtotalPaise)}</td></tr>
    <tr><td></td><td align="right" style="padding:4px 8px;font-size:14px;color:${MUTED};">Shipping</td>
      <td align="right" style="padding:4px 0;font-size:14px;">${data.shippingPaise === 0 ? "Free" : formatPaiseExact(data.shippingPaise)}</td></tr>
    <tr><td></td><td align="right" style="padding:8px 8px 0;font-size:16px;"><strong>Total</strong></td>
      <td align="right" style="padding:8px 0 0;font-size:16px;"><strong>${formatPaiseExact(data.totalPaise)}</strong></td></tr>`;

  const nextStep =
    data.method === "whatsapp"
      ? "We will confirm your order over WhatsApp shortly."
      : data.method === "cod"
        ? `Please keep ${formatPaiseExact(data.totalPaise)} ready in cash — payment is collected on delivery.`
        : "We will start packing as soon as your payment is confirmed.";

  const a = data.address;
  const addressHtml = [a.line1, a.line2, `${a.city}, ${a.state} ${a.postalCode}`]
    .filter(Boolean)
    .map((line) => escapeHtml(line as string))
    .join("<br>");

  return {
    subject: `Your Mudkraft order ${data.orderNumber}`,
    html: layout(
      `Order ${data.orderNumber}`,
      `<h1 style="margin:0 0 8px;font-size:24px;font-weight:normal;">Thank you, ${escapeHtml(data.customerName)}.</h1>
       <p style="margin:0 0 4px;line-height:1.6;">Your order <strong>${escapeHtml(data.orderNumber)}</strong> has been placed.</p>
       <p style="margin:0 0 24px;line-height:1.6;color:${MUTED};">${nextStep}</p>
       <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
         ${rows}
         ${totals}
       </table>
       <h2 style="margin:28px 0 8px;font-size:16px;">Delivery address</h2>
       <p style="margin:0 0 24px;line-height:1.6;">${addressHtml}</p>
       ${button(data.statusUrl, "View your order")}`,
    ),
  };
}

// --- Order update (from Bikriup: confirmed, shipped, delivered, refunded…) ---

export interface OrderUpdateEmailData {
  customerName: string;
  orderNumber: string;
  subject: string;
  headline: string;
  message: string;
  statusUrl: string;
  invoiceUrl: string;
  trackingUrl: string;
}

export function orderUpdateEmail(data: OrderUpdateEmailData): RenderedEmail {
  const links = [
    data.trackingUrl ? button(data.trackingUrl, "Track the parcel") : "",
    data.invoiceUrl
      ? `<a href="${data.invoiceUrl}" style="display:inline-block;margin-left:8px;color:${BRAND};font-size:15px;">Download invoice (PDF)</a>`
      : "",
  ].join("");
  return {
    subject: data.subject,
    html: layout(
      data.subject,
      `<h1 style="margin:0 0 8px;font-size:24px;font-weight:normal;">${escapeHtml(data.headline)}</h1>
       <p style="margin:0 0 4px;line-height:1.6;">Hello ${escapeHtml(data.customerName)},</p>
       <p style="margin:0 0 24px;line-height:1.6;">${escapeHtml(data.message)}</p>
       ${links ? `<p style="margin:0 0 24px;">${links}</p>` : ""}
       ${button(data.statusUrl, `View order ${data.orderNumber}`)}`,
    ),
  };
}

// --- New product announcement ----------------------------------------------

export interface NewProductEmailData {
  name: string;
  sizeLabel: string;
  tag: string;
  description: string;
  pricePaise: number;
  url: string;
  imageUrl: string | null;
}

export function newProductEmail(data: NewProductEmailData): RenderedEmail {
  const title = [data.name, data.sizeLabel].filter(Boolean).join(" ");
  const blurb = data.description.length > 240 ? `${data.description.slice(0, 240)}…` : data.description;

  return {
    subject: `New from the kiln: ${title}`,
    html: layout(
      `New from the kiln: ${title}`,
      `<p style="margin:0 0 16px;font-size:13px;letter-spacing:2px;color:${MUTED};text-transform:uppercase;">Fresh from the kiln</p>
       <h1 style="margin:0 0 16px;font-size:24px;font-weight:normal;">${escapeHtml(title)}</h1>
       ${
         data.imageUrl
           ? `<a href="${data.url}"><img src="${data.imageUrl}" width="536" alt="${escapeHtml(title)}" style="width:100%;max-width:536px;border-radius:8px;margin:0 0 16px;"></a>`
           : ""
       }
       ${data.tag ? `<p style="margin:0 0 8px;font-size:14px;color:${BRAND};">${escapeHtml(data.tag)}</p>` : ""}
       ${blurb ? `<p style="margin:0 0 16px;line-height:1.6;">${escapeHtml(blurb)}</p>` : ""}
       <p style="margin:0 0 24px;font-size:20px;">${formatPaiseExact(data.pricePaise)}</p>
       ${button(data.url, "See it in the shop")}`,
    ),
  };
}
