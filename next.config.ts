import type { NextConfig } from "next";

// Deliberately permissive on script/frame/connect/img: the player embeds
// third-party iframe streams and fetches HLS/DASH segments directly from
// arbitrary source CDNs (no proxy — see "Remove stream proxy" commit), and
// AdSense (src/app/layout.tsx) loads scripts/iframes from many ad-network
// domains that aren't enumerable in advance. Tightening those further needs
// a nonce-based setup and AdSense's documented CSP domain list — left as a
// follow-up. object-src/base-uri/form-action/frame-ancestors are still
// locked down since nothing in the app needs them open.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https: http:",
  "font-src 'self' data:",
  "media-src 'self' blob: https:",
  "connect-src 'self' https: wss: ws:",
  "frame-src 'self' https:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join("; ");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  serverExternalPackages: ["bcryptjs", "pg"],
  // TypeScript checker OOM-kills on low-RAM VPS (types are verified locally before push)
  typescript: { ignoreBuildErrors: true },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "Content-Security-Policy", value: CSP },
        ],
      },
    ];
  },
};

export default nextConfig;
