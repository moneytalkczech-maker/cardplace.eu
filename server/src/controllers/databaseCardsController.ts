import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { updateCardPrices } from "../services/cardmarketPrice.service";
import { updateEbayPrices } from "../services/ebayPrice.service";
import { runPriceUpdate } from "../jobs/updateCardPrices.job";
import logger from "../utils/logger";

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// ─── Public ───

export async function searchCards(req: Request, res: Response) {
  const q = req.query.q as string | undefined;
  const category = req.query.category as string | undefined;
  const setId = req.query.setId as string | undefined;
  const rarity = req.query.rarity as string | undefined;
  const playerName = req.query.playerName as string | undefined;
  const team = req.query.team as string | undefined;
  const page = parseInt((req.query.page as string) || "1") || 1;
  const take = 24;
  const skip = (page - 1) * take;

  const where: any = {};

  if (q) {
    where.OR = [
      { name: { contains: q } },
      { playerName: { contains: q } },
      { cardNumber: { contains: q } },
      { team: { contains: q } },
      { rarity: { contains: q } },
      { parallel: { contains: q } },
    ];
  }
  if (category) where.set = { category };
  if (setId) where.setId = setId;
  if (rarity) where.rarity = rarity;
  if (playerName) where.playerName = { contains: playerName };
  if (team) where.team = { contains: team };

  const [cards, total] = await Promise.all([
    prisma.databaseCard.findMany({
      where,
      orderBy: [{ cardNumber: "asc" }, { name: "asc" }],
      skip,
      take,
      include: {
        set: { select: { id: true, name: true, slug: true, category: true } },
      },
    }),
    prisma.databaseCard.count({ where }),
  ]);

  res.json({
    cards: cards.map((c) => ({
      id: c.id, name: c.name, slug: c.slug, cardNumber: c.cardNumber,
      playerName: c.playerName, team: c.team, rarity: c.rarity,
      parallel: c.parallel, imageUrl: c.imageUrl, type: c.type,
      set: c.set,
      priceCardmarketAvg: c.priceCardmarketAvg,
      priceEbayAvg: c.priceEbayAvg,
    })),
    total,
    page,
    totalPages: Math.ceil(total / take),
  });
}

export async function getCard(req: Request, res: Response) {
  const id = req.params.id as string;
  const card = await prisma.databaseCard.findUnique({
    where: { id },
    include: {
      set: { select: { id: true, name: true, slug: true, category: true, brand: true, year: true } },
      priceSnapshots: { orderBy: { createdAt: "desc" }, take: 30 },
    },
  });

  if (!card) throw new AppError(404, "Card not found");
  res.json(card);
}

// ─── Admin ───

export async function createCard(req: AuthRequest, res: Response) {
  if (req.userRole?.toLowerCase() !== "admin") throw new AppError(403, "Admin only");

  const { setId, name, cardNumber, playerName, team, rarity, parallel, type, imageUrl, description, cardmarketUrl, ebaySearchQuery } = req.body;
  const slug = slugify(`${cardNumber || ""}-${name}`);

  const set = await prisma.cardSet.findUnique({ where: { id: setId } });
  if (!set) throw new AppError(404, "Set not found");

  const card = await prisma.databaseCard.create({
    data: { setId, name, slug, cardNumber, playerName, team, rarity, parallel, type, imageUrl, description, cardmarketUrl, ebaySearchQuery },
  });

  logger.info({ cardId: card.id }, "Card created by admin");
  res.json(card);
}

export async function updateCard(req: AuthRequest, res: Response) {
  if (req.userRole?.toLowerCase() !== "admin") throw new AppError(403, "Admin only");

  const id = req.params.id as string;
  const allowed = ["name", "cardNumber", "playerName", "team", "rarity", "parallel", "type", "imageUrl", "description", "cardmarketUrl", "ebaySearchQuery"];
  const data: Record<string, any> = {};

  for (const key of allowed) {
    if (req.body[key] !== undefined) data[key] = req.body[key];
  }
  if (data.name) data.slug = slugify(`${req.body.cardNumber || ""}-${data.name}`);

  const card = await prisma.databaseCard.update({ where: { id }, data });
  logger.info({ cardId: card.id }, "Card updated by admin");
  res.json(card);
}

export async function deleteCard(req: AuthRequest, res: Response) {
  if (req.userRole?.toLowerCase() !== "admin") throw new AppError(403, "Admin only");

  const id = req.params.id as string;
  await prisma.databaseCard.delete({ where: { id } });
  logger.info({ cardId: id }, "Card deleted by admin");
  res.json({ success: true });
}

// ─── Ceny ───

export async function getPrices(req: Request, res: Response) {
  const id = req.params.id as string;
  const card = await prisma.databaseCard.findUnique({
    where: { id },
    select: {
      priceCardmarketLow: true, priceCardmarketAvg: true, priceCardmarketTrend: true,
      priceEbayAvg: true, priceEbayMedian: true, priceEbayLastSold: true,
      currency: true, pricesUpdatedAt: true,
    },
  });

  if (!card) throw new AppError(404, "Card not found");
  res.json(card);
}

export async function getPriceHistory(req: Request, res: Response) {
  const id = req.params.id as string;
  const snapshots = await prisma.cardPriceSnapshot.findMany({
    where: { cardId: id },
    orderBy: { createdAt: "desc" },
    take: 90,
  });
  res.json(snapshots);
}

export async function refreshPrice(req: AuthRequest, res: Response) {
  if (req.userRole?.toLowerCase() !== "admin") throw new AppError(403, "Admin only");

  const id = req.params.id as string;
  const cardmarketResult = await updateCardPrices(id);
  const ebayResult = await updateEbayPrices(id);

  res.json({ cardmarket: cardmarketResult, ebay: ebayResult });
}

export async function refreshAllPrices(req: AuthRequest, res: Response) {
  if (req.userRole?.toLowerCase() !== "admin") throw new AppError(403, "Admin only");

  runPriceUpdate().catch((err) => logger.error({ err }, "Price update job failed"));
  res.json({ message: "Price update started" });
}
