import type { Metadata } from "next";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { VideoCard } from "@/components/VideoCard";
import { OG_IMAGE, SITE_URL } from "@/lib/seo";
import { YOUTUBE_CHANNEL_URL, YOUTUBE_SUBSCRIBE_URL } from "@/lib/youtube";
import { getChannelVideos } from "@/server/youtube";

const TITLE = "Videos — Mudkraft";
const DESCRIPTION =
  "Watch the wheel turn: films from the Mudkraft studio — throwing, glazing and firing river clay by hand.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/videos` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    url: `${SITE_URL}/videos`,
    images: [OG_IMAGE],
  },
  twitter: { card: "summary_large_image", images: [OG_IMAGE] },
};

export default async function VideosPage() {
  const videos = await getChannelVideos();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SiteHeader />

      <section className="max-w-7xl mx-auto px-6 md:px-10 pt-24 md:pt-28 pb-8">
        <div className="text-xs tracking-[0.35em] uppercase text-clay">From the Studio</div>
        <h1 className="mt-3 font-display text-5xl md:text-6xl text-earth leading-[1.05]">
          Watch the <span className="italic">wheel turn</span>
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-foreground/80 max-w-2xl">
          Little films from the studio — clay being centred, glazed and drawn from the kiln. The
          full collection lives on our YouTube channel.
        </p>
      </section>

      <section className="max-w-7xl mx-auto px-6 md:px-10 py-8">
        {videos.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        ) : (
          <p className="text-foreground/70">
            We couldn&apos;t load the videos just now — you can watch everything directly on{" "}
            <a
              href={YOUTUBE_CHANNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-clay underline underline-offset-4 hover:text-earth transition-colors"
            >
              our YouTube channel
            </a>
            .
          </p>
        )}
      </section>

      <section className="max-w-4xl mx-auto px-6 md:px-10 py-16 md:py-24 text-center">
        <p className="text-xs tracking-[0.4em] uppercase text-clay mb-6">— stay close to the kiln</p>
        <p className="font-display text-2xl md:text-3xl text-earth text-balance leading-snug">
          If these small moments of craft bring you joy, a share with a friend — or a subscribe on
          YouTube — quietly helps our little studio keep the wheel turning.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-3">
          <a
            href={YOUTUBE_SUBSCRIBE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center bg-earth text-cream px-8 py-4 rounded-full text-xs tracking-widest uppercase hover:bg-clay transition-colors"
          >
            Subscribe on YouTube
          </a>
          <a
            href={YOUTUBE_CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center border border-earth/25 bg-background text-earth px-8 py-4 rounded-full text-xs tracking-widest uppercase hover:bg-earth hover:text-cream transition-colors"
          >
            Visit the channel
          </a>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
