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
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const skip = (page - 1) * limit;

  const [auctions, total] = await Promise.all([
    prisma.auction.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        user: { select: { id: true, username: true, trustScore: true, verified: true, totalSales: true } },
        _count: { select: { bids: true } },
        card: { select: { name: true, setName: true, imageUrl: true } },
      },
    }),
    prisma.auction.count({ where: { userId: req.userId } }),
  ]);

  const withRank = auctions.map((a: any) => {
    if (a.user) {
      const rank = calculateRank(a.user.trustScore, a.user.totalSales || 0);
      return { ...a, user: { ...a.user, rank: rank.rank } };
    }
    return a;
  });

  res.json({
    data: withRank,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function getMyBids(req: AuthRequest, res: Response) {
  const take = Math.min(parseInt(req.query.take as string) || 50, 100);
  const bids = await prisma.bid.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: "desc" },
    take,
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
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const skip = (page - 1) * limit;

  const [watchlist, total] = await Promise.all([
    prisma.watchlist.findMany({
      where: { userId: req.userId },
      skip,
      take: limit,
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
    }),
    prisma.watchlist.count({ where: { userId: req.userId } }),
  ]);

  res.json({
    data: watchlist,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
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
    select: {
      id: true, userId: true, status: true,
      bids: { orderBy: { amount: "desc" as const }, take: 1, select: { id: true, userId: true, amount: true } },
    },
  });
  if (!auction) throw new AppError(404, "Auction not found");
  if (auction.userId !== req.userId) throw new AppError(403, "Not your auction");
  if (auction.status !== "ENDED") throw new AppError(400, "Auction not ended");

  const winningBid = auction.bids?.[0];
  if (!winningBid) throw new AppError(400, "No winning bid");

  // Kontrola: kupující musí nejdříve zaplatit přes Stripe
  const existingTransaction = await prisma.transaction.findUnique({
    where: { auctionId },
    select: { status: true, stripePaymentIntentId: true },
  });
  if (!existingTransaction || existingTransaction.status !== "COMPLETED") {
    throw new AppError(400, "Kupující ještě nezaplatil. Platba musí proběhnout přes Stripe před označením transakce jako dokončené.");
  }

  // Pokud je již COMPLETED, vrátit success (idempotentní)
  const feeResult = await calculateFee(winningBid.amount, auction.userId);
  const delta = trustDeltaForTransaction(winningBid.amount);

  // Atomická operace v transakci: upsert + trust/credits pouze pokud není COMPLETED
  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.transaction.findUnique({
      where: { auctionId },
      select: { status: true },
    });
    if (existing?.status === "COMPLETED") return { alreadyDone: true, delta: 0 };

    await tx.transaction.upsert({
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

    await tx.user.update({
      where: { id: auction.userId },
      data: { trustScore: { increment: delta }, totalSales: { increment: 1 }, credits: { increment: 1 } },
    });
    await tx.user.update({
      where: { id: winningBid.userId },
      data: { trustScore: { increment: 1 } },
    });

    return { alreadyDone: false, delta };
  });

  res.json({ success: true, trustDelta: result.delta });
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
  if (req.userRole?.toLowerCase() !== "admin") throw new AppError(403, "Not authorized");
  const users = await prisma.user.findMany({ select: { id: true, trustScore: true, totalSales: true } });
  await prisma.$transaction(
    users.map((u) => {
      const baseTrust = Math.min(u.totalSales * 2, 50);
      return prisma.user.update({
        where: { id: u.id },
        data: { trustScore: Math.max(u.trustScore, baseTrust) },
      });
    })
  );
  res.json({ recalculated: users.length });
}

export async function claimDailyCredit(req: AuthRequest, res: Response) {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) throw new AppError(404, "User not found");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Atomic update: only pokud lastDailyCredit je null nebo před dneškem
  const result = await prisma.user.updateMany({
    where: {
      id: req.userId,
      OR: [
        { lastDailyCredit: null },
        { lastDailyCredit: { lt: today } },
      ],
    },
    data: {
      credits: { increment: 1 },
      lastDailyCredit: new Date(),
    },
  });

  if (result.count === 0) {
    throw new AppError(400, "Už jsi dnes získal denní kredit, přijď zítra!");
  }

  await prisma.notification.create({
    data: {
      message: "Denní bonus: +1 kredit! 🎉 Využij ho na boostování svých aukcí.",
      type: "CREDIT",
      userId: req.userId!,
    },
  });

  res.json({ success: true, credits: user.credits + 1 });
}
