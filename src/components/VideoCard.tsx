"use client";

import { useState } from "react";

import { youtubeEmbedUrl, youtubeThumbnail, type YouTubeVideo } from "@/lib/youtube";

/**
 * Click-to-play YouTube card: renders only the static thumbnail until the
 * visitor presses play, then swaps in the nocookie iframe with autoplay. Keeps
 * the page light and defers YouTube's cookies until someone actually watches.
 */
export function VideoCard({ video }: { video: YouTubeVideo }) {
  const [playing, setPlaying] = useState(false);

  const published = video.publishedAt
    ? new Date(video.publishedAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <figure>
      {playing ? (
        <div className="aspect-video w-full rounded-2xl overflow-hidden bg-earth">
          <iframe
            src={youtubeEmbedUrl(video.id)}
            title={video.title}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`Play video: ${video.title}`}
          className="group relative block aspect-video w-full rounded-2xl overflow-hidden bg-earth"
        >
          <img
            src={youtubeThumbnail(video.id)}
            alt={video.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <span className="absolute inset-0 bg-earth/25 group-hover:bg-earth/10 transition-colors" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-cream/90 text-earth shadow-lg transition-transform group-hover:scale-110">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M8 5.5v13l11-6.5z" />
              </svg>
            </span>
          </span>
        </button>
      )}
      <figcaption className="mt-3">
        <div className="text-earth font-medium leading-snug">{video.title}</div>
        {published && <div className="mt-1 text-sm text-muted-foreground">{published}</div>}
      </figcaption>
    </figure>
  );
}
