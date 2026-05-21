import { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_BASE_URL || "https://cardplace.eu";
const EXPRESS = process.env.EXPRESS_URL || "http://localhost:3001";

async function fetchJson<T>(url: string): Promise<T[]> {
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/auctions`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE}/cards`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/scan`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/register`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/faq`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/legal/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/legal/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/legal/fees`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/legal/auction-rules`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/legal/cookies`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/legal/prohibited-items`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
  ];

  const [auctionList, cardSetList] = await Promise.all([
    fetchJson<{ id: string; updatedAt?: string }>(`${EXPRESS}/api/auctions?limit=200&status=ACTIVE`),
    fetchJson<{ slug: string; updatedAt?: string }>(`${EXPRESS}/api/card-sets?limit=500`),
  ]);

  const auctionRoutes: MetadataRoute.Sitemap = auctionList.map((a) => ({
    url: `${BASE}/auctions/${a.id}`,
    lastModified: a.updatedAt ? new Date(a.updatedAt) : new Date(),
    changeFrequency: "hourly" as const,
    priority: 0.7,
  }));

  const cardSetRoutes: MetadataRoute.Sitemap = cardSetList.map((s) => ({
    url: `${BASE}/cards/sets/${s.slug}`,
    lastModified: s.updatedAt ? new Date(s.updatedAt) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...auctionRoutes, ...cardSetRoutes];
}
