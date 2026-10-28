"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReviewSummaryView, ReviewView } from "@/lib/review-view";
import { ReviewForm } from "@/components/ReviewForm";

function Lightbox({
  photos,
  index,
  onClose,
  onPrev,
  onNext,
  productName,
}: {
  photos: { src: string; author: string }[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  productName: string;
}) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, [index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") onPrev();
      else if (e.key === "ArrowRight") onNext();
      else if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(4, z + 0.5));
      else if (e.key === "-") setZoom((z) => Math.max(1, z - 0.5));
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, onPrev, onNext]);

  const current = photos[index];
  if (!current) return null;

  const zoomIn = () => setZoom((z) => Math.min(4, z + 0.5));
  const zoomOut = () =>
    setZoom((z) => {
      const nz = Math.max(1, z - 0.5);
      if (nz === 1) setOffset({ x: 0, y: 0 });
      return nz;
    });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Customer photo gallery"
      className="fixed inset-0 z-[100] bg-ink/95 backdrop-blur-sm flex items-center justify-center animate-fade-up"
      onClick={onClose}
    >
      {/* Top bar */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-between gap-3 px-3 sm:px-6 py-4 text-cream"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-w-0 truncate text-xs tracking-[0.3em] uppercase opacity-80">
          {index + 1} / {photos.length} · by {current.author}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={zoomOut}
            aria-label="Zoom out"
            className="w-10 h-10 rounded-full border border-cream/30 hover:bg-cream/10 flex items-center justify-center text-lg"
          >
            −
          </button>
          <span className="text-xs tabular-nums w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            onClick={zoomIn}
            aria-label="Zoom in"
            className="w-10 h-10 rounded-full border border-cream/30 hover:bg-cream/10 flex items-center justify-center text-lg"
          >
            +
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close gallery"
            className="ml-2 w-10 h-10 rounded-full border border-cream/30 hover:bg-cream/10 flex items-center justify-center text-lg"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Prev / Next */}
      {photos.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            aria-label="Previous photo"
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-cream/30 text-cream hover:bg-cream/10 flex items-center justify-center text-2xl"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            aria-label="Next photo"
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-cream/30 text-cream hover:bg-cream/10 flex items-center justify-center text-2xl"
          >
            ›
          </button>
        </>
      )}

      {/* Image */}
      <div
        className="max-w-[90vw] max-h-[80vh] overflow-hidden select-none"
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={() => (zoom === 1 ? zoomIn() : (setZoom(1), setOffset({ x: 0, y: 0 })))}
        onMouseDown={(e) => zoom > 1 && setDragging({ x: e.clientX - offset.x, y: e.clientY - offset.y })}
        onMouseMove={(e) => dragging && setOffset({ x: e.clientX - dragging.x, y: e.clientY - dragging.y })}
        onMouseUp={() => setDragging(null)}
        onMouseLeave={() => setDragging(null)}
        style={{ cursor: zoom > 1 ? (dragging ? "grabbing" : "grab") : "zoom-in" }}
      >
        <img
          src={current.src}
          alt={`Customer photo of ${productName} by ${current.author}`}
          draggable={false}
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            transition: dragging ? "none" : "transform 0.2s ease",
          }}
          className="max-w-[90vw] max-h-[80vh] object-contain"
        />
      </div>

      {/* Thumbnails */}
      {photos.length > 1 && (
        <div
          className="absolute bottom-4 left-0 right-0 flex items-center overflow-x-auto px-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mx-auto flex w-max items-center gap-2">
          {photos.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                const diff = i - index;
                if (diff > 0) for (let k = 0; k < diff; k++) onNext();
                else for (let k = 0; k < -diff; k++) onPrev();
              }}
              aria-label={`Show photo ${i + 1}`}
              className={`w-12 h-12 rounded-lg overflow-hidden ring-2 transition ${
                i === index ? "ring-gold" : "ring-cream/20 hover:ring-cream/50"
              }`}
            >
              <img src={p.src} alt="" className="w-full h-full object-contain bg-cream/10" />
            </button>
          ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stars({
  value,
  size = "sm",
  ariaLabel,
}: {
  value: number;
  size?: "sm" | "md" | "lg";
  ariaLabel?: string;
}) {
  const px = size === "lg" ? "w-6 h-6" : size === "md" ? "w-5 h-5" : "w-4 h-4";
  const full = Math.floor(value);
  const hasHalf = value - full >= 0.25 && value - full < 0.75;
  return (
    <span
      role="img"
      aria-label={ariaLabel ?? `${value.toFixed(1)} out of 5 stars`}
      className="inline-flex items-center gap-0.5 text-gold"
    >
      {[0, 1, 2, 3, 4].map((i) => {
        const filled = i < full;
        const half = !filled && i === full && hasHalf;
        return (
          <svg key={i} viewBox="0 0 24 24" className={px} aria-hidden="true">
            <defs>
              <linearGradient id={`half-${i}-${value}`}>
                <stop offset="50%" stopColor="currentColor" />
                <stop offset="50%" stopColor="rgba(0,0,0,0.15)" />
              </linearGradient>
            </defs>
            <path
              d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.5l1.1-6.5L2.6 9.4l6.5-.9L12 2.6z"
              fill={filled ? "currentColor" : half ? `url(#half-${i}-${value})` : "rgba(0,0,0,0.15)"}
            />
          </svg>
        );
      })}
    </span>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

/**
 * Reviews and their summary are fetched on the server and passed in — only
 * approved reviews ever reach this component, because the store layer filters
 * on status in SQL rather than relying on a caller to remember.
 */
export function ReviewsSection({
  slug,
  name,
  reviews,
  summary,
}: {
  slug: string;
  name: string;
  reviews: ReviewView[];
  summary: ReviewSummaryView;
}) {
  const [filter, setFilter] = useState<0 | 1 | 2 | 3 | 4 | 5>(0);
  const [visible, setVisible] = useState(4);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filtered = filter === 0 ? reviews : reviews.filter((r) => r.rating === filter);
  const shown = filtered.slice(0, visible);
  const maxCount = Math.max(1, ...Object.values(summary.distribution));

  const galleryPhotos = useMemo(
    () =>
      filtered
        .filter((r) => !!r.photo)
        .map((r) => ({ src: r.photo as string, author: r.name })),
    [filtered],
  );
  const openLightbox = (photo: string) => {
    const idx = galleryPhotos.findIndex((p) => p.src === photo);
    if (idx >= 0) setLightboxIndex(idx);
  };

  // Placed after every hook so the hook order stays stable across renders.
  // Without this the section would render "0.0" with five empty bars, which
  // reads as broken rather than as "nobody has reviewed this yet".
  if (summary.count === 0) {
    return (
      <section
        id="reviews"
        className="max-w-7xl mx-auto px-6 md:px-10 py-16 md:py-24 border-t border-border"
        aria-labelledby="reviews-heading"
      >
        <div className="text-xs tracking-[0.3em] uppercase text-clay">Voices from the kitchen</div>
        <h2 id="reviews-heading" className="mt-3 font-display text-4xl md:text-5xl text-earth">
          No reviews <span className="italic">yet</span>
        </h2>
        <p className="mt-4 max-w-lg text-foreground/75 leading-relaxed">
          This piece hasn&apos;t been reviewed yet. If you&apos;ve brought one home, we&apos;d love
          to hear how it&apos;s settling in.
        </p>
        <div className="max-w-xl">
          <ReviewForm slug={slug} name={name} />
        </div>
      </section>
    );
  }

  return (
    <section
      id="reviews"
      className="max-w-7xl mx-auto px-6 md:px-10 py-16 md:py-24 border-t border-border"
      aria-labelledby="reviews-heading"
    >
      <div className="grid md:grid-cols-3 gap-10 md:gap-16">
        {/* Summary */}
        <div className="md:col-span-1">
          <div className="text-xs tracking-[0.3em] uppercase text-clay">Voices from the kitchen</div>
          <h2 id="reviews-heading" className="mt-3 font-display text-4xl md:text-5xl text-earth leading-[1.05]">
            What people <span className="italic">say</span>
          </h2>

          <div className="mt-6 flex items-center gap-3">
            <div className="font-display text-5xl text-earth leading-none">{summary.average.toFixed(1)}</div>
            <div>
              <Stars value={summary.average} size="md" />
              <div className="text-xs text-muted-foreground mt-1">
                Based on {summary.count} review{summary.count === 1 ? "" : "s"}
              </div>
            </div>
          </div>

          {/* Distribution bars */}
          <div className="mt-6 space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const s = star as 1 | 2 | 3 | 4 | 5;
              const count = summary.distribution[s];
              const pct = (count / maxCount) * 100;
              const active = filter === s;
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => {
                    setFilter(active ? 0 : s);
                    setVisible(4);
                  }}
                  className={`w-full flex items-center gap-3 text-xs group ${active ? "text-earth" : "text-muted-foreground hover:text-earth"}`}
                  aria-pressed={active}
                  aria-label={`Show only ${star}-star reviews`}
                >
                  <span className="w-8 text-left tabular-nums">{star} ★</span>
                  <span className="flex-1 h-1.5 rounded-full bg-earth/10 overflow-hidden">
                    <span
                      className={`block h-full rounded-full ${active ? "bg-earth" : "bg-earth/50 group-hover:bg-earth/70"} transition-colors`}
                      style={{ width: `${pct}%` }}
                    />
                  </span>
                  <span className="w-6 text-right tabular-nums">{count}</span>
                </button>
              );
            })}
          </div>

          {filter !== 0 && (
            <button
              type="button"
              onClick={() => {
                setFilter(0);
                setVisible(4);
              }}
              className="mt-4 text-xs tracking-widest uppercase text-clay hover:text-earth"
            >
              Clear filter ×
            </button>
          )}

          <ReviewForm slug={slug} name={name} />

          <p className="mt-8 text-xs text-muted-foreground leading-relaxed">
            Reviews are shared by customers with their consent. Photos show real pieces —
            small variations in colour and shape are part of the hand-thrown process.
          </p>
        </div>

        {/* List */}
        <div className="md:col-span-2 space-y-6">
          {shown.length === 0 && (
            <div className="rounded-2xl border border-earth/15 bg-cream/60 p-8 text-center text-muted-foreground">
              No reviews with this rating yet.
            </div>
          )}

          {shown.map((r: ReviewView) => (
            <article
              key={r.id}
              className="rounded-2xl border border-earth/15 bg-cream/60 p-6 md:p-7"
            >
              <div className="flex items-start justify-between gap-2 sm:gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full bg-earth text-cream flex items-center justify-center font-display text-lg"
                      aria-hidden="true"
                    >
                      {r.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-display text-lg text-earth leading-tight">{r.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {r.city}
                        {r.verified && (
                          <span className="ml-2 inline-flex items-center gap-1 text-earth/80">
                            <svg viewBox="0 0 24 24" className="w-3 h-3" fill="currentColor" aria-hidden="true">
                              <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
                            </svg>
                            Verified buyer
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <Stars value={r.rating} ariaLabel={`${r.rating} out of 5 stars`} />
                  <div className="mt-1 text-[11px] tracking-widest uppercase text-muted-foreground">
                    {formatDate(r.date)}
                  </div>
                </div>
              </div>

              <h3 className="mt-4 font-display text-xl text-earth">{r.title}</h3>
              <p className="mt-2 text-foreground/85 leading-relaxed">{r.body}</p>

              {r.photo && (
                <button
                  type="button"
                  onClick={() => openLightbox(r.photo!)}
                  className="mt-4 inline-block rounded-xl overflow-hidden bg-gradient-to-br from-cream to-[hsl(35,35%,88%)] ring-1 ring-earth/10 hover:ring-earth/40 hover:scale-[1.02] transition"
                  aria-label={`Open photo of ${name} from ${r.name} in gallery`}
                >
                  <img
                    src={r.photo}
                    alt={`Customer photo of ${name}`}
                    loading="lazy"
                    className="w-28 h-28 object-contain p-2"
                  />
                </button>
              )}
            </article>
          ))}

          {filtered.length > visible && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => setVisible((v) => v + 4)}
                className="inline-flex items-center gap-2 border border-earth/30 text-earth px-6 py-3 rounded-full text-xs tracking-widest uppercase hover:bg-earth hover:text-cream transition-colors"
              >
                Load more reviews
              </button>
            </div>
          )}
        </div>
      </div>

      {lightboxIndex !== null && galleryPhotos.length > 0 && (
        <Lightbox
          photos={galleryPhotos}
          index={lightboxIndex}
          productName={name}
          onClose={() => setLightboxIndex(null)}
          onPrev={() =>
            setLightboxIndex((i) =>
              i === null ? i : (i - 1 + galleryPhotos.length) % galleryPhotos.length,
            )
          }
          onNext={() =>
            setLightboxIndex((i) => (i === null ? i : (i + 1) % galleryPhotos.length))
          }
        />
      )}
    </section>
  );
}
