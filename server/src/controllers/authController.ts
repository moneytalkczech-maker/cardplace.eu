import { Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../utils/prisma";
import { AuthRequest } from "../middleware/auth";
import { JwtPayload, signToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { calculateRank } from "../utils/trust";
import { AppError } from "../middleware/errorHandler";

export async function register(req: AuthRequest, res: Response) {
  const { email, username, password, referralCode } = req.body;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) throw new AppError(400, "Email or username already taken");

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, username, password: hashed },
  });

  if (referralCode) {
    const referrer = await prisma.referral.findUnique({ where: { code: referralCode } });
    if (referrer && !referrer.referredId) {
      await prisma.referral.update({
        where: { id: referrer.id },
        data: { referredId: user.id, rewardGiven: true },
      });
      await prisma.user.update({
        where: { id: referrer.referrerId },
        data: { trustScore: { increment: 10 } },
      });
      await prisma.user.update({
        where: { id: user.id },
        data: {
          trustScore: { increment: 5 },
          credits: { increment: 1 },
        },
      });
    }
  }

  const payload: JwtPayload = { id: user.id, role: user.role, username: user.username };
  const token = signToken(payload);
  const refreshToken = signRefreshToken(payload);

  res.json({
    token,
    refreshToken,
    user: {
      id: user.id, email: user.email, username: user.username,
      role: user.role, trustScore: user.trustScore, credits: user.credits,
    },
  });
}

export async function login(req: AuthRequest, res: Response) {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError(400, "Invalid credentials");

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new AppError(400, "Invalid credentials");

  const rank = calculateRank(user.trustScore, user.totalSales);
  const payload: JwtPayload = { id: user.id, role: user.role, username: user.username };
  const token = signToken(payload);
  const refreshToken = signRefreshToken(payload);

  res.json({
    token,
    refreshToken,
    user: {
      id: user.id, email: user.email, username: user.username, role: user.role,
      trustScore: user.trustScore, verified: user.verified,
      totalSales: user.totalSales, rank: rank.rank, rankLabel: rank.label,
      credits: user.credits,
    },
  });
}

export async function me(req: AuthRequest, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    include: { _count: { select: { auctions: true, bids: true } } },
  });
  if (!user) throw new AppError(404, "User not found");
  const rank = calculateRank(user.trustScore, user.totalSales);
  const isVip = user.vipUntil ? user.vipUntil > new Date() : false;
  res.json({
    id: user.id, email: user.email, username: user.username,
    role: user.role, trustScore: user.trustScore, verified: user.verified,
    verifiedType: user.verifiedType,
    avatarUrl: user.avatarUrl, totalSales: user.totalSales,
    auctionCount: user._count.auctions, bidCount: user._count.bids,
    createdAt: user.createdAt, rank: rank.rank, rankLabel: rank.label,
    credits: user.credits,
    founder: user.founder,
    vip: isVip,
    vipUntil: user.vipUntil,
  });
}

export async function getReferralCode(req: AuthRequest, res: Response) {
  let referral = await prisma.referral.findFirst({ where: { referrerId: req.userId } });
  if (!referral) {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    referral = await prisma.referral.create({
      data: { code, referrerId: req.userId! },
    });
  }
  res.json({ code: referral.code });
}

export async function refresh(req: AuthRequest, res: Response) {
  const { refreshToken } = req.body;
  let decoded: JwtPayload;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(401, "Invalid or expired refresh token");
  }
  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: { id: true, role: true, username: true },
  });
  if (!user) throw new AppError(401, "User not found");
  const payload: JwtPayload = { id: user.id, role: user.role, username: user.username };
  res.json({ token: signToken(payload), refreshToken: signRefreshToken(payload) });
}
