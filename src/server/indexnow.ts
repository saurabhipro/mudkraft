import { INDEXNOW_KEY, SITE_URL } from "@/lib/seo";

/**
 * Tells Bing (and so ChatGPT search and Copilot) that pages were added or changed, so they are
 * fetched within minutes instead of whenever the crawler comes back. Best effort: it never throws,
 * and does nothing outside production.
 */
export async function pingIndexNow(urls: string[]): Promise<void> {
  if (process.env.NODE_ENV !== "production" || urls.length === 0) return;
  try {
    const res = await fetch("https://api.indexnow.org/IndexNow", {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: new URL(SITE_URL).host,
        key: INDEXNOW_KEY,
        keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
        urlList: urls.slice(0, 10000),
      }),
      signal: AbortSignal.timeout(8000),
    });
    // 200 and 202 both mean accepted; anything else is only worth a warning.
    if (!res.ok) console.warn(`[indexnow] responded ${res.status}`);
  } catch (error) {
    console.warn("[indexnow] ping failed", error);
  }
}
