import axios from "axios";
import prisma from "../utils/prisma";
import { toCzk } from "../utils/currencyConverter";
import logger from "../utils/logger";

const CARDMARKET_API = "https://api.cardmarket.com/ws/v2.0";
const AUTH_TOKEN = process.env.CARDMARKET_AUTH_TOKEN || "";

export interface PriceResult {
  low: number | null;
  avg: number | null;
  trend: number | null;
}

export async function updateCardPrices(cardId: string): Promise<PriceResult | null> {
  const card = await prisma.databaseCard.findUnique({ where: { id: cardId } });
  if (!card) return null;

  const url = card.cardmarketUrl
    ? `${CARDMARKET_API}/articles/${extractId(card.cardmarketUrl)}/prices`
    : null;

  if (!url) {
    // Zkusíme vyhledat
    const searchUrl = `${CARDMARKET_API}/articles/search?search=`;
    const query = encodeURIComponent(`${card.name} ${card.cardNumber || ""}`);
    
    try {
      const headers: Record<string, string> = { "Accept": "application/json" };
      if (AUTH_TOKEN) headers["Authorization"] = `Bearer ${AUTH_TOKEN}`;

      const { data } = await axios.get(`${searchUrl}${query}`, { headers, timeout: 8000 });
      const articles = data?.article || [];
      if (articles.length === 0) return null;

      return await savePricesFromArticles(card.id, articles);
    } catch {
      return null;
    }
  }

  try {
    const headers: Record<string, string> = { "Accept": "application/json" };
    if (AUTH_TOKEN) headers["Authorization"] = `Bearer ${AUTH_TOKEN}`;

    const { data } = await axios.get(url, { headers, timeout: 8000 });
    return await savePrices(card.id, data);
  } catch {
    return null;
  }
}

async function savePrices(cardId: string, data: any): Promise<PriceResult> {
  const low = data?.priceFrom ? toCzk(data.priceFrom, "EUR") : null;
  const avg = data?.averagePrice ? toCzk(data.averagePrice, "EUR") : null;
  const trend = data?.trendPrice ? toCzk(data.trendPrice, "EUR") : null;

  await prisma.databaseCard.update({
    where: { id: cardId },
    data: {
      priceCardmarketLow: low,
      priceCardmarketAvg: avg,
      priceCardmarketTrend: trend,
      pricesUpdatedAt: new Date(),
    },
  });

  await prisma.cardPriceSnapshot.create({
    data: {
      cardId, source: "cardmarket", currency: "CZK",
      lowPrice: low, avgPrice: avg, trendPrice: trend,
    },
  });

  return { low, avg, trend };
}

async function savePricesFromArticles(cardId: string, articles: any[]): Promise<PriceResult> {
  const prices = articles
    .filter((a: any) => a.price)
    .map((a: any) => toCzk(parseFloat(a.price), "EUR"));

  if (prices.length === 0) return { low: null, avg: null, trend: null };

  const low = Math.min(...prices);
  const avg = Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100;
  const sorted = [...prices].sort((a, b) => a - b);
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];

  await prisma.databaseCard.update({
    where: { id: cardId },
    data: {
      priceCardmarketLow: low,
      priceCardmarketAvg: avg,
      priceCardmarketTrend: median,
      pricesUpdatedAt: new Date(),
    },
  });

  await prisma.cardPriceSnapshot.create({
    data: {
      cardId, source: "cardmarket", currency: "CZK",
      lowPrice: low, avgPrice: avg, trendPrice: median,
    },
  });

  return { low, avg, trend: median };
}

function extractId(url: string): string {
  const match = url.match(/\/(\d+)\/?$/);
  return match ? match[1] : "";
}
