import { Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../utils/prisma";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import logger from "../utils/logger";

export async function updateProfile(req: AuthRequest, res: Response) {
  const { username, email } = req.body;
  if (email) {
    const existing = await prisma.user.findFirst({ where: { email, NOT: { id: req.userId } } });
    if (existing) throw new AppError(400, "Email already taken");
  }
  if (username) {
    const existing = await prisma.user.findFirst({ where: { username, NOT: { id: req.userId } } });
    if (existing) throw new AppError(400, "Username already taken");
  }
  const user = await prisma.user.update({
    where: { id: req.userId },
    data: { ...(email && { email }), ...(username && { username }) },
    select: { id: true, email: true, username: true, avatarUrl: true },
  });
  res.json(user);
}

export async function changePassword(req: AuthRequest, res: Response) {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) throw new AppError(400, "Current and new password required");
  if (newPassword.length < 8) throw new AppError(400, "New password must be at least 8 characters");

  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) throw new AppError(404, "User not found");

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) throw new AppError(400, "Current password is incorrect");

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: req.userId }, data: { password: hashed } });

  logger.info({ userId: req.userId }, "Password changed");
  res.json({ success: true });
}

export async function uploadAvatar(req: AuthRequest, res: Response) {
  if (!req.file) throw new AppError(400, "No file uploaded");
  const url = `/uploads/avatars/${req.file.filename}`;
  await prisma.user.update({ where: { id: req.userId }, data: { avatarUrl: url } });
  res.json({ avatarUrl: url });
}
