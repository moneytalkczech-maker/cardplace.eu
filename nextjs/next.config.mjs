/** @type {import('next').NextConfig} */
const nextConfig = {
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

export default nextConfig;
