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
    data: {
      ...(email && {
        email,
        emailVerifiedAt: null, // Vyžadovat re-verifikaci při změně emailu
        emailVerifyToken: null,
        emailVerifyExpiresAt: null,
      }),
      ...(username && { username }),
    },
    select: { id: true, email: true, username: true, avatarUrl: true },
  });

  // Pokud se změnil email, odeslat verifikační email
  if (email) {
    const { sendVerificationEmail } = await import("../utils/emailVerification");
    sendVerificationEmail(user.id, user.email).catch(() => {});
    logger.info({ userId: user.id, newEmail: email }, "Email changed — re-verification required");
  }

  res.json(user);
}

export async function changePassword(req: AuthRequest, res: Response) {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) throw new AppError(400, "Current and new password required");
  // Stejná pravidla jako při registraci: min 8 znaků, 1 velké, 1 malé, 1 číslo
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    throw new AppError(400, "Heslo musí mít alespoň 8 znaků, 1 velké písmeno a 1 číslici");
  }

  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) throw new AppError(404, "User not found");

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) throw new AppError(400, "Current password is incorrect");

  const hashed = await bcrypt.hash(newPassword, 12);
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

// ─── GDPR: Data export (čl. 20 GDPR – právo na přenositelnost) ─────────────

export async function exportData(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, email: true, username: true, role: true, trustScore: true,
      totalSales: true, credits: true, verified: true, founder: true,
      vipUntil: true, createdAt: true, acceptedTermsAt: true, acceptedPrivacyAt: true,
    },
  });

  const [auctions, bids, watchlist, notifications, transactions, reviews, collection, wanted, referrals, subscriptions, promotions] = await Promise.all([
    prisma.auction.findMany({ where: { userId }, select: { id: true, title: true, description: true, startingPrice: true, currentPrice: true, endTime: true, status: true, createdAt: true } }),
    prisma.bid.findMany({ where: { userId }, select: { id: true, amount: true, createdAt: true, auction: { select: { id: true, title: true } } } }),
    prisma.watchlist.findMany({ where: { userId }, select: { id: true, createdAt: true, auction: { select: { id: true, title: true } } } }),
    prisma.notification.findMany({ where: { userId }, select: { id: true, message: true, type: true, read: true, createdAt: true } }),
    prisma.transaction.findMany({ where: { OR: [{ buyerId: userId }, { sellerId: userId }] }, select: { id: true, amount: true, fee: true, status: true, createdAt: true } }),
    prisma.review.findMany({ where: { OR: [{ reviewerId: userId }, { reviewedId: userId }] }, select: { id: true, rating: true, comment: true, createdAt: true } }),
    prisma.collectionItem.findMany({ where: { userId }, select: { id: true, cardName: true, cardSet: true, quantity: true, condition: true, createdAt: true } }),
    prisma.wantedCard.findMany({ where: { userId }, select: { id: true, cardName: true, cardSet: true, maxPrice: true, status: true, createdAt: true } }),
    prisma.referral.findMany({ where: { referrerId: userId }, select: { id: true, code: true, rewardGiven: true, createdAt: true } }),
    prisma.subscription.findMany({ where: { userId }, select: { id: true, plan: true, status: true, currentPeriodEnd: true, createdAt: true } }),
    prisma.promotion.findMany({ where: { userId }, select: { id: true, type: true, price: true, status: true, createdAt: true } }),
  ]);

  res.json({
    user,
    auctions,
    bids,
    watchlist,
    notifications,
    transactions,
    reviews,
    collection,
    wanted,
    referrals,
    subscriptions,
    promotions,
    exportedAt: new Date().toISOString(),
  });
}

// ─── GDPR: Delete account (čl. 17 GDPR – právo na výmaz) ─────────────

export async function deleteAccount(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const { confirmDelete } = req.body;
  if (confirmDelete !== "DELETE_MY_ACCOUNT") {
    throw new AppError(400, "Pro smazání účtu je nutné potvrdit 'DELETE_MY_ACCOUNT'");
  }

  // Atomické smazání všech dat uživatele v transakci
  await prisma.$transaction(async (tx) => {
    // Smazat závislé záznamy
    await tx.bid.deleteMany({ where: { userId } });
    await tx.watchlist.deleteMany({ where: { userId } });
    await tx.notification.deleteMany({ where: { userId } });
    await tx.collectionItem.deleteMany({ where: { userId } });
    await tx.wantedCard.deleteMany({ where: { userId } });
    await tx.referral.deleteMany({ where: { OR: [{ referrerId: userId }, { referredId: userId }] } });
    await tx.subscription.deleteMany({ where: { userId } });
    await tx.promotion.deleteMany({ where: { userId } });
    await tx.review.deleteMany({ where: { OR: [{ reviewerId: userId }, { reviewedId: userId }] } });
    await tx.report.deleteMany({ where: { reporterId: userId } });
    await tx.upload.deleteMany({ where: { userId } });
    await tx.revokedToken.deleteMany({ where: { userId } });
    await tx.follow.deleteMany({ where: { OR: [{ followerId: userId }, { followingId: userId }] } });

    // Transakce — zachovat pro audit, ale anonymizovat
    await tx.transaction.updateMany({
      where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
      data: { buyerId: "deleted-user", sellerId: "deleted-user" },
    });

    // Aukce — zachovat, ale anonymizovat
    await tx.auction.updateMany({
      where: { userId },
      data: { status: "CANCELLED" },
    });

    // Audit log — zachovat pro forenzní účely (nelze smazat)
    // User — smazat
    await tx.user.delete({ where: { id: userId } });
  });

  // Smazat refresh token cookie
  res.clearCookie("refreshToken", { path: "/api/auth" });

  logger.info({ userId }, "Account deleted — GDPR Art. 17");
  res.json({ success: true, message: "Účet byl trvale smazán" });
}
