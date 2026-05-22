import { Response } from "express";
import prisma from "../utils/prisma";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";

async function saveSnapshot(userId: string) {
  const items = await prisma.collectionItem.findMany({ where: { userId } });
  const totalValue = items.reduce(
    (sum, i) => sum + ((i.marketValue ?? i.purchasePrice ?? 0) * i.quantity),
    0
  );
  const totalCards = items.reduce((sum, i) => sum + i.quantity, 0);
  await prisma.collectionValueSnapshot.create({
    data: { userId, totalValue, totalCards, uniqueCards: items.length },
  });
}

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
  const totalValue = items.reduce(
    (sum, i) => sum + ((i.marketValue ?? i.purchasePrice ?? 0) * i.quantity),
    0
  );
  const purchaseValue = items.reduce(
    (sum, i) => sum + ((i.purchasePrice ?? 0) * i.quantity),
    0
  );
  const totalCards = items.reduce((sum, i) => sum + i.quantity, 0);
  res.json({
    totalValue,
    purchaseValue,
    totalCards,
    uniqueCards: items.length,
    gainLoss: totalValue - purchaseValue,
  });
}

export async function getValueSnapshots(req: AuthRequest, res: Response) {
  const snapshots = await prisma.collectionValueSnapshot.findMany({
    where: { userId: req.params.userId as string },
    orderBy: { createdAt: "asc" },
    take: 30,
  });
  res.json(snapshots);
}

export async function addItem(req: AuthRequest, res: Response) {
  const {
    cardId, cardName, cardSet, cardRarity, cardImage,
    quantity, purchasePrice, condition, notes, category, marketValue,
  } = req.body;
  const item = await prisma.collectionItem.upsert({
    where: { userId_cardId: { userId: req.userId!, cardId } },
    update: { quantity: { increment: quantity || 1 } },
    create: {
      userId: req.userId!,
      cardId,
      cardName,
      cardSet: cardSet || "",
      cardRarity,
      cardImage,
      quantity: quantity || 1,
      purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
      marketValue: marketValue ? parseFloat(marketValue) : undefined,
      condition: condition || "NM",
      notes: notes || undefined,
      category: category || undefined,
    },
  });
  await saveSnapshot(req.userId!);
  res.json(item);
}

export async function updateItem(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  const item = await prisma.collectionItem.findUnique({ where: { id } });
  if (!item || item.userId !== req.userId) throw new AppError(403, "Not authorized");

  const { quantity, condition, notes, marketValue, purchasePrice } = req.body;

  if (quantity !== undefined && quantity <= 0) {
    await prisma.collectionItem.delete({ where: { id } });
    await saveSnapshot(req.userId!);
    res.json({ deleted: true });
    return;
  }

  const updated = await prisma.collectionItem.update({
    where: { id },
    data: {
      ...(quantity !== undefined && { quantity }),
      ...(condition !== undefined && { condition }),
      ...(notes !== undefined && { notes }),
      ...(marketValue !== undefined && { marketValue: parseFloat(marketValue) }),
      ...(purchasePrice !== undefined && { purchasePrice: parseFloat(purchasePrice) }),
    },
  });
  await saveSnapshot(req.userId!);
  res.json(updated);
}

export async function removeItem(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  const item = await prisma.collectionItem.findUnique({ where: { id } });
  if (!item || item.userId !== req.userId) throw new AppError(403, "Not authorized");
  await prisma.collectionItem.delete({ where: { id } });
  await saveSnapshot(req.userId!);
  res.json({ deleted: true });
}

export async function refreshPrices(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const items = await prisma.collectionItem.findMany({ where: { userId } });

  let updated = 0;
  for (const item of items) {
    // Look up market price from DatabaseCard by name match
    const dbCard = await prisma.databaseCard.findFirst({
      where: { name: { contains: item.cardName } },
      select: { priceCardmarketAvg: true, priceEbayAvg: true },
    });

    const newPrice = dbCard?.priceCardmarketAvg ?? dbCard?.priceEbayAvg;
    if (newPrice && newPrice !== item.marketValue) {
      await prisma.collectionItem.update({
        where: { id: item.id },
        data: { marketValue: newPrice },
      });
      updated++;
    }
  }

  if (updated > 0) await saveSnapshot(userId);
  res.json({ updated, total: items.length });
}

export async function exportCsv(req: AuthRequest, res: Response) {
  const userId = req.params.userId as string;
  const items = await prisma.collectionItem.findMany({
    where: { userId },
    orderBy: { cardName: "asc" },
  });

  const header = "Název,Sada,Rarita,Stav,Počet,Nákupní cena,Tržní hodnota,Kategorie,Poznámky";
  const rows = items.map((i) =>
    [
      `"${i.cardName}"`,
      `"${i.cardSet}"`,
      `"${i.cardRarity || ""}"`,
      `"${i.condition}"`,
      i.quantity,
      i.purchasePrice ?? "",
      i.marketValue ?? "",
      `"${i.category || ""}"`,
      `"${(i.notes || "").replace(/"/g, '""')}"`,
    ].join(",")
  );

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="sbírka-${userId.slice(-6)}.csv"`);
  res.send("﻿" + [header, ...rows].join("\r\n"));
}

export async function exportJson(req: AuthRequest, res: Response) {
  const userId = req.params.userId as string;
  const items = await prisma.collectionItem.findMany({
    where: { userId },
    orderBy: { cardName: "asc" },
  });
  res.setHeader("Content-Disposition", `attachment; filename="sbírka-${userId.slice(-6)}.json"`);
  res.json({ exportedAt: new Date().toISOString(), userId, items });
}
