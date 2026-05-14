import { Response } from "express";
import prisma from "../utils/prisma";
import { AuthRequest } from "../middleware/auth";
import { calculateRank, trustDeltaForTransaction } from "../utils/trust";
import { calculateFee } from "../utils/fees";
import { AppError } from "../middleware/errorHandler";

export async function getProfile(req: AuthRequest, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id as string },
    select: {
      id: true, username: true, avatarUrl: true, trustScore: true,
      verified: true, totalSales: true, createdAt: true,
      _count: { select: { auctions: true, bids: true } },
    },
  }) as any;
  if (!user) throw new AppError(404, "User not found");
  const rank = calculateRank(user.trustScore, user.totalSales);
  res.json({
    id: user.id, username: user.username, avatarUrl: user.avatarUrl,
    trustScore: user.trustScore, verified: user.verified,
    totalSales: user.totalSales, createdAt: user.createdAt,
    auctionCount: user._count.auctions, bidCount: user._count.bids,
    rank: rank.rank, rankLabel: rank.label,
  });
}

export async function getMyAuctions(req: AuthRequest, res: Response) {
  const auctions = await prisma.auction.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, username: true, trustScore: true, verified: true, totalSales: true } },
      _count: { select: { bids: true } },
      card: { select: { name: true, setName: true, imageUrl: true } },
    },
  }) as any;
  const withRank = auctions.map((a: any) => {
    if (a.user) {
      const rank = calculateRank(a.user.trustScore, a.user.totalSales || 0);
      return { ...a, user: { ...a.user, rank: rank.rank } };
    }
    return a;
  });
  res.json(withRank);
}

export async function getMyBids(req: AuthRequest, res: Response) {
  const bids = await prisma.bid.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: "desc" },
    include: {
      auction: {
        select: {
          id: true, title: true, currentPrice: true, endTime: true, status: true,
          imageUrl: true, card: { select: { name: true, imageUrl: true } },
        },
      },
    },
  });
  res.json(bids);
}

export async function getWatchlist(req: AuthRequest, res: Response) {
  const watchlist = await prisma.watchlist.findMany({
    where: { userId: req.userId },
    include: {
      auction: {
        include: {
          user: { select: { id: true, username: true, trustScore: true } },
          card: { select: { name: true, setName: true, rarity: true, imageUrl: true } },
          _count: { select: { bids: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(watchlist);
}

export async function getNotifications(req: AuthRequest, res: Response) {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  res.json(notifications);
}

export async function markNotificationsRead(req: AuthRequest, res: Response) {
  await prisma.notification.updateMany({
    where: { userId: req.userId, read: false },
    data: { read: true },
  });
  res.json({ success: true });
}

export async function markNotificationRead(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification || notification.userId !== req.userId) throw new AppError(403, "Not authorized");
  await prisma.notification.update({ where: { id }, data: { read: true } });
  res.json({ success: true });
}

export async function completeTransaction(req: AuthRequest, res: Response) {
  const { auctionId } = req.body;
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    include: { bids: { orderBy: { amount: "desc" }, take: 1 } },
  }) as any;
  if (!auction) throw new AppError(404, "Auction not found");
  if (auction.userId !== req.userId) throw new AppError(403, "Not your auction");
  if (auction.status !== "ENDED") throw new AppError(400, "Auction not ended");

  const winningBid = auction.bids[0];
  if (!winningBid) throw new AppError(400, "No winning bid");

  const existingTransaction = await prisma.transaction.findUnique({ where: { auctionId } });
  const delta = trustDeltaForTransaction(winningBid.amount);
  const alreadyCompleted = existingTransaction?.status === "COMPLETED";

  // Spočítat fee podle aktuální konfigurace
  const feeResult = await calculateFee(winningBid.amount, auction.userId);

  await prisma.transaction.upsert({
    where: { auctionId },
    update: { status: "COMPLETED" },
    create: {
      amount: winningBid.amount,
      fee: feeResult.fee,
      feePercent: feeResult.feePercent,
      netAmount: feeResult.netAmount,
      status: "COMPLETED",
      auctionId, buyerId: winningBid.userId, sellerId: auction.userId,
    },
  });

  if (!alreadyCompleted) {
    await prisma.user.update({
      where: { id: auction.userId },
      data: {
        trustScore: { increment: delta },
        totalSales: { increment: 1 },
        credits: { increment: 1 },
      },
    });
    await prisma.user.update({
      where: { id: winningBid.userId },
      data: { trustScore: { increment: 1 } },
    });
  }

  res.json({ success: true, trustDelta: alreadyCompleted ? 0 : delta });
}

export async function getRank(req: AuthRequest, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id as string },
    select: { trustScore: true, totalSales: true, verified: true },
  });
  if (!user) throw new AppError(404, "User not found");
  const rank = calculateRank(user.trustScore, user.totalSales);
  res.json({ ...user, rank: rank.rank, rankLabel: rank.label, rankColor: rank.color });
}

export async function recalculateTrust(req: AuthRequest, res: Response) {
  if (req.userRole !== "ADMIN") throw new AppError(403, "Not authorized");
  const users = await prisma.user.findMany({ select: { id: true, trustScore: true, totalSales: true } });
  for (const u of users) {
    const baseTrust = Math.min(u.totalSales * 2, 50);
    await prisma.user.update({
      where: { id: u.id },
      data: { trustScore: Math.max(u.trustScore, baseTrust) },
    });
  }
  res.json({ recalculated: users.length });
}

export async function claimDailyCredit(req: AuthRequest, res: Response) {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) throw new AppError(404, "User not found");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (user.lastDailyCredit && user.lastDailyCredit >= today) {
    throw new AppError(400, "Už jsi dnes získal denní kredit, přijď zítra!");
  }

  await prisma.user.update({
    where: { id: req.userId },
    data: {
      credits: { increment: 1 },
      lastDailyCredit: new Date(),
    },
  });

  // Notify about the reward
  await prisma.notification.create({
    data: {
      message: "Denní bonus: +1 kredit! 🎉 Využij ho na boostování svých aukcí.",
      type: "CREDIT",
      userId: req.userId!,
    },
  });

  res.json({ success: true, credits: user.credits + 1 });
}
