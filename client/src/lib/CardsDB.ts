import { cards as cardsApi } from "../services/api";

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
    setName: c.setName,
    setCode: c.setCode,
    cardNumber: c.cardNumber || c.id,
    rarity: c.rarity,
    imageUrl: c.imageUrl || c.image || "",
  };
}

export async function searchCards(query: string): Promise<MarketCard[]> {
  if (!query) return [];
  const results = await cardsApi.search(query);
  return results.map(toMarketCard);
}

export async function getCardById(id: string): Promise<MarketCard | undefined> {
  const results = await cardsApi.search(id);
  return results.find((c: any) => c.cardNumber === id || c.id === id);
}