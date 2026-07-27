import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter, Caveat } from "next/font/google";
import type { ReactNode } from "react";

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
  "Mudkraft is a slow craft studio shaping pots, kulhads, planters and diyas from river clay — made by hand, fired with fire, rooted in earth.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  authors: [{ name: "Lovable" }],
  icons: { icon: [{ url: "/favicon.ico", type: "image/x-icon" }] },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    site: "@Lovable",
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
      logo: `${SITE_URL}/favicon.ico`,
      description:
        "Slow craft studio shaping pots, kulhads, planters and diyas from river clay.",
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
