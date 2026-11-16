"use server";

import { z } from "zod";

import { bikriup, bikriupEnabled } from "../bikriup";
import { sendEnquiryAlert } from "../email/send";
import { clientIp, createLimiter } from "../rate-limit";

/**
 * Workshop bookings land in Bikriup › People › Enquiries, so the studio has a
 * list to follow up from — the WhatsApp message alone was easy to lose.
 */

const TYPES: Record<string, string> = {
  School: "School workshop",
  Birthday: "Birthday",
  "Private party": "Private party",
  "Corporate offsite": "Corporate",
};

const schema = z.object({
  name: z.string().trim().min(1).max(80),
  phone: z.string().trim().max(20).default(""),
  email: z.string().trim().max(120).default(""),
  type: z.string().trim().max(60).default(""),
  date: z.string().trim().max(40).default(""),
  guests: z.string().trim().max(80).default(""),
  message: z.string().trim().max(2000).default(""),
});

export async function sendWorkshopEnquiry(input: unknown): Promise<{ ok: boolean }> {
  if (!bikriupEnabled()) return { ok: false };
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false };
  const d = parsed.data;
  try {
    await bikriup("/enquiries", {
      method: "POST",
      body: {
        name: d.name,
        phone: d.phone,
        email: d.email,
        type: TYPES[d.type] ?? d.type,
        preferred_date: d.date,
        guests: d.guests,
        message: d.message,
        page: "/workshops",
      },
    });
    return { ok: true };
  } catch (error) {
    // The WhatsApp message still went; a lost copy here must not bother the visitor.
    console.error("[bikriup] enquiry not saved:", error);
    return { ok: false };
  }
}

/* ---------- Bulk orders and custom pieces (/bulk-orders) ---------- */

const tooManyTrade = createLimiter({ windowMs: 60 * 60 * 1000, max: 10 });

const line = z.object({
  slug: z.string().trim().max(120).default(""),
  code: z.string().trim().max(40).default(""),
  name: z.string().trim().max(120).default(""),
  qty: z.coerce.number().int().min(1).max(100000),
});

const tradeSchema = z.object({
  kind: z.enum(["bulk", "custom"]),
  name: z.string().trim().min(1, "Add your name").max(80),
  phone: z.string().trim().max(20).default(""),
  email: z.string().trim().max(120).default(""),
  business: z.string().trim().max(120).default(""),
  gstin: z.string().trim().max(20).default(""),
  city: z.string().trim().max(60).default(""),
  pincode: z.string().trim().max(10).default(""),
  neededBy: z.string().trim().max(20).default(""),
  budget: z.string().trim().max(60).default(""),
  message: z.string().trim().max(2000).default(""),
  items: z.array(line).max(50).default([]),
  useCase: z.string().trim().max(60).default(""),
  size: z.string().trim().max(80).default(""),
  qty: z.coerce.number().int().min(0).max(100000).default(0),
  finish: z.string().trim().max(60).default(""),
  // Up to three reference pictures, already made small in the browser (about 300 KB each).
  pictures: z
    .array(
      z
        .string()
        .max(1_500_000)
        .regex(/^data:image\/(jpeg|png|webp);base64,/),
    )
    .max(3)
    .default([]),
  // Left empty by people; filled by bots.
  website: z.string().max(200).default(""),
});

export type TradeEnquiryInput = z.input<typeof tradeSchema>;
export type TradeEnquiryResult = { ok: true } | { ok: false; error: string };

/**
 * A bulk order (pieces from the collection with quantities) or a custom piece (a brief and
 * pictures). The enquiry, with its item lines and pictures, lands in Bikriup › People › Enquiries;
 * the studio also gets an email. The page offers WhatsApp alongside, so nothing depends on this alone.
 */
export async function sendTradeEnquiry(input: TradeEnquiryInput): Promise<TradeEnquiryResult> {
  const parsed = tradeSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form" };
  const d = parsed.data;
  if (d.website) return { ok: true };
  const phone = d.phone.replace(/\D/g, "").slice(-10);
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email);
  if (phone.length !== 10 && !emailOk)
    return { ok: false, error: "Add a 10-digit mobile number or an email so we can reply" };
  if (d.kind === "bulk" && !d.items.length)
    return { ok: false, error: "Add at least one piece to your list" };
  if (d.kind === "custom" && !d.message)
    return { ok: false, error: "Tell us a little about the piece" };
  const ip = await clientIp();
  if (tooManyTrade(ip))
    return {
      ok: false,
      error: "Too many enquiries from here in an hour. Please message us on WhatsApp instead.",
    };

  const type = d.kind === "bulk" ? "Bulk order" : "Custom order";
  const details = {
    items:
      d.kind === "bulk"
        ? d.items.map((i) => ({ slug: i.slug, code: i.code, name: i.name, qty: i.qty }))
        : [],
    business: d.business,
    gstin: d.gstin,
    city: d.city,
    pincode: d.pincode.replace(/\D/g, ""),
    needed_by: d.neededBy,
    budget: d.budget,
    ...(d.kind === "custom"
      ? { use_case: d.useCase, size: d.size, qty: d.qty || undefined, finish: d.finish }
      : {}),
  };

  let saved = false;
  if (bikriupEnabled()) {
    try {
      await bikriup("/enquiries", {
        method: "POST",
        forwardedFor: ip,
        body: {
          name: d.name,
          phone,
          email: emailOk ? d.email : "",
          type,
          message: d.message,
          page: d.kind === "bulk" ? "/bulk-orders" : "/bulk-orders?type=custom",
          details,
          attachments: d.kind === "custom" ? d.pictures : [],
        },
      });
      saved = true;
    } catch (error) {
      console.error("[bikriup] trade enquiry not saved:", error);
    }
  }

  const lines = [
    `${type} from ${d.name}${d.business ? ` (${d.business})` : ""}`,
    `Contact: ${[phone, emailOk ? d.email : ""].filter(Boolean).join(" · ")}`,
    ...(d.kind === "bulk"
      ? [
          ...d.items.map((i) => `• ${i.code ? `${i.code} ` : ""}${i.name} × ${i.qty}`),
          `Total pieces: ${d.items.reduce((n, i) => n + i.qty, 0)}`,
        ]
      : [
          `For: ${d.useCase || "—"} · Size: ${d.size || "—"} · Quantity: ${d.qty || "—"} · Finish: ${d.finish || "—"}`,
          d.pictures.length
            ? `${d.pictures.length} reference picture(s): see Bikriup › Enquiries`
            : "",
        ]),
    [d.city, d.pincode].filter(Boolean).join(" ")
      ? `Delivery: ${[d.city, d.pincode].filter(Boolean).join(" ")}`
      : "",
    d.gstin ? `GSTIN: ${d.gstin}` : "",
    d.neededBy ? `Needed by: ${d.neededBy}` : "",
    d.budget ? `Budget: ${d.budget}` : "",
    d.message ? `Notes: ${d.message}` : "",
    saved
      ? "Saved in Bikriup › People › Enquiries."
      : "Not saved in Bikriup: reply from this email.",
  ].filter(Boolean);
  const emailed = await sendEnquiryAlert(
    `${type}: ${d.name}`,
    lines,
    emailOk ? d.email : undefined,
  );

  if (!saved && !emailed)
    return {
      ok: false,
      error: "We couldn't send this just now. Please send it on WhatsApp instead.",
    };
  return { ok: true };
}
