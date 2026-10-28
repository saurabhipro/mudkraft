"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Scroll reveal for every public page, without touching each page's markup.
 *
 * Blocks inside a page's sections (headings, paragraphs, cards, list items,
 * photos) rise into place as they reach the screen, siblings a beat apart.
 * Content is only hidden once this script has run, so it is never lost when
 * JavaScript is off; reduced motion and /admin are left alone, and anything
 * that already has its own animation (mk-reveal, animate-*, mk-line) is skipped.
 */

const BLOCKS =
  "h1, h2, h3, p, img, video, figure, blockquote, dl, ol > li, ul > li, article, form, table, details, a[class*='rounded'], div[class*='rounded-']";
const SKIP =
  "header, footer, nav, [role='dialog'], [data-no-motion], .mk-reveal, .mk-line, [class*='animate-'], [class*='mk-count']";
const STAGGER_MS = 70;

export function SiteMotion() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;

    const seen = new WeakSet<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        const shown = entries.filter((e) => e.isIntersecting).map((e) => e.target as HTMLElement);
        shown.forEach((el, i) => {
          io.unobserve(el);
          el.style.transitionDelay = `${Math.min(i, 6) * STAGGER_MS}ms`;
          el.classList.add("mk-in");
          // Hand the element back to its own styles once it has settled.
          window.setTimeout(
            () => {
              el.classList.remove("mk-pre", "mk-in");
              el.style.transitionDelay = "";
            },
            1200 + Math.min(i, 6) * STAGGER_MS,
          );
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );

    // What is already on screen at first paint stays put: hiding it after hydration would flicker.
    let first = true;
    const scan = () => {
      const roots = document.querySelectorAll("main section, body > div section, main");
      roots.forEach((root) => {
        root.querySelectorAll<HTMLElement>(BLOCKS).forEach((el) => {
          if (seen.has(el) || el.closest(SKIP)) return;
          // A block inside a block moves with its parent.
          const parent = el.parentElement?.closest(".mk-pre, .mk-in, [data-mk-done]");
          if (parent) return;
          if (getComputedStyle(el).position === "fixed") return;
          seen.add(el);
          el.setAttribute("data-mk-done", "");
          if (first && el.getBoundingClientRect().top < window.innerHeight) return;
          el.classList.add("mk-pre");
          io.observe(el);
        });
      });
    };

    scan();
    first = false;
    // Client-rendered content (filters, reviews, "load more") joins in as it appears.
    let queued = 0;
    const mo = new MutationObserver(() => {
      if (queued) return;
      queued = window.requestAnimationFrame(() => {
        queued = 0;
        scan();
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      mo.disconnect();
      io.disconnect();
      if (queued) window.cancelAnimationFrame(queued);
      document.querySelectorAll(".mk-pre").forEach((el) => el.classList.remove("mk-pre", "mk-in"));
    };
  }, [pathname]);

  return null;
}
