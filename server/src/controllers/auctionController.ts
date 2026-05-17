import { Response } from "express";
import { z } from "zod";
import prisma from "../utils/prisma";
import { Prisma, PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth";
import { calculateRank } from "../utils/trust";
import { auctionListSchema } from "../utils/validation";
import { AppError } from "../middleware/errorHandler";
import logger from "../utils/logger";
import { cacheGet, cacheSet, cacheDel, TTL } from "../utils/cache";
import { checkAuctionFraud } from "../utils/fraudDetection";
import { sendOutbidEmail } from "../utils/email";
import { createAuditLog } from "../utils/auditLog";
import { isEmailVerified } from "../utils/emailVerification";

async function notifyFollowers(auctionId: string, userId: string, title: string) {
  try {
    const follows = await prisma.follow.findMany({
      where: { followingId: userId },
      select: { followerId: true },
    });
    if (follows.length > 0) {
      await prisma.notification.createMany({
        data: follows.map((f) => ({
          message: `@${userId} vytvořil novou aukci: "${title}"`,
          type: "NEW_AUCTION",
          link: `/auctions/${auctionId}`,
          userId: f.followerId,
        })),
      });
    }
  } catch { /* silent */ }
}

export async function list(req: AuthRequest, res: Response) {
  const query = req.query as Record<string, string | undefined>;
  const { status, search, sort, category, cursor } = query;
  const take = parseInt(query.take || "20", 10);
  const cacheKey = `auctions:list:${cursor || ""}:${take}:${status || ""}:${search || ""}:${sort || ""}:${category || ""}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return res.json(cached);
  const publicStatuses = ["ACTIVE", "ENDED", "CANCELLED"];
  const where: Prisma.AuctionWhereInput = {};
  if (status && publicStatuses.includes(status)) {
    where.status = status;
  } else {
    where.status = { notIn: ["pending_review", "removed", "draft"] };
  }
  if (category) {
    where.card = { category };
  }
  if (search) {
    where.AND = [
      { OR: [
        { title: { contains: search } },
        { description: { contains: search } },
      ]},
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
    },
  });

  const hasMore = auctions.length > take;
  if (hasMore) auctions.pop();

  // Získat watchlist status pro přihlášeného uživatele
  let watchedIds = new Set<string>();
  if (req.userId) {
    const watched = await prisma.watchlist.findMany({
      where: { userId: req.userId, auctionId: { in: auctions.map((a) => a.id) } },
      select: { auctionId: true },
    });
    watchedIds = new Set(watched.map((w) => w.auctionId));
  }

  const result = auctions.map((a) => {
    const rank = calculateRank(a.user.trustScore, 0);
    return {
      ...a,
      user: { ...a.user, rank: rank.rank },
      isWatched: watchedIds.has(a.id),
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
  const withRank = auctions.map((a) => ({
    ...a,
    user: { ...a.user, rank: calculateRank(a.user.trustScore, 0).rank },
  }));
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
  const withRank = auctions.map((a, idx) => ({
    ...a,
    user: { ...a.user, rank: calculateRank(a.user.trustScore, 0).rank },
    trendingRank: idx + 1,
  }));
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
  const id = req.params.id as string;
  const auction = await prisma.auction.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, username: true, trustScore: true, verified: true, totalSales: true, createdAt: true } },
      card: true,
      bids: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { user: { select: { id: true, username: true } } },
      },
      _count: { select: { bids: true, watchlists: true } },
    },
  });
  if (!auction) throw new AppError(404, "Auction not found");

  // Skrýt neveřejné aukce (pouze owner/admin vidí)
  const hiddenStatuses = ["pending_review", "removed", "draft"];
  if (hiddenStatuses.includes(auction.status)) {
    const isOwner = req.userId === auction.userId;
    const isAdmin = req.userRole?.toLowerCase() === "admin";
    if (!isOwner && !isAdmin) {
      throw new AppError(404, "Auction not found");
    }
  }

  // Zjistit watch status zvlášť
  let isWatched = false;
  if (req.userId) {
    const watch = await prisma.watchlist.findUnique({
      where: { userId_auctionId: { userId: req.userId, auctionId: id } },
    });
    isWatched = !!watch;
  }

  const rank = calculateRank(auction.user.trustScore, auction.user.totalSales || 0);
  res.json({ ...auction, isWatched, user: { ...auction.user, rank: rank.rank } });
}

export async function create(req: AuthRequest, res: Response) {
  const { title, description, imageUrl, startingPrice, endTime, cardId, confirmedOriginal, buyNowPrice } = req.body;
  const price = parseFloat(startingPrice);
  const buyNow = buyNowPrice ? parseFloat(buyNowPrice) : null;

  if (buyNow !== null && buyNow <= price) {
    throw new AppError(400, "Buy now cena musí být vyšší než vyvolávací cena");
  }

  // Ověření emailu
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) throw new AppError(401, "User not found");
  if (user.role?.toLowerCase() !== "admin" && !isEmailVerified(user)) {
    throw new AppError(400, "Pro vytvoření aukce je nutné nejdříve ověřit email");
  }

  // Checkbox potvrzení originality
  if (!confirmedOriginal) {
    throw new AppError(400, "Je nutné potvrdit, že položka není fake, proxy ani kradené zboží");
  }

  // Kontrola rizikových slov
  const RISK_WORDS = ["fake", "proxy", "replika", "replica", "counterfeit", "padělek", "kopie", "neoriginální"];
  const titleLower = (title || "").toLowerCase();
  const descLower = (description || "").toLowerCase();
  const hasRiskWords = RISK_WORDS.some((w) => titleLower.includes(w) || descLower.includes(w));

  // Detekce podezřelých aukcí
  const fraud = await checkAuctionFraud(req.userId!, price);
  if (fraud.suspicious) {
    logger.warn({ userId: req.userId, reasons: fraud.reasons, score: fraud.score }, "Fraud suspicion on auction create");
  }

  const initialStatus = hasRiskWords ? "pending_review" : "ACTIVE";

  const auction = await prisma.auction.create({
    data: {
      title, description, imageUrl,
      startingPrice: price,
      currentPrice: price,
      endTime: new Date(endTime),
      userId: req.userId!,
      cardId,
      status: initialStatus,
      buyNowPrice: buyNow,
    },
  });
  notifyFollowers(auction.id, req.userId!, auction.title);
  await cacheDel(`auctions:list*`);

  await createAuditLog({
    userId: req.userId,
    action: "auction.create",
    entityType: "auction",
    entityId: auction.id,
    metadata: { title, status: initialStatus, hasRiskWords },
    req,
  });

  res.json({
    ...auction,
    fraudWarning: fraud.suspicious ? fraud.reasons : undefined,
    pendingReview: initialStatus === "pending_review",
    buyNowPrice: buyNow,
  });
}

export async function buyNow(req: AuthRequest, res: Response) {
  const auctionId = req.params.id as string;

  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    select: {
      id: true, title: true, status: true, currentPrice: true,
      buyNowPrice: true, buyNowUsed: true, endTime: true, userId: true,
    },
  });
  if (!auction) throw new AppError(404, "Auction not found");
  if (auction.status !== "ACTIVE") throw new AppError(400, "Auction is not active");
  if (auction.userId === req.userId) throw new AppError(400, "Cannot buy your own auction");
  if (!auction.buyNowPrice || auction.buyNowUsed) throw new AppError(400, "Buy now is not available");

  const now = new Date();
  if (now >= auction.endTime) {
    await prisma.auction.update({ where: { id: auctionId }, data: { status: "ENDED" } });
    throw new AppError(400, "Auction has ended");
  }

  await prisma.$transaction(async (tx) => {
    // Znovu načíst pro race condition protection
    const current = await tx.auction.findUnique({
      where: { id: auctionId },
      select: { status: true, buyNowPrice: true, buyNowUsed: true, endTime: true },
    });
    if (!current || current.status !== "ACTIVE") throw new AppError(400, "Auction is not active");
    if (current.buyNowUsed || !current.buyNowPrice) throw new AppError(400, "Buy now is not available");
    if (new Date() >= current.endTime) throw new AppError(400, "Auction has ended");

    // Vytvořit bid za buy now cenu
    await tx.bid.create({
      data: { amount: current.buyNowPrice, userId: req.userId!, auctionId },
    });

    // Ukončit aukci
    await tx.auction.update({
      where: { id: auctionId },
      data: { currentPrice: current.buyNowPrice, status: "ENDED", buyNowUsed: true },
    });

    // Notifikace prodejci
    await tx.notification.create({
      data: {
        message: `Aukce "${auction.title}" byla koupena za ${current.buyNowPrice} Kč (Buy Now)`,
        type: "BUY_NOW",
        link: `/auctions/${auctionId}`,
        userId: auction.userId,
      },
    });
  });

  await createAuditLog({
    userId: req.userId,
    action: "auction.buyNow",
    entityType: "auction",
    entityId: auctionId,
    metadata: { price: auction.buyNowPrice },
    req,
  });

  res.json({ success: true, price: auction.buyNowPrice });
}

export async function placeBid(req: AuthRequest, res: Response) {
  const { amount, maxBid } = req.body;
  const auctionId = req.params.id as string;

  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    select: {
      id: true, title: true, status: true, currentPrice: true,
      minIncrement: true, endTime: true, userId: true, buyNowPrice: true, buyNowUsed: true,
      bids: { orderBy: { amount: "desc" as const }, take: 1, select: { id: true, userId: true, amount: true, maxBid: true } },
    },
  });
  if (!auction) throw new AppError(404, "Auction not found");
  if (auction.status !== "ACTIVE") throw new AppError(400, "Auction is not active");
  if (auction.userId === req.userId) throw new AppError(400, "Cannot bid on your own auction");

  const bidAmount = parseFloat(amount);
  const userMaxBid = maxBid ? parseFloat(maxBid) : null;

  if (userMaxBid !== null && userMaxBid < bidAmount) {
    throw new AppError(400, "Max bid must be at least the bid amount");
  }

  if (bidAmount < auction.currentPrice + auction.minIncrement) {
    throw new AppError(400, `Bid must be at least ${auction.currentPrice + auction.minIncrement}`);
  }

  const prevTopBid = auction.bids?.[0];

  // Proxy bidding logic:
  // If user sets maxBid, system auto-bids on their behalf up to maxBid
  // The actual bid placed = min(maxBid, prevTopBid.amount + minIncrement) or bidAmount
  let actualBidAmount = bidAmount;
  let proxyMaxUsed = userMaxBid;

  if (userMaxBid !== null && prevTopBid && prevTopBid.userId !== req.userId) {
    // There's an existing top bid from someone else — auto-bid up to maxBid
    const neededBid = prevTopBid.amount + auction.minIncrement;
    if (userMaxBid >= neededBid) {
      actualBidAmount = Math.min(userMaxBid, neededBid);
    } else if (userMaxBid >= auction.currentPrice + auction.minIncrement) {
      actualBidAmount = userMaxBid;
    } else {
      throw new AppError(400, `Max bid must be at least ${auction.currentPrice + auction.minIncrement}`);
    }
  }

  // Atomická operace: kontrola endTime + bid + update aukce + notifikace v jedné transakci
  // Prevence race condition: endTime se kontroluje uvnitř transakce, ne před ní
  const { bid, outbidUserId, auctionEnded, proxyBids } = await prisma.$transaction(async (tx) => {
    // Znovu načíst aukci v transakci — získat nejnovější endTime a status
    const currentAuction = await tx.auction.findUnique({
      where: { id: auctionId },
      select: { id: true, status: true, endTime: true, currentPrice: true, minIncrement: true, userId: true, buyNowPrice: true, buyNowUsed: true },
    });
    if (!currentAuction) throw new AppError(404, "Auction not found");
    if (currentAuction.status !== "ACTIVE") throw new AppError(400, "Auction is not active");

    const now = new Date();
    let endTime = new Date(currentAuction.endTime);

    // Kontrola endTime uvnitř transakce — prevence TOCTOU race condition
    if (now >= endTime) {
      await tx.auction.update({ where: { id: auctionId }, data: { status: "ENDED" } });
      throw new AppError(400, "Auction has ended");
    }

    // Anti-sniping: pokud zbývá méně než 2 minuty, prodloužit o 2 minuty
    const msUntilEnd = endTime.getTime() - now.getTime();
    if (msUntilEnd < 2 * 60 * 1000) {
      endTime = new Date(now.getTime() + 2 * 60 * 1000);
    }

    // Re-fetch top bid inside transaction for proxy logic
    const topBidInTx = await tx.bid.findFirst({
      where: { auctionId },
      orderBy: { amount: "desc" },
      select: { id: true, userId: true, amount: true, maxBid: true },
    });

    // Proxy bidding inside transaction
    let finalBidAmount = actualBidAmount;
    let proxyBids: { amount: number; userId: string; maxBid: number | null }[] = [];

    if (userMaxBid !== null && topBidInTx && topBidInTx.userId !== req.userId) {
      const needed = topBidInTx.amount + auction.minIncrement;
      if (userMaxBid >= needed) {
        finalBidAmount = Math.min(userMaxBid, needed);
      } else if (userMaxBid >= currentAuction.currentPrice + auction.minIncrement) {
        finalBidAmount = userMaxBid;
      }
    }

    // Check if existing top bidder has proxy maxBid and auto-bid against new bidder
    if (topBidInTx && topBidInTx.maxBid && topBidInTx.userId !== req.userId && topBidInTx.maxBid > finalBidAmount) {
      // Existing proxy bidder auto-bids
      const proxyNeeded = finalBidAmount + auction.minIncrement;
      const proxyBidAmount = Math.min(topBidInTx.maxBid, proxyNeeded);

      if (proxyBidAmount > finalBidAmount) {
        // Create proxy bid for existing top bidder
        await tx.bid.create({
          data: { amount: proxyBidAmount, maxBid: topBidInTx.maxBid, userId: topBidInTx.userId, auctionId },
        });
        proxyBids.push({ amount: proxyBidAmount, userId: topBidInTx.userId, maxBid: topBidInTx.maxBid });
        finalBidAmount = proxyBidAmount;

        // New bidder is outbid immediately
        await tx.notification.create({
          data: {
            message: `Tvá maximální nabídka byla přebita na "${auction.title}" — aktuální nabídka je ${finalBidAmount} Kč`,
            type: "OUTBID",
            link: `/auctions/${auctionId}`,
            userId: req.userId!,
          },
        });
      }
    }

    const b = await tx.bid.create({
      data: { amount: finalBidAmount, maxBid: proxyMaxUsed, userId: req.userId!, auctionId },
    });

    // Buy now — pokud je bid >= buyNowPrice, okamžitě ukončit
    let auctionEnded = false;
    if (currentAuction.buyNowPrice && finalBidAmount >= currentAuction.buyNowPrice && !currentAuction.buyNowUsed) {
      await tx.auction.update({
        where: { id: auctionId },
        data: { currentPrice: currentAuction.buyNowPrice, status: "ENDED", buyNowUsed: true },
      });
      auctionEnded = true;
    } else {
      await tx.auction.update({
        where: { id: auctionId },
        data: { currentPrice: finalBidAmount, endTime },
      });
    }

    await tx.notification.create({
      data: {
        message: `Nová nabídka ${finalBidAmount} Kč na "${auction.title}"`,
        type: "BID",
        link: `/auctions/${auctionId}`,
        userId: currentAuction.userId,
      },
    });

    let outbidUid: string | null = null;
    if (topBidInTx && topBidInTx.userId !== req.userId && proxyBids.length === 0) {
      await tx.notification.create({
        data: {
          message: `Někdo tě přehodil na "${auction.title}" — aktuální nabídka je ${finalBidAmount} Kč`,
          type: "OUTBID",
          link: `/auctions/${auctionId}`,
          userId: topBidInTx.userId,
        },
      });
      outbidUid = topBidInTx.userId;
    }

    return { bid: b, outbidUserId: outbidUid, auctionEnded, proxyBids };
  });

  // Věci mimo transakci: email (fire-and-forget), socket, audit log
  if (outbidUserId) {
    // Email lookup a odeslání probíhá asynchronně — neblokujeme response
    prisma.user.findUnique({
      where: { id: outbidUserId },
      select: { email: true, username: true },
    }).then((prevUser) => {
      if (prevUser?.email) {
        sendOutbidEmail(prevUser.email, prevUser.username, auction.title, auctionId).catch(() => {});
      }
    }).catch(() => {}); // Selhání emailu neovlivní response
  }

  const io = req.app.get("io");
  if (io) {
    io.to(`auction-${auctionId}`).emit("new-bid", {
      id: bid.id, amount: bid.amount, auctionId,
      userId: req.userId, username: req.username || "Anonymous",
      createdAt: bid.createdAt, maxBid: bid.maxBid,
    });
    if (outbidUserId) {
      io.to(`user-${outbidUserId}`).emit("outbid", {
        auctionId, auctionTitle: auction.title, newBid: bid.amount,
      });
    }
    // Notify proxy bidders
    for (const pb of proxyBids) {
      io.to(`user-${pb.userId}`).emit("proxy-bid", {
        auctionId, auctionTitle: auction.title, newBid: pb.amount, maxBid: pb.maxBid,
      });
    }
  }

  await createAuditLog({
    userId: req.userId,
    action: "auction.bid",
    entityType: "bid",
    entityId: bid.id,
    metadata: { auctionId, amount: bid.amount, maxBid: proxyMaxUsed },
    req,
  });

  res.json({ ...bid, proxyBids: proxyBids.length > 0 ? proxyBids : undefined });
}

export async function boost(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  const auction = await prisma.auction.findUnique({
    where: { id },
    select: { id: true, userId: true, featured: true },
  });
  if (!auction) throw new AppError(404, "Auction not found");
  if (auction.userId !== req.userId) throw new AppError(403, "Not your auction");

  if (auction.featured) {
    // Od-feature: vrátit kredit
    await prisma.$transaction([
      prisma.auction.update({ where: { id }, data: { featured: false } }),
      prisma.user.update({ where: { id: req.userId }, data: { credits: { increment: 1 } } }),
    ]);
    res.json({ featured: false });
  } else {
    // Feature: atomic — decrement + featured update v transakci
    const [decrement] = await prisma.$transaction([
      prisma.user.updateMany({
        where: { id: req.userId, credits: { gte: 1 } },
        data: { credits: { decrement: 1 } },
      }),
      prisma.auction.update({ where: { id }, data: { featured: true } }),
    ]);
    if (decrement.count === 0) {
      // Rollback featured (automatické díky transakci)
      throw new AppError(400, "Nedostatek kreditů");
    }
    res.json({ featured: true });
  }
}

export async function toggleWatch(req: AuthRequest, res: Response) {
  const auctionId = req.params.id as string;
  // Ověřit, že aukce existuje
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    select: { id: true },
  });
  if (!auction) throw new AppError(404, "Auction not found");

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
  const auction = await prisma.auction.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });
  if (!auction) throw new AppError(404, "Auction not found");
  if (auction.userId !== req.userId && req.userRole?.toLowerCase() !== "admin") {
    throw new AppError(403, "Not authorized");
  }
  await prisma.auction.update({ where: { id }, data: { status: "CANCELLED" } });
  res.json({ success: true });
}
