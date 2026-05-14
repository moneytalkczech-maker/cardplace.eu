import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";

export async function toggleFollow(req: AuthRequest, res: Response) {
  const followingId = req.params.id as string;
  if (followingId === req.userId) throw new AppError(400, "Cannot follow yourself");

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
  const follows = await prisma.follow.findMany({
    where: { followingId: req.params.id as string },
    include: { follower: { select: { id: true, username: true, trustScore: true, verified: true } } },
    orderBy: { createdAt: "desc" },
  }) as any;
  res.json(follows.map((f: any) => f.follower));
}

export async function getFollowing(req: Request, res: Response) {
  const follows = await prisma.follow.findMany({
    where: { followerId: req.params.id as string },
    include: { following: { select: { id: true, username: true, trustScore: true, verified: true } } },
    orderBy: { createdAt: "desc" },
  }) as any;
  res.json(follows.map((f: any) => f.following));
}
