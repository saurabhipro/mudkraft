"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

import { ADS_ID, GA_ID, PIXEL_ID, ensureFbq, track } from "@/lib/analytics";

/** Sends a page_view on every client-side navigation (the first one is sent by `config`). */
function PageViews() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const first = useRef(true);

  useEffect(() => {
    // `config` already counted the first load; later route changes are ours to send.
    if (first.current) {
      first.current = false;
      return;
    }
    track("page_view", {
      page_path: pathname + (search ? `?${search}` : ""),
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname, search]);

  return null;
}

/** Loads GA4 and the Meta Pixel. Each is off unless its public ID is set at build time. */
export function Analytics() {
  useEffect(() => {
    if (PIXEL_ID) ensureFbq();
  }, []);
  if (!GA_ID && !PIXEL_ID) return null;
  return (
    <>
      {PIXEL_ID && <Script src="https://connect.facebook.net/en_US/fbevents.js" strategy="afterInteractive" />}
      {GA_ID && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];if(!window.__mkGtag){window.gtag=function(){dataLayer.push(arguments);};gtag('js',new Date());gtag('config','${GA_ID}');${ADS_ID ? `gtag('config','${ADS_ID}');` : ""}}`}
          </Script>
        </>
      )}
      <Suspense fallback={null}>
        <PageViews />
      </Suspense>
    </>
  );
}
