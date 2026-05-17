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
  if (req.userRole?.toLowerCase() !== "admin") throw new AppError(403, "Admin only");

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
  if (req.userRole?.toLowerCase() !== "admin") throw new AppError(403, "Admin only");

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
  if (req.userRole?.toLowerCase() !== "admin") throw new AppError(403, "Admin only");

  const setId = req.params.id as string;
  await prisma.cardSet.delete({ where: { id: setId } });
  logger.info({ setId }, "Card set deleted by admin");
  res.json({ success: true });
}

export async function importCsv(req: AuthRequest, res: Response) {
  if (req.userRole?.toLowerCase() !== "admin") throw new AppError(403, "Admin only");

  const { setId, cards } = req.body;

  const set = await prisma.cardSet.findUnique({ where: { id: setId } });
  if (!set) throw new AppError(404, "Set not found");

  const cardData = cards.map((c: Record<string, any>) => ({
    setId,
    name: c.name,
    slug: slugify(`${c.cardNumber || ""}-${c.name}`),
    cardNumber: c.cardNumber || null,
    playerName: c.playerName || null,
    team: c.team || null,
    rarity: c.rarity || null,
    parallel: c.parallel || null,
    type: c.type || null,
    imageUrl: c.imageUrl || null,
    description: c.description || null,
    cardmarketUrl: c.cardmarketUrl || null,
    ebaySearchQuery: c.ebaySearchQuery || null,
  }));

  // Batch create cards
  let imported = 0;
  try {
    const result = await prisma.databaseCard.createMany({
      data: cardData,
    });
    imported = result.count;
  } catch {
    // Fallback: create one-by-one on constraint violation (e.g. duplicate slug)
    for (const c of cardData) {
      try {
        await prisma.databaseCard.create({ data: c });
        imported++;
      } catch { /* skip duplicates */ }
    }
  }

  logger.info({ setId, imported }, "Cards imported");
  res.json({ imported });
}
