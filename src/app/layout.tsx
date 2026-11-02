import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter, Caveat } from "next/font/google";
import type { ReactNode } from "react";

import { FACEBOOK_URL, INSTAGRAM_URL, SALES_EMAIL, SALES_PHONE_DISPLAY } from "@/lib/catalogue";
import { YOUTUBE_CHANNEL_URL } from "@/lib/youtube";
import { OG_IMAGE, SITE_URL } from "@/lib/seo";
import { Providers } from "./providers";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-caveat",
  display: "swap",
});

const TITLE = "Mudkraft — Soulful Handcrafted Clay";
const DESCRIPTION =
  "Buy handmade unglazed clay handi, kadai, dahi handi and matka from Khurja. Wood-fired, lab-tested with no lead, cadmium or arsenic. Free delivery across India.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  // Search Console's "HTML tag" ownership check; omitted until the token is set.
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
    : {}),
  description: DESCRIPTION,
  authors: [{ name: "Mudkraft" }],
  // Tab and home-screen icons come from app/icon.png and app/apple-icon.png.
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    siteName: "Mudkraft",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "Mudkraft",
      url: SITE_URL,
      logo: `${SITE_URL}/mudkraft-logo.png`,
      description:
        "Handmade unglazed clay cookware and matkas from Khurja, wood-fired and lab-tested.",
      email: SALES_EMAIL,
      telephone: SALES_PHONE_DISPLAY,
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer service",
        email: SALES_EMAIL,
        telephone: SALES_PHONE_DISPLAY,
        areaServed: "IN",
        availableLanguage: ["English", "Hindi"],
      },
      sameAs: [FACEBOOK_URL, YOUTUBE_CHANNEL_URL, INSTAGRAM_URL].filter(Boolean),
    },
    {
      "@type": "WebSite",
      name: "Mudkraft",
      url: SITE_URL,
    },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      // globals.css sets `scroll-behavior: smooth` on <html>. Without this
      // attribute Next cannot tell an intentional smooth scroll from one it
      // should suppress, so route changes animate the scroll restoration.
      data-scroll-behavior="smooth"
      className={`${cormorant.variable} ${inter.variable} ${caveat.variable}`}
    >
      <body>
        <Providers>{children}</Providers>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </body>
    </html>
  );
}
