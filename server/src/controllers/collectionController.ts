import { Response } from "express";
import prisma from "../utils/prisma";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";

export async function getUserCollection(req: AuthRequest, res: Response) {
  const items = await prisma.collectionItem.findMany({
    where: { userId: req.params.userId as string },
    orderBy: { createdAt: "desc" },
  });
  res.json(items);
}

export async function getCollectionValue(req: AuthRequest, res: Response) {
  const items = await prisma.collectionItem.findMany({
    where: { userId: req.params.userId as string },
  });
  const totalValue = items.reduce((sum, i) => sum + (i.purchasePrice || 0) * i.quantity, 0);
  const totalCards = items.reduce((sum, i) => sum + i.quantity, 0);
  res.json({ totalValue, totalCards, uniqueCards: items.length });
}

export async function addItem(req: AuthRequest, res: Response) {
  const { cardId, cardName, cardSet, cardRarity, cardImage, quantity, purchasePrice, condition } = req.body;
  const item = await prisma.collectionItem.upsert({
    where: { userId_cardId: { userId: req.userId!, cardId } },
    update: { quantity: { increment: quantity || 1 } },
    create: {
      userId: req.userId!, cardId, cardName, cardSet, cardRarity, cardImage,
      quantity: quantity || 1,
      purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
      condition: condition || "NM",
    },
  });
  res.json(item);
}

export async function updateItem(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  const item = await prisma.collectionItem.findUnique({ where: { id } });
  if (!item || item.userId !== req.userId) throw new AppError(403, "Not authorized");

  const { quantity } = req.body;
  if (quantity <= 0) {
    await prisma.collectionItem.delete({ where: { id } });
    res.json({ deleted: true });
    return;
  }
  const updated = await prisma.collectionItem.update({ where: { id }, data: { quantity } });
  res.json(updated);
}

export async function removeItem(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  const item = await prisma.collectionItem.findUnique({ where: { id } });
  if (!item || item.userId !== req.userId) throw new AppError(403, "Not authorized");
  await prisma.collectionItem.delete({ where: { id } });
  res.json({ deleted: true });
}
