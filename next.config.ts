import type { NextConfig } from "next";
import { THUMBNAIL_HOSTS } from "./lib/config/sources";
import { securityHeaders } from "./lib/security/headers";

const isDev = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  // The Dockerfile sets NEXT_OUTPUT=standalone to produce a self-contained server.
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  poweredByHeader: false,
  reactStrictMode: true,

  images: {
    // The optimizer only fetches from these hosts (no open image proxy / SSRF).
    remotePatterns: THUMBNAIL_HOSTS.map((hostname) => ({ protocol: "https" as const, hostname, pathname: "/vi/**" })),
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24,
    dangerouslyAllowSVG: false,
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders(isDev),
      },
      {
        // API routes set their own Cache-Control (short CDN caching for identical searches).
        source: "/api/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
    ];
  },
};

export default nextConfig;
