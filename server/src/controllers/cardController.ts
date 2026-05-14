import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { ALL_SERVER_CARDS, searchServerCards } from "../data/cards";

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
