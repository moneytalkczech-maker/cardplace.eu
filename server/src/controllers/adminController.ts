import { Response } from "express";
import prisma from "../utils/prisma";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import logger from "../utils/logger";

export async function listUsers(_req: AuthRequest, res: Response) {
  const users = await prisma.user.findMany({
    select: {
      id: true, email: true, username: true, role: true,
      trustScore: true, verified: true, totalSales: true, createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(users);
}

export async function updateUserRole(req: AuthRequest, res: Response) {
  const { role } = req.body;
  if (!["USER", "SELLER", "ADMIN"].includes(role)) throw new AppError(400, "Invalid role");
  const user = await prisma.user.update({
    where: { id: req.params.id as string },
    data: { role },
    select: { id: true, email: true, username: true, role: true },
  });
  logger.info({ userId: user.id, newRole: role }, "User role updated by admin");
  res.json(user);
}

export async function toggleUserVerification(req: AuthRequest, res: Response) {
  const user = await prisma.user.findUnique({ where: { id: req.params.id as string } });
  if (!user) throw new AppError(404, "User not found");
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { verified: !user.verified },
    select: { id: true, username: true, verified: true },
  });
  res.json(updated);
}

export async function deleteUser(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  await prisma.bid.deleteMany({ where: { userId: id } });
  await prisma.notification.deleteMany({ where: { userId: id } });
  await prisma.watchlist.deleteMany({ where: { userId: id } });
  await prisma.collectionItem.deleteMany({ where: { userId: id } });
  await prisma.auction.deleteMany({ where: { userId: id } });
  await prisma.user.delete({ where: { id } });
  logger.info({ userId: id }, "User deleted by admin");
  res.json({ success: true });
}

export async function listAuctions(_req: AuthRequest, res: Response) {
  const auctions = await prisma.auction.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, username: true } },
      _count: { select: { bids: true } },
    },
    take: 100,
  });
  res.json(auctions);
}

export async function cancelAuction(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  const auction = await prisma.auction.findUnique({ where: { id } });
  if (!auction) throw new AppError(404, "Auction not found");
  await prisma.auction.update({ where: { id }, data: { status: "CANCELLED" } });
  logger.info({ auctionId: id }, "Auction cancelled by admin");
  res.json({ success: true });
}

export async function getStats(_req: AuthRequest, res: Response) {
  const [users, auctions, bids, transactions, collections] = await Promise.all([
    prisma.user.count(),
    prisma.auction.count(),
    prisma.bid.count(),
    prisma.transaction.count(),
    prisma.collectionItem.count(),
  ]);
  res.json({ users, auctions, bids, transactions, collections });
}
