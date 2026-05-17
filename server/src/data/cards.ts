import A1 from "../assets/cards/A1.json";
import A1a from "../assets/cards/A1a.json";
import A2 from "../assets/cards/A2.json";
import A2a from "../assets/cards/A2a.json";
import PA from "../assets/cards/P-A.json";

interface CardEntry {
  id: string;
  name: string;
  image: string;
  rarity: string;
  set_details: string;
}

const EXPANSION_NAMES: Record<string, string> = {
  A1: "Genetic Apex",
  A1a: "Mythical Island",
  A2: "Space-Time Smackdown",
  A2a: "Triumphant Light",
  "P-A": "Promo-A",
};

interface CardData {
  name: string;
  setCode: string;
  setName: string;
  rarity: string;
  cardNumber: string;
  imageUrl: string;
}

function buildCards(data: CardEntry[], setCode: string): CardData[] {
  return data.map((c) => ({
    name: c.name,
    setCode,
    setName: EXPANSION_NAMES[setCode] || setCode,
    rarity: c.rarity,
    cardNumber: `${setCode}-${c.id}`,
    imageUrl: "", // 🔒 Obrázky nejsou dostupné – používají se placeholders
  }));
}

const a1 = buildCards(A1 as unknown as CardEntry[], "A1");
const a1a = buildCards(A1a as unknown as CardEntry[], "A1a");
const a2 = buildCards(A2 as unknown as CardEntry[], "A2");
const a2a = buildCards(A2a as unknown as CardEntry[], "A2a");
const pa = buildCards(PA as unknown as CardEntry[], "P-A");

export const ALL_SERVER_CARDS: CardData[] = [...a1, ...a1a, ...a2, ...a2a, ...pa];

export function searchServerCards(query: string): CardData[] {
  const q = query.toLowerCase();
  return ALL_SERVER_CARDS.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.setName.toLowerCase().includes(q) ||
      c.setCode.toLowerCase().includes(q) ||
      c.cardNumber.toLowerCase().includes(q)
  ).slice(0, 50);
}
