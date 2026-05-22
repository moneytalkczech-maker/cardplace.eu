import { withSentryConfig } from "@sentry/nextjs";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.DOCKER === "true" ? "standalone" : undefined,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  async rewrites() {
    const expressUrl = process.env.EXPRESS_URL || "http://localhost:3001";
    return [
      // /api/scan is handled by Next.js app/api/scan/route.ts — no rewrite needed
      {
        source: "/api/:path*",
        destination: `${expressUrl}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${expressUrl}/uploads/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.SENTRY_DSN,
});
