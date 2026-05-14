import { Response } from "express";
import prisma from "../utils/prisma";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import logger from "../utils/logger";

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// ─── Public ───

export async function listSets(_req: AuthRequest, res: Response) {
  const sets = await prisma.cardSet.findMany({
    orderBy: [{ year: "desc" }, { name: "asc" }],
    include: { _count: { select: { cards: true } } },
  });

  const result = sets.map((s) => ({
    id: s.id, name: s.name, slug: s.slug, category: s.category,
    brand: s.brand, year: s.year, description: s.description,
    imageUrl: s.imageUrl, cardCount: s._count.cards, totalCards: s.totalCards,
  }));

  res.json(result);
}

export async function getSet(req: AuthRequest, res: Response) {
  const setId = req.params.id as string;
  const set = await prisma.cardSet.findUnique({
    where: { id: setId },
    include: {
      cards: {
        orderBy: { cardNumber: "asc" },
        select: {
          id: true, name: true, slug: true, cardNumber: true, playerName: true,
          team: true, rarity: true, parallel: true, imageUrl: true, type: true,
          priceCardmarketAvg: true, priceEbayAvg: true, currency: true,
        },
      },
    },
  });

  if (!set) throw new AppError(404, "Set not found");
  res.json(set);
}

// ─── Admin ───

export async function createSet(req: AuthRequest, res: Response) {
  if (req.userRole !== "ADMIN") throw new AppError(403, "Admin only");

  const { name, category, brand, year, description, imageUrl, totalCards } = req.body;
  const slug = slugify(name);

  const existing = await prisma.cardSet.findUnique({ where: { slug } });
  if (existing) throw new AppError(400, "Set with this name already exists");

  const set = await prisma.cardSet.create({
    data: { name, slug, category, brand, year, description, imageUrl, totalCards: totalCards ? parseInt(totalCards) : null },
  });

  logger.info({ setId: set.id }, "Card set created by admin");
  res.json(set);
}

export async function updateSet(req: AuthRequest, res: Response) {
  if (req.userRole !== "ADMIN") throw new AppError(403, "Admin only");

  const { name, category, brand, year, description, imageUrl, totalCards } = req.body;
  const setId = req.params.id as string;
  const data: Record<string, any> = {};

  if (name !== undefined) { data.name = name; data.slug = slugify(name); }
  if (category !== undefined) data.category = category;
  if (brand !== undefined) data.brand = brand;
  if (year !== undefined) data.year = year;
  if (description !== undefined) data.description = description;
  if (imageUrl !== undefined) data.imageUrl = imageUrl;
  if (totalCards !== undefined) data.totalCards = parseInt(totalCards);

  const set = await prisma.cardSet.update({ where: { id: setId }, data });
  logger.info({ setId: set.id }, "Card set updated by admin");
  res.json(set);
}

export async function deleteSet(req: AuthRequest, res: Response) {
  if (req.userRole !== "ADMIN") throw new AppError(403, "Admin only");

  const setId = req.params.id as string;
  await prisma.cardSet.delete({ where: { id: setId } });
  logger.info({ setId }, "Card set deleted by admin");
  res.json({ success: true });
}

export async function importCsv(req: AuthRequest, res: Response) {
  if (req.userRole !== "ADMIN") throw new AppError(403, "Admin only");

  const { setId, cards } = req.body;

  const set = await prisma.cardSet.findUnique({ where: { id: setId } });
  if (!set) throw new AppError(404, "Set not found");

  let imported = 0;
  for (const c of cards) {
    const slug = slugify(`${c.cardNumber || ""}-${c.name}`);
    try {
      await prisma.databaseCard.create({
        data: {
          setId, name: c.name, slug,
          cardNumber: c.cardNumber, playerName: c.playerName,
          team: c.team, rarity: c.rarity, parallel: c.parallel,
          type: c.type, imageUrl: c.imageUrl, description: c.description,
          cardmarketUrl: c.cardmarketUrl, ebaySearchQuery: c.ebaySearchQuery,
        },
      });
      imported++;
    } catch {
      // skip duplicates
    }
  }

  logger.info({ setId, imported }, "Cards imported");
  res.json({ imported });
}
