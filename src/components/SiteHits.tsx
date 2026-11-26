"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { sendHit } from "@/lib/site-hits";

/**
 * Counts a page view on the first load and on every client-side navigation, for Bikriup's
 * Analytics menu. The short wait lets Next set the new page's <title> first.
 */
export function SiteHits() {
  const pathname = usePathname();
  useEffect(() => {
    const t = setTimeout(() => sendHit("page_view"), 400);
    return () => clearTimeout(t);
  }, [pathname]);
  return null;
}
