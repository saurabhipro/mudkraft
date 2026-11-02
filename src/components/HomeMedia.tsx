"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/**
 * Photo and video sections for the home page: the film band under the hero,
 * the "made by hand" and kitchen mosaics, the workshop gallery and the studio
 * stories rail. Files live in /public/media.
 */

const M = "/media";

function Eyebrow({ children, tone = "light" }: { children: string; tone?: "light" | "dark" }) {
  return (
    <div className="flex items-center gap-3.5">
      <span className={`mk-grow block h-px w-12 ${tone === "dark" ? "bg-gold" : "bg-clay-deep"}`} />
      <span
        className={`text-[11px] tracking-[0.32em] uppercase font-medium ${
          tone === "dark" ? "text-gold" : "text-clay-deep"
        }`}
      >
        {children}
      </span>
    </div>
  );
}

function Tile({
  src,
  alt,
  caption,
  className = "",
  large = false,
}: {
  src: string;
  alt: string;
  caption: string;
  className?: string;
  large?: boolean;
}) {
  return (
    <figure
      className={`group relative overflow-hidden rounded-[1.4rem] md:rounded-3xl bg-earth shadow-[0_18px_40px_-22px_oklch(0.28_0.04_40/0.55)] ${className}`}
    >
      <img
        src={`${M}/${src}`}
        alt={alt}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover saturate-[1.28] contrast-[1.08] brightness-[1.06] transition-transform duration-[1600ms] ease-[var(--ease-clay)] group-hover:scale-[1.04]"
      />
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-cream/15" />
      <figcaption
        className={`absolute left-3 bottom-3 md:left-4 md:bottom-4 max-w-[calc(100%-1.5rem)] rounded-full bg-cream/92 backdrop-blur px-4 md:px-5 py-1.5 md:py-2 font-display text-earth leading-tight ${
          large ? "text-[1.3rem] md:text-[1.7rem]" : "text-[1.05rem] md:text-[1.3rem]"
        }`}
      >
        {caption}
      </figcaption>
    </figure>
  );
}

/** Full-width looping film right under the hero. Muted until the visitor asks for sound. */
export function HomeFilm() {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const pausedByUser = useRef(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      pausedByUser.current = true;
      v.pause();
      return;
    }
    // Only play while on screen, so it costs nothing once scrolled past.
    const io = new IntersectionObserver(
      ([e]) => {
        if (pausedByUser.current) return;
        if (e.isIntersecting) void v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.25 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  const toggleSound = () => {
    const v = ref.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const togglePlay = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      pausedByUser.current = false;
      void v.play().catch(() => {});
    } else {
      pausedByUser.current = true;
      v.pause();
    }
  };

  const btn =
    "inline-flex items-center justify-center gap-2.5 h-11 rounded-full bg-cream/92 text-earth text-[13px] font-medium backdrop-blur transition-transform hover:scale-105";

  return (
    <section
      aria-label="Watch it made"
      data-no-motion
      className="relative h-[78svh] min-h-[540px] max-h-[860px] overflow-hidden bg-kiln"
    >
      <video
        ref={ref}
        src={`${M}/film.mp4`}
        poster={`${M}/film-poster.jpg`}
        muted
        loop
        playsInline
        preload="none"
        onPlay={() => setPaused(false)}
        onPause={() => setPaused(true)}
        aria-label="Dal simmering in a Mudkraft clay handi on the stove"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-kiln/45 to-transparent" />

      <div className="absolute inset-x-3 bottom-3 md:inset-x-auto md:left-10 md:bottom-10 md:w-[26rem] rounded-3xl bg-kiln/55 backdrop-blur-md px-6 py-6 md:px-8 md:py-7 text-cream">
        <Eyebrow tone="dark">Watch it made</Eyebrow>
        <h2 className="mt-4 font-display font-normal text-[2rem] md:text-[2.75rem] leading-none">
          From the wheel <em className="font-light text-gold">to your stove.</em>
        </h2>
        <p className="mt-3.5 text-[13px] md:text-[15px] leading-relaxed text-cream/80">
          Real clay, a real kitchen, no tricks. Handmade, food-safe, no chemical glaze.
        </p>
      </div>

      <div className="absolute right-3 top-3 md:right-10 md:top-auto md:bottom-10 flex items-center gap-2.5">
        <button
          type="button"
          onClick={toggleSound}
          aria-label={muted ? "Turn sound on" : "Turn sound off"}
          className={`${btn} w-11 md:w-auto md:px-5`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="w-[18px] h-[18px]"
          >
            <path d="M11 5 6 9H3v6h3l5 4z" />
            {muted ? <path d="m16 9 5 6m0-6-5 6" /> : <path d="M16 9a4 4 0 0 1 0 6" />}
          </svg>
          <span className="hidden md:inline">{muted ? "Sound on" : "Sound off"}</span>
        </button>
        <button
          type="button"
          onClick={togglePlay}
          aria-label={paused ? "Play video" : "Pause video"}
          className={`${btn} w-11 hidden md:inline-flex`}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="w-4 h-4">
            {paused ? (
              <path d="M8 5v14l11-7z" />
            ) : (
              <>
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </>
            )}
          </svg>
        </button>
      </div>
    </section>
  );
}

/** Potter photos, between the collection and the craft story. */
export function MadeByHand() {
  return (
    <section aria-label="Made by hand" className="px-6 md:px-10 pb-10 md:pb-16 -mt-8 md:-mt-14">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4 mb-6 md:mb-8">
          <div>
            <Eyebrow>Made by hand</Eyebrow>
            <h2 className="mk-reveal mt-4 font-display font-normal text-[clamp(2.25rem,4.5vw,4rem)] leading-none text-earth">
              Slow work, <em className="font-light text-clay">lasting pieces.</em>
            </h2>
          </div>
          <p className="max-w-sm text-base leading-relaxed text-muted-foreground">
            Every curve is shaped and finished by a potter, one piece at a time.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          <Tile
            src="craft-shaped.jpg"
            alt="A potter finishing the lid of a clay pot by hand"
            caption="Shaped by hand"
            large
            className="col-span-2 md:col-span-1 aspect-square"
          />
          <Tile
            src="craft-detail.jpg"
            alt="Textured lid detail on a handmade clay pot"
            caption="Detail you can feel"
            className="aspect-square"
          />
          <Tile
            src="craft-used.jpg"
            alt="A potter holding a finished clay pot"
            caption="Crafted to be used"
            className="aspect-square"
          />
        </div>
      </div>
    </section>
  );
}

/** Stove photos, after the craft story. */
export function InYourKitchen() {
  return (
    <section aria-label="In your kitchen" className="px-6 md:px-10 pt-12 md:pt-16">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4 mb-6 md:mb-8">
          <div>
            <Eyebrow>In your kitchen</Eyebrow>
            <h2 className="mk-reveal mt-4 font-display font-normal text-[clamp(2.25rem,4.5vw,4rem)] leading-none text-earth">
              Cooked the <em className="font-light text-clay">slow way.</em>
            </h2>
          </div>
          <p className="max-w-sm text-base leading-relaxed text-muted-foreground">
            Gentle, even heat and an earthy flavour, from clay made for real kitchens.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          <Tile
            src="kitchen-slow.jpg"
            alt="Dal simmering in a clay handi"
            caption="Cooked the slow way"
            className="col-span-2 md:col-span-1 aspect-[3/2]"
          />
          <Tile
            src="kitchen-stove.jpg"
            alt="A clay handi on a gas stove"
            caption="From the wheel to your stove"
            className="aspect-square md:aspect-[3/2]"
          />
          <Tile
            src="kitchen-heat.jpg"
            alt="A clay handi over a blue flame"
            caption="Gentle, even heat"
            className="aspect-square md:aspect-[3/2]"
          />
        </div>
      </div>
    </section>
  );
}

/** Photo strip that continues the existing workshops card. */
export function WorkshopGallery() {
  return (
    <section aria-label="Workshop photos" className="px-6 md:px-10 pb-12 md:pb-16 -mt-12 md:-mt-24">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        <Tile
          src="ws-hands.jpg"
          alt="A potter's hands guiding a student's on the wheel"
          caption="Hands that teach"
          className="col-span-2 md:col-span-1 aspect-[4/3]"
        />
        <Tile
          src="ws-potters.jpg"
          alt="A potter guiding a student at the wheel"
          caption="Learn from our potters"
          className="aspect-[4/3]"
        />
        <Tile
          src="ws-ages.jpg"
          alt="A family learning together at the wheel"
          caption="Clay for all ages"
          className="aspect-[4/3]"
        />
        <Tile
          src="paint-colour.jpg"
          alt="Painting a clay plate on a turntable"
          caption="Colour it your way"
          className="aspect-[4/3]"
        />
        <Tile
          src="paint-own.jpg"
          alt="A guest painting their own piece"
          caption="Paint your own piece"
          className="aspect-[4/3]"
        />
        <Tile
          src="ws-together.jpg"
          alt="A potter and a guest working together"
          caption="Make it together"
          className="col-span-2 md:col-span-1 aspect-[4/3]"
        />
      </div>
      <div className="max-w-7xl mx-auto mt-6 text-center">
        <Link
          href="/workshops"
          className="mk-btn-fill inline-flex items-center gap-3 min-h-[54px] px-8 rounded-full border border-earth/25 text-earth text-xs tracking-[0.16em] uppercase"
        >
          Book a workshop
        </Link>
      </div>
    </section>
  );
}

const STORIES = [
  { id: "potter", title: "A potter at the wheel" },
  { id: "lesson", title: "A lesson at the wheel" },
  { id: "wheel", title: "Learning to throw" },
  { id: "first-pot", title: "A first pot" },
  { id: "kitchen", title: "Cookware for real kitchens" },
  { id: "paint", title: "Paint your own" },
];

/** Vertical studio films: posters until tapped, then a full-screen player. */
export function StudioStories() {
  const [open, setOpen] = useState<string | null>(null);
  const current = STORIES.find((s) => s.id === open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <section aria-label="Stories from the studio" className="pb-12 md:pb-16">
      <div className="px-6 md:px-10">
        <div className="max-w-7xl mx-auto flex flex-wrap items-end justify-between gap-x-10 gap-y-4 mb-6 md:mb-8">
          <div>
            <Eyebrow>From the studio</Eyebrow>
            <h2 className="mk-reveal mt-4 font-display font-normal text-[clamp(2.25rem,4.5vw,4rem)] leading-none text-earth">
              Stories from <em className="font-light text-clay">the studio.</em>
            </h2>
          </div>
          <p className="max-w-sm text-base leading-relaxed text-muted-foreground">
            Short films from the workshop floor. Tap one to watch.
          </p>
        </div>
      </div>
      <div className="px-6 md:px-10">
        <ul className="max-w-7xl mx-auto flex md:grid md:grid-cols-6 gap-3 md:gap-5 overflow-x-auto md:overflow-visible snap-x pb-2 -mx-6 px-6 md:mx-auto md:px-0">
          {STORIES.map((s) => (
            <li key={s.id} className="snap-start shrink-0 w-[150px] md:w-auto">
              <button
                type="button"
                onClick={() => setOpen(s.id)}
                aria-label={`Play: ${s.title}`}
                className="group relative block w-full aspect-[9/16] overflow-hidden rounded-2xl bg-kiln"
              >
                <img
                  src={`${M}/reel-${s.id}.jpg`}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1600ms] ease-[var(--ease-clay)] group-hover:scale-[1.05]"
                />
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full bg-cream/92 text-earth shadow-lg transition-transform group-hover:scale-110">
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                      className="w-5 h-5"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={current.title}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-kiln/90 p-4"
          onClick={() => setOpen(null)}
        >
          <video
            key={current.id}
            src={`${M}/reel-${current.id}.mp4`}
            poster={`${M}/reel-${current.id}.jpg`}
            controls
            autoPlay
            playsInline
            onClick={(e) => e.stopPropagation()}
            className="max-h-[88svh] max-w-full aspect-[9/16] rounded-2xl bg-kiln"
          />
          <button
            type="button"
            onClick={() => setOpen(null)}
            aria-label="Close video"
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-cream/92 text-earth"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
              className="w-5 h-5"
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
      )}
    </section>
  );
}
