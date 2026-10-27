import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Self-hosted on the Bikriup VM: `next build` writes a self-contained server to .next/standalone.
  output: "standalone",
};

export default nextConfig;
