import { Response } from "express";
import { z } from "zod";
import prisma from "../utils/prisma";
import { Prisma } from "@prisma/client";
import { AuthRequest } from "../middleware/auth";
import { calculateRank } from "../utils/trust";
import { auctionListSchema } from "../utils/validation";
import { AppError } from "../middleware/errorHandler";
import logger from "../utils/logger";
import { cacheGet, cacheSet, cacheDel, TTL } from "../utils/cache";
import { sendOutbidEmail } from "../utils/email";

async function notifyFollowers(auctionId: string, userId: string, title: string) {
  try {
    const follows = await prisma.follow.findMany({
      where: { followingId: userId },
      select: { followerId: true },
    });
    for (const f of follows) {
      await prisma.notification.create({
        data: {
          message: `@${userId} vytvořil novou aukci: "${title}"`,
          type: "NEW_AUCTION",
          link: `/auctions/${auctionId}`,
          userId: f.followerId,
        },
      });
    }
  } catch { /* silent */ }
}

export async function list(req: AuthRequest, res: Response) {
  const { status, search, sort, cursor, take = 20 } = req.query as any;
  const cacheKey = `auctions:list:${cursor || ""}:${take}:${status || ""}:${search || ""}:${sort || ""}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return res.json(cached);
  const where: Prisma.AuctionWhereInput = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
    ];
  }

  let orderBy: Prisma.AuctionOrderByWithRelationInput = { createdAt: "desc" };
  if (sort === "ending") orderBy = { endTime: "asc" };
  if (sort === "price-asc") orderBy = { currentPrice: "asc" };
  if (sort === "price-desc") orderBy = { currentPrice: "desc" };

  const auctions = await prisma.auction.findMany({
    where,
    orderBy: [orderBy, { createdAt: "desc" }],
    take: take + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    include: {
      user: { select: { id: true, username: true, trustScore: true } },
      card: { select: { id: true, name: true, setName: true, rarity: true, imageUrl: true } },
      _count: { select: { bids: true, watchlists: true } },
      watchlists: req.userId ? { where: { userId: req.userId } } : false,
    },
  });

  const hasMore = auctions.length > take;
  if (hasMore) auctions.pop();

  const result = auctions.map((a: any) => {
    const rank = calculateRank(a.user.trustScore, 0);
    return {
      ...a,
      user: { ...a.user, rank: rank.rank },
      isWatched: Array.isArray(a.watchlists) ? a.watchlists.length > 0 : false,
      watchlists: undefined,
      bidCount: a._count.bids,
      watchCount: a._count.watchlists,
      _count: undefined,
    };
  });

  const payload = {
    data: result,
    nextCursor: hasMore ? result[result.length - 1].id : null,
  };
  await cacheSet(cacheKey, payload, TTL.AUCTIONS_LIST);
  res.json(payload);
}

export async function featured(_req: AuthRequest, res: Response) {
  const auctions = await prisma.auction.findMany({
    where: { status: "ACTIVE", featured: true },
    orderBy: { createdAt: "desc" },
    take: 8,
    include: {
      user: { select: { id: true, username: true, trustScore: true } },
      card: { select: { id: true, name: true, setName: true, rarity: true, imageUrl: true } },
      _count: { select: { bids: true } },
    },
  });
  const withRank = auctions.map((a: any) => {
    const rank = calculateRank(a.user.trustScore, 0);
    return { ...a, user: { ...a.user, rank: rank.rank } };
  });
  res.json(withRank);
}

export async function trending(_req: AuthRequest, res: Response) {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const auctions = await prisma.auction.findMany({
    where: { status: "ACTIVE", createdAt: { gte: weekAgo } },
    orderBy: [
      { bids: { _count: "desc" } },
      { watchlists: { _count: "desc" } },
      { createdAt: "desc" },
    ],
    take: 12,
    include: {
      user: { select: { id: true, username: true, trustScore: true } },
      card: { select: { id: true, name: true, setName: true, rarity: true, imageUrl: true } },
      _count: { select: { bids: true, watchlists: true } },
    },
  });
  const withRank = auctions.map((a: any, idx: number) => {
    const rank = calculateRank(a.user.trustScore, 0);
    return { ...a, user: { ...a.user, rank: rank.rank }, trendingRank: idx + 1 };
  });
  res.json(withRank);
}

export async function lastSold(_req: AuthRequest, res: Response) {
  const transactions = await prisma.transaction.findMany({
    where: { status: "COMPLETED" },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      auction: {
        include: {
          card: { select: { name: true, setName: true, imageUrl: true } },
        },
      },
      buyer: { select: { username: true } },
    },
  });
  res.json(transactions);
}

export async function getById(req: AuthRequest, res: Response) {
  const auction = await prisma.auction.findUnique({
    where: { id: req.params.id as string },
    include: {
      user: { select: { id: true, username: true, trustScore: true, verified: true, totalSales: true, createdAt: true } },
      card: true,
      bids: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { user: { select: { id: true, username: true } } },
      },
      _count: { select: { bids: true, watchlists: true } },
      watchlists: req.userId ? { where: { userId: req.userId } } : false,
    },
  }) as any;
  if (!auction) throw new AppError(404, "Auction not found");
  const rank = calculateRank(auction.user.trustScore, auction.user.totalSales || 0);
  const isWatched = Array.isArray(auction.watchlists) ? auction.watchlists.length > 0 : false;
  const { watchlists, ...rest } = auction;
  res.json({ ...rest, isWatched, user: { ...rest.user, rank: rank.rank } });
}

export async function create(req: AuthRequest, res: Response) {
  const { title, description, imageUrl, startingPrice, endTime, cardId } = req.body;
  const auction = await prisma.auction.create({
    data: {
      title, description, imageUrl,
      startingPrice: parseFloat(startingPrice),
      currentPrice: parseFloat(startingPrice),
      endTime: new Date(endTime),
      userId: req.userId!,
      cardId,
    },
  });
  notifyFollowers(auction.id, req.userId!, auction.title);
  await cacheDel(`auctions:list*`);
  res.json(auction);
}

export async function placeBid(req: AuthRequest, res: Response) {
  const { amount } = req.body;
  const auctionId = req.params.id as string;

  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    include: { bids: { orderBy: { amount: "desc" }, take: 1 } },
  }) as any;
  if (!auction) throw new AppError(404, "Auction not found");
  if (auction.status !== "ACTIVE") throw new AppError(400, "Auction is not active");
  if (auction.userId === req.userId) throw new AppError(400, "Cannot bid on your own auction");

  const now = new Date();
  let endTime = new Date(auction.endTime);

  if (now >= endTime) {
    await prisma.auction.update({ where: { id: auctionId }, data: { status: "ENDED" } });
    throw new AppError(400, "Auction has ended");
  }

  const bidAmount = parseFloat(amount);
  if (bidAmount < auction.currentPrice + auction.minIncrement) {
    throw new AppError(400, `Bid must be at least ${auction.currentPrice + auction.minIncrement}`);
  }

  const msUntilEnd = endTime.getTime() - now.getTime();
  if (msUntilEnd < 2 * 60 * 1000) {
    endTime = new Date(now.getTime() + 2 * 60 * 1000);
  }

  const prevTopBid = auction.bids?.[0];

  const bid = await prisma.bid.create({
    data: { amount: bidAmount, userId: req.userId!, auctionId },
  });

  await prisma.auction.update({
    where: { id: auctionId },
    data: { currentPrice: bidAmount, endTime },
  });

  await prisma.notification.create({
    data: {
      message: `New bid of $${bidAmount} on "${auction.title}"`,
      type: "BID",
      link: `/auctions/${auctionId}`,
      userId: auction.userId,
    },
  });

  if (prevTopBid && prevTopBid.userId !== req.userId) {
    await prisma.notification.create({
      data: {
        message: `Someone outbid you on "${auction.title}" — current bid is $${bidAmount}`,
        type: "OUTBID",
        link: `/auctions/${auctionId}`,
        userId: prevTopBid.userId,
      },
    });
    const prevUser = await prisma.user.findUnique({ where: { id: prevTopBid.userId }, select: { email: true, username: true } });
    if (prevUser?.email) {
      sendOutbidEmail(prevUser.email, prevUser.username, auction.title, auctionId).catch(() => {});
    }
  }

  const io = req.app.get("io");
  if (io) {
    io.to(`auction-${auctionId}`).emit("new-bid", {
      id: bid.id, amount: bidAmount, auctionId,
      userId: req.userId, username: req.username || "Anonymous",
      createdAt: bid.createdAt,
    });
    if (prevTopBid && prevTopBid.userId !== req.userId) {
      io.to(`user-${prevTopBid.userId}`).emit("outbid", {
        auctionId, auctionTitle: auction.title, newBid: bidAmount,
      });
    }
  }

  res.json(bid);
}

export async function boost(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  const auction = await prisma.auction.findUnique({ where: { id } }) as any;
  if (!auction) throw new AppError(404, "Auction not found");
  if (auction.userId !== req.userId) throw new AppError(403, "Not your auction");

  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user || user.credits < 1) throw new AppError(400, "Nedostatek kreditů");

  if (auction.featured) {
    await prisma.auction.update({ where: { id }, data: { featured: false } });
    await prisma.user.update({ where: { id: req.userId }, data: { credits: { increment: 1 } } });
    res.json({ featured: false, credits: user.credits + 1 });
  } else {
    await prisma.auction.update({ where: { id }, data: { featured: true } });
    await prisma.user.update({ where: { id: req.userId }, data: { credits: { decrement: 1 } } });
    res.json({ featured: true, credits: user.credits - 1 });
  }
}

export async function toggleWatch(req: AuthRequest, res: Response) {
  const auctionId = req.params.id as string;
  const existing = await prisma.watchlist.findUnique({
    where: { userId_auctionId: { userId: req.userId!, auctionId } },
  });
  if (existing) {
    await prisma.watchlist.delete({ where: { id: existing.id } });
    res.json({ watched: false });
  } else {
    await prisma.watchlist.create({ data: { userId: req.userId!, auctionId } });
    res.json({ watched: true });
  }
}

export async function remove(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  const auction = await prisma.auction.findUnique({ where: { id } }) as any;
  if (!auction) throw new AppError(404, "Auction not found");
  if (auction.userId !== req.userId && req.userRole !== "ADMIN") {
    throw new AppError(403, "Not authorized");
  }
  await prisma.auction.update({ where: { id }, data: { status: "CANCELLED" } });
  res.json({ success: true });
}
