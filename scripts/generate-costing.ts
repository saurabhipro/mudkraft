import path from "node:path";

import writeXlsxFile from "write-excel-file/node";

/**
 * Generates docs/costing.xlsx — payment, SMS and WhatsApp cost reference.
 * Rates were checked on 2026-08-03 and WILL drift; re-verify before go-live
 * (razorpay.com/pricing, msg91.com/in/pricing, Meta's WhatsApp rate card),
 * update the constants below, and re-run:  npx tsx scripts/generate-costing.ts
 */

const GST = 0.18;

// Razorpay standard plan.
const RZP_RATE = 0.02;

// MSG91 transactional/OTP SMS, typical small-volume rate.
const SMS_RATE = 0.2;
const DLT_ONE_TIME = 5900;

// Meta WhatsApp per-message rates for India (per-message pricing model).
const WA_UTILITY = 0.13;
const WA_AUTH = 0.13;
const WA_MARKETING = 0.8631;

type Cell = {
  value?: string | number;
  type?: typeof String | typeof Number;
  fontWeight?: "bold";
  span?: number;
  wrap?: boolean;
  format?: string;
} | null;

const MONEY = "#,##0.00";

const title = (text: string): Cell[] => [{ value: text, fontWeight: "bold", span: 4 }];
const blank: Cell[] = [];
const head = (...cells: string[]): Cell[] => cells.map((value) => ({ value, fontWeight: "bold" }));
const note = (text: string): Cell[] => [{ value: text, wrap: true, span: 6 }];

function money(value: number): Cell {
  return { value: Math.round(value * 100) / 100, type: Number, format: MONEY };
}

function razorpayRow(orderValue: number): Cell[] {
  const fee = orderValue * RZP_RATE;
  const gst = fee * GST;
  return [
    money(orderValue),
    money(fee),
    money(gst),
    money(fee + gst),
    money(orderValue - fee - gst),
  ];
}

// --------------------------------------------------------------- Sheet 1
const summary: Cell[][] = [
  title("Mudkraft — cost summary (all amounts in ₹, checked 2026-08-03)"),
  blank,
  head("Per-order cost by payment path", "Cost", "", "Notes"),
  [
    { value: "Online (Razorpay), ₹2,000 order" },
    money(2000 * RZP_RATE * (1 + GST)),
    null,
    { value: "2% fee + 18% GST on the fee = 2.36% effective", wrap: true, span: 3 },
  ],
  [
    { value: "Cash on delivery (Delhi NCR)" },
    money(0),
    null,
    { value: "No gateway fee; risk is refusal at the door", wrap: true, span: 3 },
  ],
  [
    { value: "WhatsApp-confirmed order" },
    money(0),
    null,
    { value: "wa.me click-to-chat is free; settled offline", wrap: true, span: 3 },
  ],
  blank,
  head("Per-delivery verification OTP", "Cost", "", "Notes"),
  [
    { value: "Via SMS (MSG91, incl GST)" },
    money(SMS_RATE * (1 + GST)),
    null,
    { value: "Needs one-time DLT registration (see SMS sheet)", wrap: true, span: 3 },
  ],
  [
    { value: "Via WhatsApp authentication (incl GST)" },
    money(WA_AUTH * (1 + GST)),
    null,
    { value: "No DLT needed; needs Meta Cloud API setup", wrap: true, span: 3 },
  ],
  blank,
  head("One-time costs", "Cost", "", "Notes"),
  [{ value: "Razorpay setup / AMC" }, money(0), null, { value: "Free; KYC only", span: 3 }],
  [
    { value: "TRAI DLT registration (only if using SMS)" },
    money(DLT_ONE_TIME),
    null,
    { value: "One operator portal covers all networks", wrap: true, span: 3 },
  ],
  [
    { value: "Meta / WhatsApp Cloud API setup" },
    money(0),
    null,
    { value: "Free; needs Meta business verification effort", wrap: true, span: 3 },
  ],
  blank,
  head("Example month — 100 orders, avg ₹2,000, 70% paid online", "Cost"),
  [{ value: "Razorpay fees (70 online orders)" }, money(70 * 2000 * RZP_RATE * (1 + GST))],
  [{ value: "Delivery OTPs via SMS (100)" }, money(100 * SMS_RATE * (1 + GST))],
  [{ value: "3 WhatsApp utility updates × 100 orders" }, money(300 * WA_UTILITY * (1 + GST))],
  [{ value: "1 launch broadcast to 500 customers (marketing)" }, money(500 * WA_MARKETING * (1 + GST))],
  [
    { value: "Total variable cost", fontWeight: "bold" },
    {
      ...money(
        70 * 2000 * RZP_RATE * (1 + GST) +
          100 * SMS_RATE * (1 + GST) +
          300 * WA_UTILITY * (1 + GST) +
          500 * WA_MARKETING * (1 + GST),
      ),
      fontWeight: "bold",
    },
  ],
];

// --------------------------------------------------------------- Sheet 2
const razorpay: Cell[][] = [
  title("Razorpay — standard plan (no setup fee, no AMC, pay per success)"),
  blank,
  head("Item", "Rate"),
  [{ value: "Setup fee / annual maintenance" }, { value: "₹0" }],
  [{ value: "UPI, domestic cards, netbanking, wallets" }, { value: "2% + 18% GST on fee (2.36% effective)" }],
  [{ value: "RuPay credit card via UPI" }, { value: "2.15% + GST" }],
  [{ value: "Amex / Diners / international cards" }, { value: "~3% + GST" }],
  [{ value: "Failed payments" }, { value: "No fee" }],
  [{ value: "Refunds" }, { value: "Original fee is not returned" }],
  [{ value: "Settlement" }, { value: "T+2 days (instant settlement costs extra)" }],
  [{ value: "Volume above ~₹5–10 lakh/month" }, { value: "Negotiable custom rates" }],
  blank,
  head("Order value", "Fee (2%)", "GST (18% of fee)", "Total deduction", "You receive"),
  razorpayRow(500),
  razorpayRow(1000),
  razorpayRow(2000),
  razorpayRow(2500),
  razorpayRow(5000),
  razorpayRow(10000),
  blank,
  note("Go-live: KYC (PAN, bank account, address proof) + website review — Contact/Terms/Privacy/Refund pages are required on the site. Then swap rzp_test_ keys for rzp_live_ in .env; zero code changes."),
  note("Verify the live rate card at razorpay.com/pricing before activation."),
];

// --------------------------------------------------------------- Sheet 3
const sms: Cell[][] = [
  title("SMS OTP (delivery verification) — MSG91 recommended"),
  blank,
  head("Item", "Cost", "Notes"),
  [
    { value: "MSG91 OTP SMS" },
    { value: "₹0.15–0.25 / SMS" },
    { value: "Prepaid wallet, no monthly fee; volume lowers the rate", wrap: true, span: 3 },
  ],
  [
    { value: "Effective incl 18% GST (at ₹0.20)" },
    money(SMS_RATE * (1 + GST)),
    { value: "Per SMS actually sent", span: 3 },
  ],
  [
    { value: "TRAI DLT registration (one-time)" },
    money(DLT_ONE_TIME),
    { value: "Legally required; unregistered OTP routes are blocked by Jio/Airtel/Vi. 2–7 working days.", wrap: true, span: 3 },
  ],
  [
    { value: "Sender ID + template approval" },
    { value: "₹0" },
    { value: "Done on the DLT portal after entity registration", wrap: true, span: 3 },
  ],
  [
    { value: "Twilio (comparison)" },
    { value: "~₹3.5–4 / SMS" },
    { value: "Fine for demos ($15 trial credit, verified numbers only); uneconomical for India production", wrap: true, span: 3 },
  ],
  blank,
  head("Scenario", "SMS count", "Monthly cost (incl GST)"),
  [
    { value: "100 deliveries, 1 OTP each" },
    { value: 100, type: Number },
    money(100 * SMS_RATE * (1 + GST)),
  ],
  [
    { value: "100 deliveries, avg 1.5 OTPs (resends)" },
    { value: 150, type: Number },
    money(150 * SMS_RATE * (1 + GST)),
  ],
  blank,
  note("Demo mode today: with MSG91_* env vars blank, OTPs print to the server console — the full QR flow is testable at ₹0."),
  note("Alternative that removes DLT entirely: send the OTP as a WhatsApp authentication template (~₹0.13 + GST) — see the WhatsApp sheet."),
];

// --------------------------------------------------------------- Sheet 4
const whatsapp: Cell[][] = [
  title("WhatsApp / Meta — chat on the site + programmatic messages (India rates)"),
  blank,
  head("Option", "Cost", "Notes"),
  [
    { value: "Click-to-chat links / site chat button (wa.me)" },
    { value: "₹0" },
    { value: "What the site uses today. A floating chat widget opening wa.me is also free — no Meta account, no API.", wrap: true, span: 4 },
  ],
  [
    { value: "WhatsApp Business app (phone)" },
    { value: "₹0" },
    { value: "Manual replies; fine at studio volume", wrap: true, span: 4 },
  ],
  [
    { value: "WhatsApp Business Platform (Cloud API)" },
    { value: "Per message, below" },
    { value: "Needed only for programmatic sends: OTPs, order updates, broadcasts. Direct Cloud API has no platform fee; BSPs add a markup or monthly fee on top.", wrap: true, span: 4 },
  ],
  blank,
  head("Cloud API message type", "Meta rate / msg", "Incl 18% GST", "When it applies"),
  [
    { value: "Service (customer messages first, 24h window)" },
    { value: "FREE" },
    { value: "FREE" },
    { value: "All replies inside the window — the chat use-case costs nothing", wrap: true, span: 3 },
  ],
  [
    { value: "Utility (order updates, delivery notices)" },
    money(WA_UTILITY),
    money(WA_UTILITY * (1 + GST)),
    { value: "Business-initiated, template-approved", wrap: true, span: 3 },
  ],
  [
    { value: "Authentication (OTP)" },
    money(WA_AUTH),
    money(WA_AUTH * (1 + GST)),
    { value: "The DLT-free alternative to SMS OTP", wrap: true, span: 3 },
  ],
  [
    { value: "Marketing (broadcasts, new-product pushes)" },
    money(WA_MARKETING),
    money(WA_MARKETING * (1 + GST)),
    { value: "~7× the utility rate (raised ~10% Jan 2026); opt-in required", wrap: true, span: 3 },
  ],
  blank,
  head("Scenario", "Msgs", "Cost (incl GST)"),
  [
    { value: "Delivery OTP via WhatsApp, 100 deliveries" },
    { value: 100, type: Number },
    money(100 * WA_AUTH * (1 + GST)),
  ],
  [
    { value: "3 utility updates × 100 orders" },
    { value: 300, type: Number },
    money(300 * WA_UTILITY * (1 + GST)),
  ],
  [
    { value: "Launch broadcast to 500 customers" },
    { value: 500, type: Number },
    money(500 * WA_MARKETING * (1 + GST)),
  ],
  blank,
  note("Setup for the Cloud API: Meta Business verification, a dedicated phone number for the WABA, and per-template approval. No DLT registration."),
  note("Recommendation: keep the free wa.me chat for the site now; adopt the Cloud API when programmatic sends (OTP / order updates / broadcasts) are wanted — and if so, send the delivery OTP over WhatsApp and skip DLT."),
];

async function main() {
  const filePath = path.join(process.cwd(), "docs", "costing.xlsx");

  await writeXlsxFile(
    [
      {
        sheet: "Summary",
        columns: [{ width: 48 }, { width: 14 }, { width: 14 }, { width: 18 }, { width: 18 }, { width: 18 }],
        data: summary,
      },
      {
        sheet: "Razorpay",
        columns: [{ width: 42 }, { width: 16 }, { width: 18 }, { width: 18 }, { width: 16 }, { width: 16 }],
        data: razorpay,
      },
      {
        sheet: "SMS OTP",
        columns: [{ width: 42 }, { width: 16 }, { width: 22 }, { width: 18 }, { width: 16 }, { width: 16 }],
        data: sms,
      },
      {
        sheet: "WhatsApp (Meta)",
        columns: [{ width: 46 }, { width: 16 }, { width: 14 }, { width: 22 }, { width: 16 }, { width: 16 }],
        data: whatsapp,
      },
    ],
  ).toFile(filePath);

  console.log(`Wrote ${filePath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
