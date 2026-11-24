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
 * A template with a PDF header (mk_order_document) also needs META_APP_ID: Meta reviews it
 * with a sample PDF, uploaded first through the app's resumable upload.
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
const APP_ID = process.env.META_APP_ID ?? "";

// A one-page sample PDF for Meta's review of a document header.
function samplePdf(): Buffer {
  const objs = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 288 432] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    "",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  const text = "BT /F1 14 Tf 24 390 Td (Mudkraft - Invoice MK-1024) Tj ET";
  objs[3] = `<< /Length ${text.length} >>\nstream\n${text}\nendstream`;
  let out = "%PDF-1.4\n";
  const offsets: number[] = [];
  objs.forEach((o, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) out += `${String(off).padStart(10, "0")} 00000 n \n`;
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, "latin1");
}

// Meta's resumable upload: a session on the app, then the bytes; the handle goes in the example.
async function uploadSample(): Promise<string> {
  if (DRY) return "<header_handle>";
  if (!APP_ID) throw new Error("Set META_APP_ID to submit a template with a PDF header.");
  const pdf = samplePdf();
  const session = await graph<{ id: string }>(
    `/${APP_ID}/uploads?file_name=sample.pdf&file_length=${pdf.length}&file_type=application/pdf`,
    { method: "POST" },
  );
  const res = await fetch(`${GRAPH_URL}/${session.id}`, {
    method: "POST",
    headers: { Authorization: `OAuth ${TOKEN}`, file_offset: "0" },
    body: new Uint8Array(pdf),
  });
  const json = (await res.json()) as { h?: string; error?: { message?: string } };
  if (!res.ok || !json.h) throw new Error(json.error?.message || `upload HTTP ${res.status}`);
  return json.h;
}

async function components(t: TemplateDef) {
  const list: unknown[] = [];
  if (t.header?.type === "document") {
    list.push({
      type: "HEADER",
      format: "DOCUMENT",
      example: { header_handle: [await uploadSample()] },
    });
  }
  list.push({ type: "BODY", text: t.body, example: { body_text: [t.example] } });
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
            components: await components(t),
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
          components: await components(t),
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
