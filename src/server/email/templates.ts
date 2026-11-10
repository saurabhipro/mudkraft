import { formatPaiseExact } from "@/lib/money";

import { serverEnv } from "../env";

/**
 * HTML templates for transactional mail. Table-based layout with inline styles
 * only — email clients ignore stylesheets. Every user-supplied string passes
 * through `escapeHtml` before interpolation.
 *
 * Look: dark-earth header with the studio seal, cream page, Georgia serif,
 * clay buttons. Designed on the "Mudkraft emails" canvas.
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

/** Files in /public that the emails link to. */
export const EMAIL_ASSETS = {
  logo: "/mudkraft-logo.png",
  welcomeBanner: "/email/welcome-banner.jpg",
} as const;

const EARTH = "#3a2a22";
const CLAY = "#A5522F";
const GOLD = "#D9B15F";
const PAGE = "#EFE6D8";
const CARD = "#FFFDF9";
const SAND = "#F6EFE4";
const TEXT = "#3a2a22";
const BODY = "#5a4a40";
const MUTED = "#6b5a50";
const RULE = "#E8DDCF";

const SERIF = "Georgia,'Times New Roman',serif";
const SANS = "Arial,Helvetica,sans-serif";

function assetUrl(path: string): string {
  return `${appBaseUrl()}${path}`;
}

// --- Building blocks -----------------------------------------------------------

function layout(title: string, bodyHtml: string, reason: string): string {
  const base = appBaseUrl();
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:${PAGE};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAGE};padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${CARD};border-radius:10px;overflow:hidden;font-family:${SERIF};color:${TEXT};">
        <tr><td style="background:${EARTH};padding:22px 32px;">
          <a href="${base}" style="text-decoration:none;">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr>
              <td style="vertical-align:middle;"><img src="${assetUrl(EMAIL_ASSETS.logo)}" width="44" height="44" alt="" style="display:block;width:44px;height:44px;border-radius:50%;"></td>
              <td style="padding-left:14px;vertical-align:middle;">
                <span style="display:block;color:#F4EDE3;font-family:${SERIF};font-size:26px;line-height:1;">Mud<i>kraft</i></span>
                <span style="display:block;margin-top:5px;color:${GOLD};font-family:${SANS};font-size:10px;letter-spacing:3px;text-transform:uppercase;">Slow craft studio</span>
              </td>
            </tr></table>
          </a>
        </td></tr>
        ${bodyHtml}
        <tr><td style="padding:22px 32px 28px;border-top:1px solid ${RULE};font-family:${SANS};font-size:12px;line-height:1.7;color:${MUTED};">
          <a href="${base}/shop" style="color:${CLAY};text-decoration:none;">Shop</a> &middot;
          <a href="${base}/care" style="color:${CLAY};text-decoration:none;">Care</a> &middot;
          <a href="${base}/shipping-returns" style="color:${CLAY};text-decoration:none;">Shipping &amp; returns</a> &middot;
          <a href="${base}" style="color:${CLAY};text-decoration:none;">mudkraft.com</a><br>
          Questions? Write to sales@mudkraft.com or reply to this email.<br>
          Mudkraft Studio &middot; Khurja, Uttar Pradesh. ${escapeHtml(reason)}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/** A padded table row inside the card. */
function section(inner: string, padding = "28px 32px 0"): string {
  return `<tr><td style="padding:${padding};">${inner}</td></tr>`;
}

function intro(eyebrow: string, headline: string, paragraph: string): string {
  return section(
    `<div style="font-family:${SANS};font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${CLAY};">${escapeHtml(eyebrow)}</div>
     <h1 style="margin:14px 0 0;font-size:34px;line-height:1.1;font-weight:normal;color:${TEXT};">${headline}</h1>
     <p style="margin:14px 0 0;font-size:16px;line-height:1.65;color:${BODY};">${paragraph}</p>`,
    "40px 32px 0",
  );
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:${CLAY};color:#ffffff;text-decoration:none;padding:15px 34px;border-radius:6px;font-family:${SANS};font-size:15px;font-weight:bold;">${escapeHtml(label)}</a>`;
}

function outlineButton(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;border:1px solid ${EARTH};color:${EARTH};text-decoration:none;padding:10px 18px;border-radius:6px;font-family:${SANS};font-size:13px;font-weight:bold;">${escapeHtml(label)}</a>`;
}

function ctaRow(inner: string): string {
  return section(inner, "32px 32px 0").replace("<td ", `<td align="center" `);
}

function label(text: string): string {
  return `<div style="font-family:${SANS};font-size:10px;letter-spacing:2px;text-transform:uppercase;color:${MUTED};">${escapeHtml(text)}</div>`;
}

/** Equal-width cells in one bordered strip. */
function metaStrip(cells: Array<{ label: string; value: string }>): string {
  const w = Math.floor(100 / cells.length);
  const tds = cells
    .map(
      (
        c,
        i,
      ) => `<td width="${w}%" style="padding:14px 18px;${i ? `border-left:1px solid ${RULE};` : ""}">
        ${label(c.label)}
        <div style="margin-top:8px;font-size:17px;color:${TEXT};">${escapeHtml(c.value)}</div>
      </td>`,
    )
    .join("");
  return section(
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${RULE};border-radius:8px;"><tr>${tds}</tr></table>`,
    "24px 32px 0",
  );
}

const STAGES = ["Placed", "Packed", "Shipped", "Delivered"] as const;

/** Four-segment progress bar; `stage` is the index of the current step. */
function tracker(stage: number): string {
  const bars = STAGES.map(
    (_, i) =>
      `<td width="25%" style="padding:0 3px;"><div style="height:4px;border-radius:2px;background:${i <= stage ? CLAY : RULE};font-size:0;line-height:0;">&nbsp;</div></td>`,
  ).join("");
  const labels = STAGES.map(
    (s, i) =>
      `<td width="25%" align="center" style="padding-top:10px;font-family:${SANS};font-size:12px;${i === stage ? `color:${CLAY};font-weight:bold;` : `color:${MUTED};`}">${s}</td>`,
  ).join("");
  return section(
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${bars}</tr><tr>${labels}</tr></table>`,
    "28px 32px 0",
  );
}

/** Two side-by-side sand cards (table cells stack nowhere, so keep copy short). */
function infoCards(cards: Array<{ label: string; html: string }>): string {
  const tds = cards
    .map(
      (
        c,
        i,
      ) => `<td width="50%" valign="top" style="${i ? "padding-left:8px;" : "padding-right:8px;"}">
        <div style="background:${SAND};border-radius:8px;padding:18px 20px;">
          ${label(c.label)}
          <div style="margin-top:12px;font-size:15px;line-height:1.55;color:${TEXT};">${c.html}</div>
        </div>
      </td>`,
    )
    .join("");
  return section(
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${tds}</tr></table>`,
  );
}

function addressLines(a: OrderEmailData["address"]): string[] {
  return [a.line1, a.line2, `${a.city}, ${a.state} ${a.postalCode}`]
    .filter(Boolean)
    .map((line) => escapeHtml(line as string));
}

export interface RenderedEmail {
  subject: string;
  html: string;
}

// --- Welcome -------------------------------------------------------------------

export function welcomeEmail(name: string): RenderedEmail {
  const first = escapeHtml(name.trim().split(/\s+/)[0] || "there");
  const base = appBaseUrl();
  const steps = [
    [
      "01",
      "Shop the collection",
      "Handis, jugs and kadhais, made for real kitchens.",
      `${base}/shop`,
    ],
    [
      "02",
      "Learn the care",
      "How to season and look after clay so it lasts for years.",
      `${base}/care`,
    ],
    ["03", "Sit at the wheel", "Book a pottery workshop at the studio.", `${base}/workshops`],
  ];
  const rows = steps
    .map(
      ([n, title, copy, href], i) => `<tr>
        <td width="40" valign="top" style="padding:16px 0;border-top:1px solid ${RULE};${i === steps.length - 1 ? `border-bottom:1px solid ${RULE};` : ""}font-size:22px;color:${CLAY};">${n}</td>
        <td style="padding:16px 0;border-top:1px solid ${RULE};${i === steps.length - 1 ? `border-bottom:1px solid ${RULE};` : ""}">
          <a href="${href}" style="font-size:17px;color:${TEXT};text-decoration:none;">${title}</a>
          <div style="margin-top:4px;font-family:${SANS};font-size:14px;line-height:1.55;color:${MUTED};">${copy}</div>
        </td>
      </tr>`,
    )
    .join("");

  return {
    subject: "Welcome to Mudkraft",
    html: layout(
      "Welcome to Mudkraft",
      `<tr><td><img src="${assetUrl(EMAIL_ASSETS.welcomeBanner)}" width="600" alt="Dal simmering in a Mudkraft clay handi" style="display:block;width:100%;max-width:600px;height:auto;"></td></tr>
       ${intro(
         "Your account is ready",
         `Welcome, ${first}.`,
         "Every pot in our studio is thrown on the wheel and fired in a wood kiln by one family of potters in Khurja. No moulds, no machines.",
       )}
       ${section(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>`)}
       ${ctaRow(button(`${base}/shop`, "Browse the collection"))}
       <tr><td style="height:36px;font-size:0;line-height:0;">&nbsp;</td></tr>`,
      "You are receiving this because you created an account at mudkraft.com.",
    ),
  };
}

// --- Order confirmation ----------------------------------------------------------

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
  /** Defaults to now. */
  placedOn?: Date;
  /** Free text, e.g. "4–6 Nov". The "Arrives" cell is left out when absent. */
  eta?: string;
  /** Shown as a line under the items when set (a coupon or other saving). */
  discountPaise?: number;
  discountLabel?: string;
  /** Tax already inside the total, shown as "Includes GST of …". */
  gstPaise?: number;
  paymentStatus?: "paid" | "pending";
  /** e.g. "UPI" or a gateway reference, appended to the payment card. */
  paymentDetail?: string;
  phone?: string;
  /** Invoice box shows only when both are present. */
  invoiceNo?: string;
  invoiceUrl?: string;
  invoiceDate?: string;
}

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function itemRows(items: OrderEmailItem[], money: boolean, thumb: number): string {
  return items
    .map(
      (item) => `<tr>
        ${
          item.imageUrl
            ? `<td width="${thumb + 16}" style="padding:16px 0;border-bottom:1px solid ${RULE};"><img src="${item.imageUrl}" width="${thumb}" height="${thumb}" alt="" style="display:block;width:${thumb}px;height:${thumb}px;border-radius:8px;"></td>`
            : ""
        }
        <td style="padding:16px 0;border-bottom:1px solid ${RULE};">
          <div style="font-size:16px;color:${TEXT};">${escapeHtml(item.name)}</div>
          <div style="margin-top:4px;font-family:${SANS};font-size:13px;color:${MUTED};">Qty ${item.qty}${money ? ` &middot; ${formatPaiseExact(item.unitPricePaise)} each` : ""}</div>
        </td>
        ${money ? `<td align="right" style="padding:16px 0;border-bottom:1px solid ${RULE};font-size:16px;white-space:nowrap;color:${TEXT};">${formatPaiseExact(item.lineTotalPaise)}</td>` : ""}
      </tr>`,
    )
    .join("");
}

function totalLine(left: string, right: string, color = BODY): string {
  return `<tr><td style="padding:6px 0;font-size:15px;color:${color};">${left}</td><td align="right" style="padding:6px 0;font-size:15px;color:${color};">${right}</td></tr>`;
}

export function orderConfirmationEmail(data: OrderEmailData): RenderedEmail {
  const paid = data.paymentStatus === "paid";
  const nextStep =
    data.method === "whatsapp"
      ? "We will confirm your order over WhatsApp shortly."
      : data.method === "cod"
        ? `Please keep ${formatPaiseExact(data.totalPaise)} ready in cash — payment is collected on delivery.`
        : paid
          ? "Our potters will wrap each piece by hand, and we will email you again the moment it ships."
          : "We will start packing as soon as your payment is confirmed.";

  const meta = [
    { label: "Order no.", value: data.orderNumber },
    { label: "Placed on", value: dateFmt.format(data.placedOn ?? new Date()) },
    ...(data.eta ? [{ label: "Arrives", value: data.eta }] : []),
  ];

  const paymentHtml =
    data.method === "cod"
      ? `Cash on delivery<br><span style="color:${BODY};">${formatPaiseExact(data.totalPaise)} due at the door</span>`
      : data.method === "whatsapp"
        ? "To be confirmed on WhatsApp"
        : `Online payment${data.paymentDetail ? `<br><span style="color:${BODY};">${escapeHtml(data.paymentDetail)}</span>` : ""}${
            paid
              ? `<br><span style="display:inline-block;margin-top:6px;padding:3px 10px;border-radius:999px;background:#E3EBD9;color:#33502a;font-family:${SANS};font-size:12px;font-weight:bold;">Paid</span>`
              : `<br><span style="display:inline-block;margin-top:6px;padding:3px 10px;border-radius:999px;background:#F3E3C8;color:#6b4a14;font-family:${SANS};font-size:12px;font-weight:bold;">Awaiting payment</span>`
          }`;

  const a = addressLines(data.address);
  const deliveryHtml = `${escapeHtml(data.customerName)}<br>${a.join("<br>")}${
    data.phone ? `<br>${escapeHtml(data.phone)}` : ""
  }`;

  const invoice =
    data.invoiceNo && data.invoiceUrl
      ? section(
          `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${RULE};border-radius:8px;"><tr>
             <td style="padding:20px 22px;">
               <div style="font-size:16px;color:${TEXT};">Tax invoice ${escapeHtml(data.invoiceNo)}</div>
               <div style="margin-top:5px;font-family:${SANS};font-size:13px;color:${MUTED};">${data.invoiceDate ? `Dated ${escapeHtml(data.invoiceDate)} &middot; ` : ""}PDF</div>
             </td>
             <td align="right" style="padding:20px 22px;">${outlineButton(data.invoiceUrl, "Download")}</td>
           </tr></table>`,
        )
      : "";

  const totals = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${totalLine("Subtotal", formatPaiseExact(data.subtotalPaise))}
      ${totalLine("Delivery", data.shippingPaise === 0 ? "Free" : formatPaiseExact(data.shippingPaise))}
      ${data.discountPaise ? totalLine(escapeHtml(data.discountLabel ?? "Discount"), `&minus; ${formatPaiseExact(data.discountPaise)}`) : ""}
      <tr><td style="padding:14px 0 0;border-top:2px solid ${EARTH};font-size:22px;color:${TEXT};">${data.method === "cod" ? "Total to pay" : paid ? "Total paid" : "Total"}</td>
          <td align="right" style="padding:14px 0 0;border-top:2px solid ${EARTH};font-size:22px;color:${TEXT};">${formatPaiseExact(data.totalPaise)}</td></tr>
      ${data.gstPaise ? `<tr><td colspan="2" align="right" style="padding-top:6px;font-family:${SANS};font-size:12px;color:${MUTED};">Includes GST of ${formatPaiseExact(data.gstPaise)}</td></tr>` : ""}
    </table>`;

  return {
    subject: `Your Mudkraft order ${data.orderNumber}`,
    html: layout(
      `Order ${data.orderNumber}`,
      `${intro("Order confirmed", `Thank you, ${escapeHtml(data.customerName)}.`, nextStep)}
       ${metaStrip(meta)}
       ${tracker(0)}
       ${section(
         `<div style="padding-bottom:12px;border-bottom:1px solid ${RULE};font-family:${SANS};font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${MUTED};">Your pieces</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${itemRows(data.items, true, 68)}</table>`,
       )}
       ${section(totals, "16px 32px 0")}
       ${infoCards([
         { label: "Delivering to", html: deliveryHtml },
         { label: "Payment", html: paymentHtml },
       ])}
       ${invoice}
       ${ctaRow(button(data.statusUrl, "Track your order"))}
       ${section(
         `<div style="font-family:${SANS};font-size:13px;line-height:1.6;color:${MUTED};text-align:center;">Need to change the address? Reply to this email as soon as you can and we will fix it.</div>`,
         "16px 32px 0",
       )}
       ${section(
         `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${EARTH};border-radius:8px;"><tr><td style="padding:20px 22px;color:#F4EDE3;">
            <div style="font-family:${SANS};font-size:10px;letter-spacing:3px;text-transform:uppercase;color:${GOLD};">First use</div>
            <div style="margin-top:10px;font-size:16px;line-height:1.6;">Handmade clay likes a gentle start. Our care guide takes two minutes to read.</div>
            <a href="${appBaseUrl()}/care" style="display:inline-block;margin-top:12px;font-family:${SANS};font-size:13px;font-weight:bold;color:${GOLD};text-decoration:none;">Read the care guide &rarr;</a>
          </td></tr></table>`,
         "24px 32px 36px",
       )}`,
      "You are receiving this because you placed an order at mudkraft.com.",
    ),
  };
}

// --- Order update (from Bikriup: confirmed, shipped, delivered, refunded…) -----------

export interface OrderUpdateEmailData {
  customerName: string;
  orderNumber: string;
  subject: string;
  headline: string;
  message: string;
  statusUrl: string;
  invoiceUrl: string;
  trackingUrl: string;
  /** When set, the message ends with "Track your order: Click here" linking to this address. */
  clickHereUrl?: string;
  /** Bikriup's order status; picks the step on the progress bar. Cancelled/refund updates show none. */
  status?: string;
  courier?: string;
  trackingNo?: string;
  eta?: string;
}

const STATUS_STAGE: Record<string, number> = {
  confirmed: 1,
  packed: 1,
  shipped: 2,
  out_for_delivery: 2,
  delivered: 3,
};

export function orderUpdateEmail(data: OrderUpdateEmailData): RenderedEmail {
  const stage = data.status ? STATUS_STAGE[data.status] : undefined;
  const courierCells = [
    ...(data.courier ? [{ label: "Courier", value: data.courier }] : []),
    ...(data.trackingNo ? [{ label: "Tracking no.", value: data.trackingNo }] : []),
    ...(data.eta ? [{ label: "Expected", value: data.eta }] : []),
  ];
  const courier = courierCells.length
    ? section(
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SAND};border-radius:8px;"><tr>${courierCells
          .map(
            (c) =>
              `<td style="padding:20px 22px;">${label(c.label)}<div style="margin-top:10px;font-size:17px;color:${TEXT};">${escapeHtml(c.value)}</div></td>`,
          )
          .join("")}</tr></table>`,
      )
    : "";

  const buttons = [
    data.trackingUrl ? button(data.trackingUrl, "Track the parcel") : "",
    data.invoiceUrl ? outlineButton(data.invoiceUrl, "Download invoice (PDF)") : "",
    // Opens the order page, which lists each piece with a link to its review form.
    data.status === "delivered" && data.statusUrl ? outlineButton(data.statusUrl, "Review your pieces") : "",
  ].filter(Boolean);

  return {
    subject: data.subject,
    html: layout(
      data.subject,
      `${intro(
        "Order update",
        escapeHtml(data.headline),
        `Hello ${escapeHtml(data.customerName)}, ${escapeHtml(data.message)}${
          data.clickHereUrl
            ? `<br><br>Track your order: <a href="${data.clickHereUrl}" style="color:${CLAY};font-weight:bold;">Click here</a>`
            : ""
        }`,
      )}
       ${stage === undefined ? "" : tracker(stage)}
       ${courier}
       ${buttons.length ? ctaRow(buttons.join('<span style="display:inline-block;width:10px;">&nbsp;</span>')) : ""}
       ${ctaRow(
         `<a href="${data.statusUrl}" style="font-family:${SANS};font-size:14px;font-weight:bold;color:${CLAY};text-decoration:none;">View order ${escapeHtml(data.orderNumber)} &rarr;</a>`,
       )}
       <tr><td style="height:36px;font-size:0;line-height:0;">&nbsp;</td></tr>`,
      "You are receiving this because you placed an order at mudkraft.com.",
    ),
  };
}

// --- Sign-in ---------------------------------------------------------------------

export function signInCodeEmail(email: string, code: string): RenderedEmail {
  const spaced = `${code.slice(0, 3)} ${code.slice(3)}`;
  return {
    subject: `${spaced} is your Mudkraft sign-in code`,
    html: layout(
      "Your Mudkraft sign-in code",
      `${intro(
        "Sign in",
        "Your sign-in code.",
        `Enter this code on mudkraft.com to sign in as ${escapeHtml(email)}.`,
      )}
       ${section(
         `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SAND};border-radius:10px;"><tr><td align="center" style="padding:28px 20px;">
            <div style="font-size:48px;line-height:1;letter-spacing:12px;color:${TEXT};">${escapeHtml(code)}</div>
            <div style="margin-top:14px;font-family:${SANS};font-size:13px;color:${MUTED};">Valid for 10 minutes. Use it once.</div>
          </td></tr></table>`,
       )}
       ${section(
         `<div style="font-family:${SANS};font-size:14px;line-height:1.7;color:${BODY};">Did not ask for this? Ignore this email and nothing happens. Mudkraft will never ask you for this code on a call or a chat.</div>`,
         "28px 32px 28px",
       )}`,
      "You are receiving this because someone tried to sign in with this email at mudkraft.com.",
    ),
  };
}

export interface SignInAlertData {
  name: string;
  email: string;
  when: string;
  device: string;
  method: string;
  location?: string;
}

export function signInAlertEmail(data: SignInAlertData): RenderedEmail {
  const first = escapeHtml(data.name.trim().split(/\s+/)[0] || "there");
  const facts = [
    ["When", data.when],
    ["Device", data.device],
    ["Sign-in method", data.method],
    ...(data.location ? [["Approx. location", data.location]] : []),
  ];
  const rows = facts
    .map(
      ([k, v], i) => `<tr>
        <td style="padding:14px 0;${i < facts.length - 1 ? `border-bottom:1px solid ${RULE};` : ""}font-family:${SANS};font-size:13px;color:${MUTED};">${k}</td>
        <td align="right" style="padding:14px 0;${i < facts.length - 1 ? `border-bottom:1px solid ${RULE};` : ""}font-size:15px;color:${TEXT};">${escapeHtml(v)}</td>
      </tr>`,
    )
    .join("");
  return {
    subject: "New sign-in to your Mudkraft account",
    html: layout(
      "New sign-in to your Mudkraft account",
      `${intro(
        "Account security",
        "You just signed in.",
        `Hi ${first}, we noticed a sign-in to your Mudkraft account from a new device.`,
      )}
       ${section(
         `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SAND};border-radius:8px;"><tr><td style="padding:6px 22px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
          </td></tr></table>`,
         "24px 32px 0",
       )}
       ${section(
         `<div style="font-size:16px;line-height:1.65;color:${BODY};"><span style="color:${TEXT};">Was this you?</span> Then there is nothing to do.</div>`,
         "28px 32px 0",
       )}
       ${section(
         `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${RULE};border-radius:8px;"><tr><td style="padding:20px 22px;">
            <div style="font-size:16px;color:${TEXT};">Not you?</div>
            <div style="margin-top:6px;font-family:${SANS};font-size:14px;line-height:1.65;color:${BODY};">Sign out of all devices and reset your password right away.</div>
            <div style="margin-top:14px;">${button(`${appBaseUrl()}/sign-in`, "Secure my account")}</div>
          </td></tr></table>`,
         "20px 32px 36px",
       )}`,
      `This security notice was sent to ${data.email}.`,
    ),
  };
}

// --- New product announcement ----------------------------------------------------

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
  const blurb =
    data.description.length > 240 ? `${data.description.slice(0, 240)}…` : data.description;

  return {
    subject: `New from the kiln: ${title}`,
    html: layout(
      `New from the kiln: ${title}`,
      `${intro("Fresh from the kiln", escapeHtml(title), blurb ? escapeHtml(blurb) : "")}
       ${
         data.imageUrl
           ? section(
               `<a href="${data.url}"><img src="${data.imageUrl}" width="536" alt="${escapeHtml(title)}" style="display:block;width:100%;max-width:536px;border-radius:8px;"></a>`,
             )
           : ""
       }
       ${data.tag ? section(`<div style="font-family:${SANS};font-size:14px;color:${CLAY};">${escapeHtml(data.tag)}</div>`, "16px 32px 0") : ""}
       ${section(`<div style="font-size:24px;color:${TEXT};">${formatPaiseExact(data.pricePaise)}</div>`, "12px 32px 0")}
       ${ctaRow(button(data.url, "See it in the shop"))}
       <tr><td style="height:36px;font-size:0;line-height:0;">&nbsp;</td></tr>`,
      "You are receiving this because you have an account or an order at mudkraft.com.",
    ),
  };
}

// --- Newsletter ------------------------------------------------------------------

/** The thank-you for "Letters from the kiln", sent once when an address subscribes. */
export function newsletterWelcomeEmail(unsubscribeUrl: string): RenderedEmail {
  const base = appBaseUrl();
  return {
    subject: "You're on the list: letters from the kiln",
    html: layout(
      "Letters from the kiln",
      `${intro(
        "Letters from the kiln",
        "Thank you for <i>subscribing.</i>",
        "Once a month we'll write to you about new pieces fresh from the kiln, small essays on clay and cooking, and the occasional invitation to the studio in Khurja. No more than that.",
      )}
       ${section(
         `<p style="margin:0;font-size:16px;line-height:1.65;color:${BODY};">While you wait for the first letter, every piece in the collection is hand-thrown from lab-tested river clay and left unglazed.</p>`,
         "18px 32px 0",
       )}
       ${ctaRow(button(`${base}/shop`, "Browse the collection"))}
       ${section(
         `<p style="margin:0;font-family:${SANS};font-size:12px;line-height:1.6;color:${MUTED};">Changed your mind? <a href="${unsubscribeUrl}" style="color:${CLAY};">Unsubscribe</a> in one click.</p>`,
         "28px 32px 0",
       )}
       <tr><td style="height:28px;font-size:0;line-height:0;">&nbsp;</td></tr>`,
      "You are receiving this because you subscribed at mudkraft.com.",
    ),
  };
}

/** A short note to the studio inbox for every new subscriber. */
export function newsletterStudioNoteEmail(email: string): RenderedEmail {
  return {
    subject: `New subscriber: ${email}`,
    html: layout(
      "New subscriber",
      `${intro("Letters from the kiln", "A new subscriber", `${escapeHtml(email)} joined the newsletter from the home page.`)}
       <tr><td style="height:28px;font-size:0;line-height:0;">&nbsp;</td></tr>`,
      "Sent to the studio for every new subscriber.",
    ),
  };
}
