import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { AppError } from "../middleware/errorHandler";
import { searchCards, findCard, getSets, detectCategory } from "../utils/cardLookup";

export async function search(req: Request, res: Response) {
  const { q, category } = req.query;
  const query = (q as string) || "";
  const cat = (category as string) || undefined;

  const results = await searchCards(
    query,
    cat as any,
  );
  res.json(results);
}

export async function sync(_req: Request, res: Response) {
  const allCards = await searchCards("", "pokemon");
  let synced = 0;
  for (const card of allCards) {
    await prisma.card.upsert({
      where: { id: card.cardNumber },
      update: {
        name: card.name,
        setName: card.setName,
        setCode: card.setCode,
        category: card.category,
        rarity: card.rarity,
        imageUrl: card.imageUrl,
      },
      create: {
        id: card.cardNumber,
        name: card.name,
        setName: card.setName,
        setCode: card.setCode,
        category: card.category,
        rarity: card.rarity,
        imageUrl: card.imageUrl,
        cardNumber: card.cardNumber,
      },
    });
    synced++;
  }
  res.json({ synced });
}

export async function sets(_req: Request, res: Response) {
  const allSets = await getSets();
  res.json(allSets);
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
    estimatedPrice: Math.round(avg * 0.95 * 100) / 100,
    lastSoldPrice: prices[0],
    averagePrice: Math.round(avg * 100) / 100,
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
    transactionCount: transactions.length,
    recentTransactions: transactions.slice(0, 10),
  });
}

/** Podobné karty */
export async function similarCards(req: Request, res: Response) {
  const { cardName } = req.query as Record<string, string>;
  if (!cardName) throw new AppError(400, "Card name required");

  const cards = await searchCards(cardName);
  const similar = cards.filter(
    (c) => c.name.toLowerCase() !== cardName.toLowerCase(),
  );

  res.json(similar.slice(0, 12));
}

/** Detekce kategorie z názvu */
export async function detect(req: Request, res: Response) {
  const { text } = req.query as Record<string, string>;
  if (!text) throw new AppError(400, "Text required");

  const category = detectCategory(text);
  res.json({ category, detected: category !== "other" });
}
