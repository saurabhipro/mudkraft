// Sends every URL in the live sitemap to IndexNow (Bing, and so ChatGPT search and Copilot).
// Run after a deploy:  npm run indexnow     (needs the site live; the key file ships with it)
const SITE = process.env.SITE_URL ?? "https://www.mudkraft.com";
const KEY = (await import("node:fs")).readdirSync("public").find((f) => /^[0-9a-f]{32}\.txt$/.test(f))?.replace(".txt", "");
if (!KEY) throw new Error("No IndexNow key file found in public/");

const xml = await (await fetch(`${SITE}/sitemap.xml`)).text();
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
console.log(`Submitting ${urls.length} URLs from ${SITE}/sitemap.xml`);

const res = await fetch("https://api.indexnow.org/IndexNow", {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: new URL(SITE).host, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList: urls }),
});
console.log(`IndexNow answered ${res.status} ${res.statusText} (200 or 202 means accepted)`);
if (!res.ok) console.log(await res.text());
