import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { ALL_SERVER_CARDS, searchServerCards } from "../data/cards";
import { AppError } from "../middleware/errorHandler";

export async function search(req: Request, res: Response) {
  const { q } = req.query;
  if (!q || typeof q !== "string") {
    res.json(ALL_SERVER_CARDS.slice(0, 50));
    return;
  }
  const results = searchServerCards(q).slice(0, 50);
  res.json(results);
}

export async function sync(_req: Request, res: Response) {
  for (const card of ALL_SERVER_CARDS) {
    await prisma.card.upsert({
      where: { id: card.cardNumber },
      update: {
        name: card.name, setName: card.setName, setCode: card.setCode,
        rarity: card.rarity, imageUrl: card.imageUrl,
      },
      create: {
        id: card.cardNumber, name: card.name, setName: card.setName,
        setCode: card.setCode, rarity: card.rarity, imageUrl: card.imageUrl,
        cardNumber: card.cardNumber,
      },
    });
  }
  res.json({ synced: ALL_SERVER_CARDS.length });
}

export async function sets(_req: Request, res: Response) {
  res.json([
    { code: "A1", name: "Genetic Apex", cardCount: 286 },
    { code: "A1a", name: "Mythical Island", cardCount: 86 },
    { code: "A2", name: "Space-Time Smackdown", cardCount: 207 },
    { code: "A2a", name: "Triumphant Light", cardCount: 96 },
    { code: "P-A", name: "Promo-A", cardCount: 49 },
  ]);
}

/** Odhad ceny karty z historie transakcí */
export async function priceHistory(req: Request, res: Response) {
  const cardName = (req.query.card as string) || "";
  if (!cardName) throw new AppError(400, "Card name required");

  const transactions = await prisma.transaction.findMany({
    where: {
      status: "COMPLETED",
      auction: { card: { name: { contains: cardName } } },
    },
    select: { amount: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  if (transactions.length === 0) {
    res.json({
      estimatedPrice: null,
      lastSoldPrice: null,
      averagePrice: null,
      minPrice: null,
      maxPrice: null,
      transactionCount: 0,
      note: "Zatím žádné dokončené prodeje",
    });
    return;
  }

  const prices = transactions.map((t) => t.amount);
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;

  res.json({
    estimatedPrice: Math.round(avg * 0.95 * 100) / 100, // 95% tržní hodnoty
    lastSoldPrice: prices[0],
    averagePrice: Math.round(avg * 100) / 100,
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
    transactionCount: transactions.length,
    recentTransactions: transactions.slice(0, 10),
  });
}

/** Podobné karty (stejný set, stejná rarita) */
export async function similarCards(req: Request, res: Response) {
  const { cardName, cardSet } = req.query as Record<string, string>;
  if (!cardName && !cardSet) throw new AppError(400, "Card name or set required");

  let similar = ALL_SERVER_CARDS;

  if (cardSet) {
    similar = similar.filter((c) =>
      c.setCode.toLowerCase() === cardSet.toLowerCase(),
    );
  }

  if (cardName) {
    // Najdi kartu, od které hledáme podobné
    const source = ALL_SERVER_CARDS.find(
      (c) => c.name.toLowerCase().includes(cardName.toLowerCase()),
    );
    if (source) {
      // Podle rarity + setu
      similar = similar.filter(
        (c) =>
          c.rarity === source.rarity &&
          c.setCode === source.setCode &&
          c.cardNumber !== source.cardNumber,
      );
    }
  }

  res.json(similar.slice(0, 12));
}
