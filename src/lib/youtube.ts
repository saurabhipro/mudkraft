/**
 * YouTube constants and URL builders, safe to import from client components.
 * The channel ID is public by design — it appears in the channel URL itself —
 * so it lives here as a constant rather than an environment variable, exactly
 * like the Cloudinary cloud name. The feed fetcher is server-only and lives in
 * src/server/youtube.ts.
 */

export const YOUTUBE_CHANNEL_ID = "UCHfkCF8yxQ2akChE606RdhQ";

export const YOUTUBE_CHANNEL_URL = `https://www.youtube.com/channel/${YOUTUBE_CHANNEL_ID}`;

/** Opens the channel with YouTube's "Subscribe?" confirmation dialog showing. */
export const YOUTUBE_SUBSCRIBE_URL = `${YOUTUBE_CHANNEL_URL}?sub_confirmation=1`;

export interface YouTubeVideo {
  /** The 11-character YouTube video id. */
  id: string;
  title: string;
  /** ISO timestamp from the feed's <published> element. */
  publishedAt: string;
}

export function youtubeThumbnail(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * The nocookie host defers YouTube's tracking cookies until playback starts,
 * which is also why the gallery only mounts this iframe after a click.
 */
export function youtubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
}

export function youtubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}
