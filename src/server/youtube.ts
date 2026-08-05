import { YOUTUBE_CHANNEL_ID, type YouTubeVideo } from "@/lib/youtube";

/**
 * Reads the channel's public RSS feed — no API key, no quota. The feed only
 * carries the latest ~15 uploads, which is all the gallery needs.
 *
 * Best-effort like email: a YouTube outage must never take the homepage down,
 * so this returns [] on any failure and the sections render empty instead.
 */

const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${YOUTUBE_CHANNEL_ID}`;

/** One real fetch per hour per server; everything else is served from cache. */
const REVALIDATE_SECONDS = 3600;

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

export async function getChannelVideos(): Promise<YouTubeVideo[]> {
  try {
    const res = await fetch(FEED_URL, { next: { revalidate: REVALIDATE_SECONDS } });
    if (!res.ok) {
      console.error(`[youtube] feed responded ${res.status}`);
      return [];
    }

    const xml = await res.text();

    // The feed is small and rigidly machine-generated, so a scoped regex per
    // <entry> beats pulling in an XML parser dependency for three fields.
    const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? [];

    const videos: YouTubeVideo[] = [];
    for (const entry of entries) {
      const id = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
      if (!id) continue;
      videos.push({
        id,
        title: decodeXmlEntities(entry.match(/<title>([^<]*)<\/title>/)?.[1] ?? ""),
        publishedAt: entry.match(/<published>([^<]+)<\/published>/)?.[1] ?? "",
      });
    }

    // Feed order is newest-first already, but sort defensively — the gallery's
    // "latest two" promise depends on it.
    videos.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    return videos;
  } catch (error) {
    console.error("[youtube] feed fetch failed", error);
    return [];
  }
}
