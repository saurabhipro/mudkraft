/**
 * One-way copy of the newsletter list ("Letters from the kiln") into Bikriup, so the shop sees
 * its subscribers in the Bikriup desk and phone app. New sign-ups and unsubscribes are sent as
 * they happen (src/server/actions/newsletter.ts); this sends the ones from before that.
 * Reads this site's database only — nothing here writes to Neon.
 *
 *     BIKRIUP_API_URL=… BIKRIUP_SECRET_KEY=bk_sec_… npm run bikriup:subscribers
 *     … add --dry-run to print what would be sent.
 *
 * Addresses are matched by email, so running it again only updates them.
 */

import "../src/server/db/load-env";

import { db } from "../src/server/db";
import { newsletterSubscriber } from "../src/server/db/schema";

const API = (process.env.BIKRIUP_API_URL ?? "").replace(/\/$/, "");
const KEY = process.env.BIKRIUP_SECRET_KEY ?? "";
const DRY = process.argv.includes("--dry-run");

async function main() {
  const rows = await db.select().from(newsletterSubscriber);
  const subscribers = rows.map((r) => ({
    email: r.email,
    source: r.source,
    status: r.unsubscribedAt ? "unsubscribed" : "subscribed",
    subscribed_at: r.createdAt.toISOString(),
    at: (r.unsubscribedAt ?? r.createdAt).toISOString(),
  }));
  const on = subscribers.filter((s) => s.status === "subscribed").length;
  console.log(`${subscribers.length} addresses (${on} subscribed, ${subscribers.length - on} unsubscribed)`);
  if (DRY || !subscribers.length) return;
  if (!API || !KEY) throw new Error("Set BIKRIUP_API_URL and BIKRIUP_SECRET_KEY");
  for (let i = 0; i < subscribers.length; i += 1000) {
    const res = await fetch(`${API}/subscribers/bulk`, {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ subscribers: subscribers.slice(i, i + 1000) }),
    });
    const out = (await res.json().catch(() => ({}))) as { saved?: number; errors?: unknown[]; error?: string };
    if (!res.ok) throw new Error(out.error ?? `Bikriup answered ${res.status}`);
    console.log(`Sent ${out.saved ?? 0}${out.errors?.length ? `, ${out.errors.length} refused` : ""}`);
  }
}

main().then(() => process.exit(0), (err) => { console.error(err); process.exit(1); });
