import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";

export async function toggleFollow(req: AuthRequest, res: Response) {
  const followingId = req.params.id as string;
  if (followingId === req.userId) throw new AppError(400, "Cannot follow yourself");

  // Ověřit, že cílový uživatel existuje
  const target = await prisma.user.findUnique({
    where: { id: followingId },
    select: { id: true },
  });
  if (!target) throw new AppError(404, "User not found");

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: req.userId!, followingId } },
  });

  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
    res.json({ following: false });
  } else {
    await prisma.follow.create({ data: { followerId: req.userId!, followingId } });
    res.json({ following: true });
  }
}

export async function checkFollow(req: AuthRequest, res: Response) {
  const existing = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: req.userId!,
        followingId: req.params.id as string,
      },
    },
  });
  res.json({ following: !!existing });
}

export async function getFollowers(req: Request, res: Response) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
  const skip = (page - 1) * limit;

  const [follows, total] = await Promise.all([
    prisma.follow.findMany({
      where: { followingId: req.params.id as string },
      include: { follower: { select: { id: true, username: true, trustScore: true, verified: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.follow.count({ where: { followingId: req.params.id as string } }),
  ]);

  res.json({
    data: follows.map((f) => f.follower),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function getFollowing(req: Request, res: Response) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
  const skip = (page - 1) * limit;

  const [follows, total] = await Promise.all([
    prisma.follow.findMany({
      where: { followerId: req.params.id as string },
      include: { following: { select: { id: true, username: true, trustScore: true, verified: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.follow.count({ where: { followerId: req.params.id as string } }),
  ]);

  res.json({
    data: follows.map((f) => f.following),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
