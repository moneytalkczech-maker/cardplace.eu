import axios from "axios";
import { ALL_SERVER_CARDS, searchServerCards } from "../data/cards";

// ─── Typy ───

export type CardCategory = "pokemon" | "magic" | "yugioh" | "sports" | "other";

export interface CardLookupResult {
  name: string;
  setCode: string;
  setName: string;
  category: CardCategory;
  rarity: string;
  cardNumber: string;
  imageUrl: string;
  source: "local" | "pokemontcg" | "scryfall" | "ygoprodeck";
}

// ─── API endpointy ───

const POKEMON_API = "https://api.pokemontcg.io/v2";
const POKEMON_KEY = process.env.POKEMON_TCG_API_KEY || "";

const SCRYFALL_API = "https://api.scryfall.com";

const YGOPRO_API = "https://db.ygoprodeck.com/api/v7";

// ─── SPORTS: Lokální databáze známých sportovních karet ───

interface SportsCard {
  name: string;
  set: string;
  year: number;
  sport: string;
  team?: string;
  rarity?: string;
}

const SPORTS_CARDS: SportsCard[] = [
  // NBA
  { name: "Michael Jordan", set: "1986-87 Fleer", year: 1986, sport: "NBA", team: "Chicago Bulls", rarity: "⭐⭐⭐⭐⭐" },
  { name: "LeBron James", set: "2003-04 Topps Chrome", year: 2003, sport: "NBA", team: "Cleveland Cavaliers", rarity: "⭐⭐⭐⭐⭐" },
  { name: "Stephen Curry", set: "2009-10 Panini", year: 2009, sport: "NBA", team: "Golden State Warriors", rarity: "⭐⭐⭐⭐" },
  { name: "Kobe Bryant", set: "1996-97 Topps", year: 1996, sport: "NBA", team: "LA Lakers", rarity: "⭐⭐⭐⭐⭐" },
  { name: "Shaquille O'Neal", set: "1992-93 Topps", year: 1992, sport: "NBA", team: "Orlando Magic", rarity: "⭐⭐⭐⭐" },
  { name: "Kevin Durant", set: "2007-08 Topps", year: 2007, sport: "NBA", team: "Oklahoma City Thunder", rarity: "⭐⭐⭐⭐" },
  { name: "Giannis Antetokounmpo", set: "2013-14 Panini", year: 2013, sport: "NBA", team: "Milwaukee Bucks", rarity: "⭐⭐⭐⭐" },
  { name: "Luka Dončić", set: "2018-19 Panini", year: 2018, sport: "NBA", team: "Dallas Mavericks", rarity: "⭐⭐⭐⭐" },
  // NFL
  { name: "Tom Brady", set: "2000 Playoff Contenders", year: 2000, sport: "NFL", team: "New England Patriots", rarity: "⭐⭐⭐⭐⭐" },
  { name: "Patrick Mahomes", set: "2017 Panini", year: 2017, sport: "NFL", team: "Kansas City Chiefs", rarity: "⭐⭐⭐⭐" },
  { name: "Peyton Manning", set: "1998 Playoff Contenders", year: 1998, sport: "NFL", team: "Indianapolis Colts", rarity: "⭐⭐⭐⭐" },
  { name: "Joe Montana", set: "1981 Topps", year: 1981, sport: "NFL", team: "San Francisco 49ers", rarity: "⭐⭐⭐⭐" },
  { name: "Jerry Rice", set: "1985 Topps", year: 1985, sport: "NFL", team: "San Francisco 49ers", rarity: "⭐⭐⭐⭐" },
  // MLB
  { name: "Mike Trout", set: "2009 Bowman Chrome", year: 2009, sport: "MLB", team: "Los Angeles Angels", rarity: "⭐⭐⭐⭐⭐" },
  { name: "Shohei Ohtani", set: "2018 Topps", year: 2018, sport: "MLB", team: "Los Angeles Angels", rarity: "⭐⭐⭐⭐" },
  { name: "Aaron Judge", set: "2013 Bowman Chrome", year: 2013, sport: "MLB", team: "New York Yankees", rarity: "⭐⭐⭐⭐" },
  { name: "Ken Griffey Jr.", set: "1989 Upper Deck", year: 1989, sport: "MLB", team: "Seattle Mariners", rarity: "⭐⭐⭐⭐" },
  // Fotbal / Soccer
  { name: "Lionel Messi", set: "2004-05 Panini Mega Cracks", year: 2004, sport: "Fotbal", team: "FC Barcelona", rarity: "⭐⭐⭐⭐⭐" },
  { name: "Cristiano Ronaldo", set: "2002-03 Panini", year: 2002, sport: "Fotbal", team: "Sporting Lisbon", rarity: "⭐⭐⭐⭐⭐" },
  { name: "Neymar Jr", set: "2009 Panini", year: 2009, sport: "Fotbal", team: "Santos", rarity: "⭐⭐⭐⭐" },
  { name: "Kylian Mbappé", set: "2015-16 Panini", year: 2015, sport: "Fotbal", team: "AS Monaco", rarity: "⭐⭐⭐⭐" },
  { name: "Erling Haaland", set: "2019-20 Panini", year: 2019, sport: "Fotbal", team: "Borussia Dortmund", rarity: "⭐⭐⭐⭐" },
  // Čeští sportovci
  { name: "Jaromír Jágr", set: "1990-91 Topps", year: 1990, sport: "NHL", team: "Pittsburgh Penguins", rarity: "⭐⭐⭐⭐" },
  { name: "Dominik Hašek", set: "1990-91 Topps", year: 1990, sport: "NHL", team: "Chicago Blackhawks", rarity: "⭐⭐⭐⭐" },
  { name: "David Pastrňák", set: "2014-15 Upper Deck", year: 2014, sport: "NHL", team: "Boston Bruins", rarity: "⭐⭐⭐" },
];

// ─── Pokémon TCG API ───

async function fetchPokemon(query: string): Promise<CardLookupResult[]> {
  try {
    const headers: Record<string, string> = {};
    if (POKEMON_KEY) headers["X-Api-Key"] = POKEMON_KEY;

    const { data } = await axios.get(`${POKEMON_API}/cards`, {
      headers,
      params: { q: `name:"*${query}*"`, pageSize: 10, orderBy: "-set.releaseDate" },
      timeout: 5000,
    });

    return (data.data || []).map((c: any) => ({
      name: c.name,
      setCode: c.set?.id || "",
      setName: c.set?.name || "",
      category: "pokemon" as CardCategory,
      rarity: c.rarity || "",
      cardNumber: `${c.set?.id || ""}-${c.number || ""}`,
      imageUrl: "", // 🔒 Obrázky z API neukládáme – používají se placeholders
      source: "pokemontcg" as const,
    }));
  } catch {
    return [];
  }
}

// ─── Scryfall API (Magic: The Gathering) ───

async function fetchMagic(query: string): Promise<CardLookupResult[]> {
  try {
    const { data } = await axios.get(`${SCRYFALL_API}/cards/search`, {
      params: { q: query, order: "edhrec", page: 1 },
      timeout: 5000,
    });

    return (data.data || []).slice(0, 10).map((c: any) => ({
      name: c.name,
      setCode: c.set,
      setName: c.set_name,
      category: "magic" as CardCategory,
      rarity: c.rarity || "",
      cardNumber: `${c.set}-${c.collector_number}`,
      imageUrl: "", // 🔒 Placeholder
      source: "scryfall" as const,
    }));
  } catch {
    return [];
  }
}

// ─── YGOPRODeck API (Yu-Gi-Oh!) ───

async function fetchYugioh(query: string): Promise<CardLookupResult[]> {
  try {
    const { data } = await axios.get(`${YGOPRO_API}/cardinfo.php`, {
      params: { fname: query, num: 10, offset: 0 },
      timeout: 5000,
    });

    return (data.data || []).slice(0, 10).map((c: any) => ({
      name: c.name,
      setCode: c.archetype || "",
      setName: `${c.type}${c.race ? ` - ${c.race}` : ""}`,
      category: "yugioh" as CardCategory,
      rarity: c.attribute || "",
      cardNumber: String(c.id),
      imageUrl: "", // 🔒 Placeholder
      source: "ygoprodeck" as const,
    }));
  } catch {
    return [];
  }
}

// ─── Sportovní karty (lokální DB) ───

function searchSports(query: string): CardLookupResult[] {
  const q = query.toLowerCase();
  const results = SPORTS_CARDS.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.sport.toLowerCase().includes(q) ||
      c.team?.toLowerCase().includes(q) ||
      c.set.toLowerCase().includes(q),
  ).slice(0, 10);

  return results.map((c) => ({
    name: c.name,
    setCode: c.sport,
    setName: c.set,
    category: "sports" as CardCategory,
    rarity: c.rarity || "",
    cardNumber: `${c.sport}-${c.name.replace(/\s+/g, "-")}`,
    imageUrl: "",
    source: "local" as const,
  }));
}

// ─── Detekce kategorie z OCR textu ───

export function detectCategory(text: string): CardCategory {
  const lower = text.toLowerCase();
  if (lower.includes("pokémon") || lower.includes("pokemon")) return "pokemon";
  if (lower.includes("magic") || lower.includes("mtg") || lower.includes("wizard")) return "magic";
  if (lower.includes("yugioh") || lower.includes("yu-gi-oh")) return "yugioh";
  if (
    lower.includes("nba") || lower.includes("nfl") || lower.includes("mlb") ||
    lower.includes("nhl") || lower.includes("fotbal") || lower.includes("soccer") ||
    lower.includes("basketball") || lower.includes("baseball")
  ) return "sports";
  return "other";
}

// ─── Hlavní vyhledávání ───

export async function searchCards(
  query: string,
  category?: CardCategory,
): Promise<CardLookupResult[]> {
  if (!query || query.length < 1) return [];

  const results: CardLookupResult[] = [];

  // 1. Lokální Pokémon data
  const local = searchServerCards(query);
  results.push(...local.map((c) => ({
    ...c,
    category: "pokemon" as CardCategory,
    source: "local" as const,
  })));

  // 2. API volání podle detekované nebo zvolené kategorie
  const cat = category || detectCategory(query);

  if (cat === "pokemon") {
    const pokemon = await fetchPokemon(query);
    results.push(...pokemon);
  }
  if (cat === "magic") {
    const magic = await fetchMagic(query);
    results.push(...magic);
  }
  if (cat === "yugioh") {
    const yugi = await fetchYugioh(query);
    results.push(...yugi);
  }
  if (cat === "sports" || cat === "other") {
    const sports = searchSports(query);
    results.push(...sports);
  }

  // Dedup podle cardNumber
  const seen = new Set<string>();
  return results.filter((r) => {
    if (seen.has(r.cardNumber)) return false;
    seen.add(r.cardNumber);
    return true;
  }).slice(0, 30);
}

/** Najdi konkrétní kartu */
export async function findCard(cardId: string): Promise<CardLookupResult | null> {
  if (!cardId) return null;

  // Lokální Pokémon
  const local = ALL_SERVER_CARDS.find((c) => c.cardNumber === cardId || (c as any).id === cardId);
  if (local) return { ...local, category: "pokemon", source: "local" };

  // Sport
  const sportsCard = SPORTS_CARDS.find((c) => `${c.sport}-${c.name.replace(/\s+/g, "-")}` === cardId);
  if (sportsCard) {
    return {
      name: sportsCard.name,
      setCode: sportsCard.sport,
      setName: sportsCard.set,
      category: "sports",
      rarity: sportsCard.rarity || "",
      cardNumber: cardId,
      imageUrl: "",
      source: "local",
    };
  }

  return null;
}

/** Seznam setů + kategorií */
export async function getSets() {
  return [
    { code: "A1", name: "Genetic Apex", category: "pokemon", cardCount: 286 },
    { code: "A1a", name: "Mythical Island", category: "pokemon", cardCount: 86 },
    { code: "A2", name: "Space-Time Smackdown", category: "pokemon", cardCount: 207 },
    { code: "A2a", name: "Triumphant Light", category: "pokemon", cardCount: 96 },
    { code: "P-A", name: "Promo-A", category: "pokemon", cardCount: 49 },
    { code: "NBA", name: "Basketball (NBA)", category: "sports", cardCount: 150 },
    { code: "NFL", name: "Football (NFL)", category: "sports", cardCount: 100 },
    { code: "MLB", name: "Baseball (MLB)", category: "sports", cardCount: 100 },
    { code: "Fotbal", name: "Soccer (Fotbal)", category: "sports", cardCount: 80 },
    { code: "NHL", name: "Hockey (NHL)", category: "sports", cardCount: 50 },
  ];
}
