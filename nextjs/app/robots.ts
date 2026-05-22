import { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_BASE_URL || "https://cardportal.eu";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/profile/", "/settings/", "/collection/", "/wanted/"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
