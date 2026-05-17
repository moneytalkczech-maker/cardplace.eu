import axios from "axios";
import prisma from "../utils/prisma";
import { toCzk } from "../utils/currencyConverter";
import logger from "../utils/logger";

const EBAY_APP_ID = process.env.EBAY_APP_ID || "";

export interface EbayPriceResult {
  avg: number | null;
  median: number | null;
  lastSold: number | null;
}

export async function updateEbayPrices(cardId: string): Promise<EbayPriceResult | null> {
  const card = await prisma.databaseCard.findUnique({ where: { id: cardId } });
  if (!card) return null;

  const query = card.ebaySearchQuery || `${card.name} ${card.cardNumber || ""} ${card.rarity || ""}`;

  try {
    const url = `https://svcs.ebay.com/services/search/FindingService/v1`;
    const { data } = await axios.get(url, {
      params: {
        "OPERATION-NAME": "findCompletedItems",
        "SERVICE-VERSION": "1.0.0",
        "SECURITY-APPNAME": EBAY_APP_ID,
        "GLOBAL-ID": "EBAY-US",
        "RESPONSE-DATA-FORMAT": "JSON",
        "keywords": query,
        "itemFilter(0).name": "SoldItemsOnly",
        "itemFilter(0).value": "true",
        "paginationInput.entriesPerPage": 25,
        "sortOrder": "EndTimeSoonest",
      },
      timeout: 8000,
    });

    const items = data?.findCompletedItemsResponse?.[0]?.searchResult?.[0]?.item || [];
    if (items.length === 0) return null;

    const prices = items
      .map((i: any) => parseFloat(i.sellingStatus?.[0]?.currentPrice?.[0]?.__value__ || "0"))
      .filter((p: number) => p > 0);

    if (prices.length === 0) return null;

    const pricesCzk = await Promise.all(prices.map((p: number) => toCzk(p, "USD")));
    const avg = Math.round((pricesCzk.reduce((a: number, b: number) => a + b, 0) / pricesCzk.length) * 100) / 100;
    const sorted = [...pricesCzk].sort((a: number, b: number) => a - b);
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];
    const lastSold = pricesCzk[0];

    await prisma.databaseCard.update({
      where: { id: cardId },
      data: {
        priceEbayAvg: avg,
        priceEbayMedian: median,
        priceEbayLastSold: lastSold,
        pricesUpdatedAt: new Date(),
      },
    });

    await prisma.cardPriceSnapshot.create({
      data: {
        cardId, source: "ebay", currency: "CZK",
        avgPrice: avg, medianPrice: median, lastSoldPrice: lastSold,
      },
    });

    return { avg, median, lastSold };
  } catch {
    return null;
  }
}
