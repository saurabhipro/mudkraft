/**
 * Sends one copy of every transactional email, filled with dummy data, so the
 * templates can be checked in a real inbox.
 *
 *     npx tsx scripts/send-test-emails.ts you@example.com
 *
 * Images are attached inline (cid:) so they show even before the new files
 * are deployed; links point at the live site.
 */

import { readFileSync } from "node:fs";
import path from "node:path";

import { loadEnvConfig } from "@next/env";
import nodemailer from "nodemailer";

import type { RenderedEmail } from "../src/server/email/templates";

const to = process.argv[2];
if (!to) {
  console.error("Usage: tsx scripts/send-test-emails.ts <recipient>");
  process.exit(1);
}

// Same loader Next uses, so quoted values (a password with quotes in it) parse as the app sees them.
loadEnvConfig(process.cwd());

const SITE = "https://www.mudkraft.com";
process.env.BETTER_AUTH_URL = SITE;

const root = process.cwd();
const fixture = (name: string) => path.join(root, "scripts/fixtures/email", name);

const CID_FILES: Record<string, { url: string; file: string }> = {
  logo: { url: `${SITE}/mudkraft-logo.png`, file: path.join(root, "public/mudkraft-logo.png") },
  banner: {
    url: `${SITE}/email/welcome-banner.jpg`,
    file: path.join(root, "public/email/welcome-banner.jpg"),
  },
  handi: { url: `${SITE}/email/dummy/p-handi.jpg`, file: fixture("p-handi.jpg") },
  dahi: { url: `${SITE}/email/dummy/p-dahi.jpg`, file: fixture("p-dahi.jpg") },
  jug: { url: `${SITE}/email/dummy/p-jug.jpg`, file: fixture("p-jug.jpg") },
};

async function main() {
  const { serverEnv } = await import("../src/server/env");
  const t = await import("../src/server/email/templates");

  if (!serverEnv.SMTP_HOST || !serverEnv.SMTP_USER || !serverEnv.SMTP_PASS) {
    throw new Error("SMTP is not configured in .env");
  }
  const transport = nodemailer.createTransport({
    host: serverEnv.SMTP_HOST,
    port: serverEnv.SMTP_PORT,
    secure: serverEnv.SMTP_PORT === 465,
    auth: { user: serverEnv.SMTP_USER, pass: serverEnv.SMTP_PASS },
  });
  const from = `"Mudkraft Studio" <${serverEnv.SMTP_FROM ?? serverEnv.SMTP_USER}>`;

  const emails: RenderedEmail[] = [
    t.orderConfirmationEmail({
      customerName: "Aarav",
      orderNumber: "MK-1042",
      method: "gateway",
      paymentStatus: "paid",
      paymentDetail: "UPI",
      eta: "4–6 Nov",
      phone: "+91 98765 43210",
      items: [
        {
          name: "Clay Handi, 2.5 L",
          qty: 1,
          unitPricePaise: 129900,
          lineTotalPaise: 129900,
          imageUrl: CID_FILES.handi.url,
        },
        {
          name: "Dahi Handi, 750 g",
          qty: 2,
          unitPricePaise: 44900,
          lineTotalPaise: 89800,
          imageUrl: CID_FILES.dahi.url,
        },
        {
          name: "Clay Jug, 1.5 L",
          qty: 1,
          unitPricePaise: 74900,
          lineTotalPaise: 74900,
          imageUrl: CID_FILES.jug.url,
        },
      ],
      subtotalPaise: 294600,
      shippingPaise: 0,
      discountPaise: 29500,
      discountLabel: "Coupon KILN10",
      totalPaise: 265100,
      gstPaise: 28400,
      address: {
        line1: "B-14, Sector 21",
        line2: null,
        city: "Noida",
        state: "Uttar Pradesh",
        postalCode: "201301",
      },
      statusUrl: `${SITE}/shop`,
      invoiceNo: "IVC-0042",
      invoiceDate: "31 Oct 2026",
      invoiceUrl: `${SITE}/shop`,
    }),
    t.orderUpdateEmail({
      customerName: "Aarav",
      orderNumber: "MK-1042",
      subject: "Order MK-1042 is on its way",
      headline: "Your pieces are on their way",
      message: "order MK-1042 has left the studio with Delhivery (tracking no. 1234 5678 9012).",
      statusUrl: `${SITE}/shop`,
      invoiceUrl: `${SITE}/shop`,
      trackingUrl: `${SITE}/shop`,
      clickHereUrl: `${SITE}/shop`,
      status: "shipped",
      courier: "Delhivery",
      trackingNo: "1234 5678 9012",
      eta: "4–6 Nov",
    }),
    t.welcomeEmail("Aarav Sharma"),
    t.signInCodeEmail(to, "482915"),
    t.signInAlertEmail({
      name: "Aarav Sharma",
      email: to,
      when: "31 Oct 2026, 2:14 pm IST",
      device: "Chrome on Windows",
      method: "Google",
      location: "Noida, India",
    }),
  ];

  for (const mail of emails) {
    let html = mail.html;
    const attachments: Array<{ filename: string; path: string; cid: string }> = [];
    for (const [cid, { url, file }] of Object.entries(CID_FILES)) {
      if (!html.includes(url)) continue;
      readFileSync(file); // fail loudly if a fixture is missing
      html = html.split(url).join(`cid:${cid}`);
      attachments.push({ filename: path.basename(file), path: file, cid });
    }
    await transport.sendMail({ from, to, subject: `[TEST] ${mail.subject}`, html, attachments });
    console.log(`sent: ${mail.subject}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
