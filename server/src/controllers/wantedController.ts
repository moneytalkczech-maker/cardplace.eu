import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";

export async function list(_req: Request, res: Response) {
  const wanted = await prisma.wantedCard.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, username: true, trustScore: true } } },
  });
  res.json(wanted);
}

export async function create(req: AuthRequest, res: Response) {
  const { cardId, cardName, cardSet, description, maxPrice } = req.body;
  const wanted = await prisma.wantedCard.create({
    data: {
      userId: req.userId!, cardId, cardName, cardSet, description,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    },
  });

  const matches = await prisma.auction.findMany({
    where: { cardId, status: "ACTIVE", userId: { not: req.userId } },
    select: { userId: true, title: true },
  });
  if (matches.length > 0) {
    await prisma.notification.createMany({
      data: matches.map((match) => ({
        message: `Někdo hledá "${cardName}" — máš ji v aukci "${match.title}"`,
        type: "WANTED",
        link: "/wanted",
        userId: match.userId,
      })),
    });
  }

  res.json(wanted);
}

export async function remove(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  const wanted = await prisma.wantedCard.findUnique({ where: { id } });
  if (!wanted) throw new AppError(404, "Not found");
  if (wanted.userId !== req.userId) throw new AppError(403, "Not authorized");
  await prisma.wantedCard.update({ where: { id }, data: { status: "FULFILLED" } });
  res.json({ success: true });
}
