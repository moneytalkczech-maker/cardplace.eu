import { cards as cardsApi } from "../services/api";
import api from "../services/api";

export interface MarketCard {
  id: string;
  name: string;
  setName: string;
  setCode: string;
  cardNumber: string;
  rarity: string;
  imageUrl: string;
  estimatedPrice?: number;
}

function toMarketCard(c: any): MarketCard {
  return {
    id: c.cardNumber || c.id,
    name: c.name,
    setName: c.setName || c.set?.name || "",
    setCode: c.setCode || c.set?.slug || "",
    cardNumber: c.cardNumber || c.id,
    rarity: c.rarity || "",
    imageUrl: c.imageUrl || c.image || "",
    estimatedPrice: c.priceCardmarketAvg ?? c.priceEbayAvg ?? c.estimatedPrice,
  };
}

function toDatabaseCard(c: any): MarketCard {
  return {
    id: c.id,
    name: c.name,
    setName: c.set?.name || c.setName || "",
    setCode: c.set?.slug || c.setCode || "",
    cardNumber: c.cardNumber || c.id,
    rarity: c.rarity || "",
    imageUrl: c.imageUrl || "",
    estimatedPrice: c.priceCardmarketAvg ?? c.priceEbayAvg,
  };
}

export async function searchCards(query: string): Promise<MarketCard[]> {
  if (!query) return [];

  const [externalResults, dbResults] = await Promise.allSettled([
    cardsApi.search(query),
    api.get("/database-cards", { params: { q: query, limit: 10 } }).then((r) => r.data.cards ?? []),
  ]);

  const external: MarketCard[] =
    externalResults.status === "fulfilled"
      ? externalResults.value.map(toMarketCard)
      : [];

  const db: MarketCard[] =
    dbResults.status === "fulfilled"
      ? (dbResults.value as any[]).map(toDatabaseCard)
      : [];

  // Merge: DB cards (with real prices) first, then external, dedup by name+set
  const seen = new Set<string>();
  const merged: MarketCard[] = [];

  for (const card of [...db, ...external]) {
    const key = `${card.name.toLowerCase()}|${card.setName.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(card);
    }
  }

  return merged.slice(0, 30);
}

export async function getCardById(id: string): Promise<MarketCard | undefined> {
  const results = await cardsApi.search(id);
  return results.find((c: any) => c.cardNumber === id || c.id === id);
}
