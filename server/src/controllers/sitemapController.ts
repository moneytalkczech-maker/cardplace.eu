import { Request, Response } from "express";
import prisma from "../utils/prisma";

export async function cardSetsSitemap(_req: Request, res: Response) {
  const sets = await prisma.cardSet.findMany({ select: { slug: true, updatedAt: true } });
  const baseUrl = process.env.CORS_ORIGIN || "https://cardbid.app";

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${sets.map((s) => `
  <url>
    <loc>${baseUrl}/cards/sets/${s.slug}</loc>
    <lastmod>${s.updatedAt.toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join("")}
</urlset>`;

  res.header("Content-Type", "application/xml");
  res.send(xml);
}

export async function cardsSitemap(_req: Request, res: Response) {
  const cards = await prisma.databaseCard.findMany({ select: { id: true, updatedAt: true } });
  const baseUrl = process.env.CORS_ORIGIN || "https://cardbid.app";

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${cards.map((c) => `
  <url>
    <loc>${baseUrl}/cards/card/${c.id}</loc>
    <lastmod>${c.updatedAt.toISOString().split("T")[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join("")}
</urlset>`;

  res.header("Content-Type", "application/xml");
  res.send(xml);
}
