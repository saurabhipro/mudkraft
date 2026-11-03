/**
 * Uploads the WhatsApp checkout form (src/server/whatsapp/flow.ts) to Meta, publishes
 * it, and prints the id for WHATSAPP_FLOW_ID.
 *
 *     WHATSAPP_WABA_ID=… WHATSAPP_ACCESS_TOKEN=… npm run whatsapp:flow
 *     … add --dry-run to print the form JSON.
 *
 * Safe to run again: a draft is updated and published; a form already published is
 * left alone (Meta does not allow editing it). To change a published form, rename
 * FLOW_NAME, run this again, and put the new id in WHATSAPP_FLOW_ID.
 */

import "../src/server/db/load-env";

import { FLOW_JSON, FLOW_NAME } from "../src/server/whatsapp/flow";
import { GRAPH_URL } from "../src/server/whatsapp/templates";

const WABA = process.env.WHATSAPP_WABA_ID ?? "";
const TOKEN = process.env.WHATSAPP_ACCESS_TOKEN ?? "";

type GraphError = { error?: { message?: string; error_user_msg?: string } };

async function graph<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${GRAPH_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      ...(typeof init.body === "string" ? { "Content-Type": "application/json" } : {}),
    },
  });
  const json = (await res.json()) as T & GraphError;
  if (!res.ok)
    throw new Error(json.error?.error_user_msg || json.error?.message || `HTTP ${res.status}`);
  return json;
}

async function main() {
  if (process.argv.includes("--dry-run")) {
    console.log(JSON.stringify(FLOW_JSON, null, 2));
    return;
  }
  if (!WABA || !TOKEN)
    throw new Error("Set WHATSAPP_WABA_ID and WHATSAPP_ACCESS_TOKEN (in .env.local or the shell).");

  const list = await graph<{ data: Array<{ id: string; name: string; status: string }> }>(
    `/${WABA}/flows?fields=id,name,status&limit=100`,
  );
  let flow = list.data.find((f) => f.name === FLOW_NAME);
  if (flow?.status === "PUBLISHED") {
    console.log(`${FLOW_NAME} is already published.\nWHATSAPP_FLOW_ID=${flow.id}`);
    return;
  }
  if (!flow) {
    const made = await graph<{ id: string }>(`/${WABA}/flows`, {
      method: "POST",
      body: JSON.stringify({ name: FLOW_NAME, categories: ["SHOPPING"] }),
    });
    flow = { id: made.id, name: FLOW_NAME, status: "DRAFT" };
    console.log(`Created ${FLOW_NAME} (${flow.id})`);
  }

  const form = new FormData();
  form.append(
    "file",
    new Blob([JSON.stringify(FLOW_JSON)], { type: "application/json" }),
    "flow.json",
  );
  form.append("name", "flow.json");
  form.append("asset_type", "FLOW_JSON");
  const upload = await graph<{
    validation_errors?: Array<{ error: string; message: string; line_start?: number }>;
  }>(`/${flow.id}/assets`, { method: "POST", body: form });
  if (upload.validation_errors?.length) {
    for (const e of upload.validation_errors)
      console.log(`  ✗ ${e.error}: ${e.message}${e.line_start ? ` (line ${e.line_start})` : ""}`);
    throw new Error("Meta rejected the form JSON; fix src/server/whatsapp/flow.ts and run again.");
  }

  await graph(`/${flow.id}/publish`, { method: "POST", body: "{}" });
  console.log(`Published ${FLOW_NAME}.\nWHATSAPP_FLOW_ID=${flow.id}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
