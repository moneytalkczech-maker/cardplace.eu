import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.NODE_ENV === "production" ? "standalone" : undefined,
  async rewrites() {
    const expressUrl = process.env.EXPRESS_URL || "http://localhost:3001";
    return [
      // All /api/* calls proxy to Express EXCEPT /api/scan (handled by Next.js route)
      {
        source: "/api/scan",
        destination: "/api/scan",
      },
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
