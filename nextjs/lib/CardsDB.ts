import { cards as cardsApi } from "./api";

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

function toMarketCard(c: Record<string, unknown>): MarketCard {
  return {
    id: (c.cardNumber as string) || (c.id as string),
    name: c.name as string,
    setName: c.setName as string,
    setCode: c.setCode as string,
    cardNumber: (c.cardNumber as string) || (c.id as string),
    rarity: c.rarity as string,
    imageUrl: (c.imageUrl as string) || (c.image as string) || "",
  };
}

export async function searchCards(query: string): Promise<MarketCard[]> {
  if (!query) return [];
  const results = await cardsApi.search(query);
  return results.map(toMarketCard);
}

export async function getCardById(id: string): Promise<MarketCard | undefined> {
  const results = await cardsApi.search(id);
  return results.find((c: Record<string, unknown>) => c.cardNumber === id || c.id === id);
}
