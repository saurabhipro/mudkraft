"use server";

import { z } from "zod";

import { bikriup, bikriupEnabled } from "../bikriup";

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
