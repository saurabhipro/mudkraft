/**
 * Submits the WhatsApp message templates in src/server/whatsapp/templates.ts to
 * Meta for approval, and prints where each one stands.
 *
 *     WHATSAPP_WABA_ID=… WHATSAPP_ACCESS_TOKEN=… npm run whatsapp:templates
 *     … add --dry-run to print what would be sent.
 *
 * Safe to run again: templates Meta already has (any status) are left alone and
 * only missing ones are submitted. To change an approved template's wording, edit
 * it in WhatsApp Manager (or delete it there and run this again).
 *
 * WHATSAPP_WABA_ID is the WhatsApp Business Account id on the app's API Setup page.
 */

import "../src/server/db/load-env";

import { SITE_URL } from "../src/lib/seo";
import {
  GRAPH_URL,
  TEMPLATES,
  TEMPLATE_LANGUAGE,
  type TemplateDef,
} from "../src/server/whatsapp/templates";

const WABA = process.env.WHATSAPP_WABA_ID ?? "";
const TOKEN = process.env.WHATSAPP_ACCESS_TOKEN ?? "";
const DRY = process.argv.includes("--dry-run");

function components(t: TemplateDef) {
  const list: unknown[] = [{ type: "BODY", text: t.body, example: { body_text: [t.example] } }];
  const b = t.button;
  if (b?.type === "url") {
    list.push({
      type: "BUTTONS",
      buttons: [
        {
          type: "URL",
          text: b.text,
          url: SITE_URL + b.path,
          example: [SITE_URL + b.path.replace("{{1}}", b.example)],
        },
      ],
    });
  }
  if (b?.type === "static") {
    list.push({
      type: "BUTTONS",
      buttons: [{ type: "URL", text: b.text, url: SITE_URL + b.path }],
    });
  }
  if (b?.type === "copy_code") {
    list.push({ type: "BUTTONS", buttons: [{ type: "COPY_CODE", example: b.example }] });
  }
  return list;
}

async function graph<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${GRAPH_URL}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
  });
  const json = (await res.json()) as T & { error?: { message?: string; error_user_msg?: string } };
  if (!res.ok)
    throw new Error(json.error?.error_user_msg || json.error?.message || `HTTP ${res.status}`);
  return json;
}

async function main() {
  const defs = Object.values(TEMPLATES) as TemplateDef[];
  if (DRY) {
    for (const t of defs) {
      console.log(
        JSON.stringify(
          {
            name: t.name,
            language: TEMPLATE_LANGUAGE,
            category: t.category,
            components: components(t),
          },
          null,
          2,
        ),
      );
    }
    return;
  }
  if (!WABA || !TOKEN)
    throw new Error("Set WHATSAPP_WABA_ID and WHATSAPP_ACCESS_TOKEN (in .env.local or the shell).");

  const existing = await graph<{
    data: Array<{ name: string; status: string; category: string; language: string }>;
  }>(`/${WABA}/message_templates?fields=name,status,category,language&limit=200`);
  const have = new Map(
    existing.data.filter((t) => t.language === TEMPLATE_LANGUAGE).map((t) => [t.name, t]),
  );

  for (const t of defs) {
    const found = have.get(t.name);
    if (found) {
      const recategorised =
        found.category !== t.category ? `  (Meta filed it as ${found.category})` : "";
      console.log(`${t.name.padEnd(28)} ${found.status}${recategorised}`);
      continue;
    }
    try {
      const out = await graph<{ status: string; category: string }>(`/${WABA}/message_templates`, {
        method: "POST",
        body: JSON.stringify({
          name: t.name,
          language: TEMPLATE_LANGUAGE,
          category: t.category,
          components: components(t),
        }),
      });
      console.log(
        `${t.name.padEnd(28)} submitted → ${out.status}${out.category !== t.category ? `  (filed as ${out.category})` : ""}`,
      );
    } catch (error) {
      console.log(`${t.name.padEnd(28)} REJECTED: ${(error as Error).message}`);
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
