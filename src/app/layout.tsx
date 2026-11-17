import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter, Caveat, Tiro_Devanagari_Hindi } from "next/font/google";
import type { ReactNode } from "react";

import { FACEBOOK_URL, INSTAGRAM_URL, SALES_EMAIL, SALES_PHONE_DISPLAY } from "@/lib/catalogue";
import { YOUTUBE_CHANNEL_URL } from "@/lib/youtube";
import { keywordsFor } from "@/lib/keywords";
import { returnPolicy } from "@/lib/schema";
import { OG_IMAGE, ORG_ID, SITE_URL, WEBSITE_ID } from "@/lib/seo";
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

// Hindi lines on the product stories. Only some pages use it, so it is not preloaded.
const hindi = Tiro_Devanagari_Hindi({
  subsets: ["devanagari", "latin"],
  weight: "400",
  variable: "--font-tiro-hindi",
  display: "swap",
  preload: false,
});

const TITLE = "Mudkraft — Soulful Handcrafted Clay";
const DESCRIPTION =
  "Buy handmade unglazed clay handi, kadai, dahi handi and matka from Khurja. Wood-fired, lab-tested with no lead, cadmium or arsenic. Doorstep delivery across India.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  applicationName: "Mudkraft",
  // Search Console's "HTML tag" ownership check; omitted until the token is set.
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
    : {}),
  description: DESCRIPTION,
  // The site's own keywords, for pages that do not name theirs (checkout, sign-in and the like).
  keywords: keywordsFor("/"),
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
      // An online store with no public address: orders ship from Bikriup's warehouses. No
      // PostalAddress or LocalBusiness on purpose, since Google wants those only for a place
      // customers can visit.
      "@type": "OnlineStore",
      "@id": ORG_ID,
      name: "Mudkraft",
      url: SITE_URL,
      logo: `${SITE_URL}/mudkraft-logo.png`,
      description:
        "Handmade unglazed clay cookware and matkas from Khurja, wood-fired and lab-tested.",
      email: SALES_EMAIL,
      telephone: SALES_PHONE_DISPLAY,
      areaServed: { "@type": "Country", name: "India" },
      hasMerchantReturnPolicy: returnPolicy,
      contactPoint: [
        {
          "@type": "ContactPoint",
          contactType: "customer service",
          email: SALES_EMAIL,
          telephone: SALES_PHONE_DISPLAY,
          areaServed: "IN",
          availableLanguage: ["English", "Hindi"],
        },
        {
          // The website takes orders around the clock. Phone and WhatsApp hours are not stated.
          "@type": "ContactPoint",
          contactType: "sales",
          url: `${SITE_URL}/shop`,
          areaServed: "IN",
          availableLanguage: ["English", "Hindi"],
          hoursAvailable: {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            opens: "00:00",
            closes: "23:59",
          },
        },
      ],
      sameAs: [FACEBOOK_URL, YOUTUBE_CHANNEL_URL, INSTAGRAM_URL].filter(Boolean),
    },
    {
      "@type": "WebSite",
      "@id": WEBSITE_ID,
      name: "Mudkraft",
      publisher: { "@id": ORG_ID },
      inLanguage: "en-IN",
      alternateName: ["Mudkraft Studio", "mudkraft.com"],
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
      className={`${cormorant.variable} ${inter.variable} ${caveat.variable} ${hindi.variable}`}
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
