import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

/**
 * Content Security Policy. It ships as **Report-Only**: browsers report what
 * it would have blocked to /api/csp-report and block nothing. Once the server
 * log has been quiet for a week of real traffic, rename the header to
 * `Content-Security-Policy` to enforce it. See docs/razorpay-runbook.md.
 *
 * Razorpay's checkout.js opens its own iframe from api.razorpay.com and talks
 * to *.razorpay.com (lumberjack is its telemetry); Google sign-in, Analytics,
 * Ads and the Meta pixel are the other third parties the pages load.
 */
const csp = [
  "default-src 'self'",
  [
    "script-src 'self' 'unsafe-inline'",
    isProd ? "" : "'unsafe-eval'",
    "https://checkout.razorpay.com https://*.razorpay.com",
    "https://www.googletagmanager.com https://*.google-analytics.com https://www.googleadservices.com https://googleads.g.doubleclick.net",
    "https://connect.facebook.net https://accounts.google.com",
  ]
    .filter(Boolean)
    .join(" "),
  [
    "connect-src 'self'",
    "https://api.razorpay.com https://lumberjack.razorpay.com https://*.razorpay.com",
    "https://api.cloudinary.com",
    "https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://*.doubleclick.net https://www.google.com",
    "https://www.facebook.com https://connect.facebook.net https://accounts.google.com",
  ].join(" "),
  [
    "frame-src 'self'",
    "https://api.razorpay.com https://checkout.razorpay.com https://*.razorpay.com",
    "https://www.youtube.com https://www.youtube-nocookie.com",
    "https://accounts.google.com https://www.googletagmanager.com https://td.doubleclick.net https://www.facebook.com",
  ].join(" "),
  // Product photos come from Cloudinary and Bikriup's media host; pixels and
  // YouTube thumbnails add more. Images cannot run code, so any https source is allowed.
  "img-src 'self' data: blob: https:",
  "style-src 'self' 'unsafe-inline' https://accounts.google.com",
  // next/font self-hosts the Google fonts at build time.
  "font-src 'self' data:",
  "media-src 'self' https:",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'self'",
  "form-action 'self' https://*.razorpay.com",
  "report-uri /api/csp-report",
].join("; ");

// HSTS, nosniff, Referrer-Policy, X-Frame-Options and Permissions-Policy are
// sent by Caddy in front of the app (bikriup repo: deploy/mudkraft/mudkraft.caddy),
// so they live in one place. Only the CSP is set here, next to the code it describes.
const securityHeaders = isProd ? [{ key: "Content-Security-Policy-Report-Only", value: csp }] : [];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Self-hosted on the Bikriup VM: `next build` writes a self-contained server to .next/standalone.
  output: "standalone",
  experimental: {
    // The custom-piece form sends up to three reference pictures, made small in the browser first.
    serverActions: { bodySizeLimit: "5mb" },
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
