import { Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import prisma from "../utils/prisma";
import { AuthRequest } from "../middleware/auth";
import { JwtPayload, signToken, signRefreshToken, verifyRefreshToken, verifyToken } from "../utils/jwt";
import { calculateRank } from "../utils/trust";
import { AppError } from "../middleware/errorHandler";
import logger from "../utils/logger";
import { createAuditLog } from "../utils/auditLog";
import { sendVerificationEmail } from "../utils/emailVerification";
import { sendWelcomeEmail } from "../utils/email";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/api/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

function getIp(req: AuthRequest): string | undefined {
  return (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket?.remoteAddress;
}

function getUa(req: AuthRequest): string | undefined {
  return req.headers["user-agent"] as string;
}

export async function register(req: AuthRequest, res: Response) {
  const { email, username, password, referralCode, acceptedTerms, acceptedPrivacy } = req.body;

  if (!acceptedTerms) throw new AppError(400, "Je nutné souhlasit s obchodními podmínkami");
  if (!acceptedPrivacy) throw new AppError(400, "Je nutné souhlasit se zpracováním osobních údajů");
  if (!req.body.confirmedAge) throw new AppError(400, "Musíte být starší 18 let");

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) throw new AppError(400, "Email or username already taken");

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email, username, password: hashed,
      acceptedTermsAt: new Date(),
      acceptedPrivacyAt: new Date(),
      createdIp: getIp(req),
      userAgent: getUa(req),
    },
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
        data: { trustScore: { increment: 5 }, credits: { increment: 1 } },
      });
    }
  }

  const payload: JwtPayload = { id: user.id, role: user.role, username: user.username };
  const token = signToken(payload);
  const refreshToken = signRefreshToken(payload);

  // Nastavit refresh token jako httpOnly cookie
  res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

  await createAuditLog({ userId: user.id, action: "auth.register", metadata: { email }, req });

  // Odeslat verifikační email (nehází chybu pokud selže)
  sendVerificationEmail(user.id, user.email).catch(() => {});
  sendWelcomeEmail(user.email, user.username).catch(() => {});

  res.json({
    token,
    user: {
      id: user.id, email: user.email, username: user.username,
      role: user.role, trustScore: user.trustScore, credits: user.credits,
      emailVerified: false,
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

  // Nastavit refresh token jako httpOnly cookie
  res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

  await createAuditLog({ userId: user.id, action: "auth.login", req });

  res.json({
    token,
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
    include: {
      _count: {
        select: {
          auctions: true,
          bids: true,
          transactions: true, // won auctions (jako buyer)
        },
      },
    },
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
    wonCount: user._count.transactions,
    createdAt: user.createdAt, rank: rank.rank, rankLabel: rank.label,
    credits: user.credits,
    founder: user.founder, vip: isVip, vipUntil: user.vipUntil,
    emailVerified: !!user.emailVerifiedAt,
    emailVerifiedAt: user.emailVerifiedAt,
  });
}

export async function logout(req: AuthRequest, res: Response) {
  const refreshToken = req.cookies?.refreshToken;
  if (refreshToken) {
    try {
      const decoded = verifyRefreshToken(refreshToken);
      if (decoded.jti) {
        await prisma.revokedToken.create({
          data: {
            jti: decoded.jti,
            userId: decoded.id,
            expiresAt: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
          },
        }).catch(() => {});
      }
    } catch {
      // Neplatný token, jen smažeme cookie
    }
  }
  res.clearCookie("refreshToken", { path: "/api/auth" });
  logger.info({ userId: req.userId }, "User logged out");
  res.json({ success: true });
}

export async function getReferralCode(req: AuthRequest, res: Response) {
  let referral = await prisma.referral.findFirst({ where: { referrerId: req.userId } });
  if (!referral) {
    // Kryptograficky bezpečný generátor referral kódů
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    referral = await prisma.referral.create({
      data: { code, referrerId: req.userId! },
    });
  }
  res.json({ code: referral.code });
}

export async function refresh(req: AuthRequest, res: Response) {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!refreshToken) throw new AppError(401, "Refresh token required");

  let decoded: JwtPayload;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    res.clearCookie("refreshToken", { path: "/api/auth" });
    throw new AppError(401, "Invalid or expired refresh token");
  }

  // Atomická operace: zkontrolovat revokaci + revokovat starý + vydat nový
  const result = await prisma.$transaction(async (tx) => {
    // Zkontrolovat, zda token nebyl revokován (v transakci — prevence race condition)
    if (decoded.jti) {
      const revoked = await tx.revokedToken.findUnique({ where: { jti: decoded.jti } });
      if (revoked) {
        logger.warn({ userId: decoded.id, jti: decoded.jti }, "Revoked refresh token used — potential token theft");
        throw new AppError(401, "Token has been revoked — please log in again");
      }

      // Revokovat starý refresh token
      await tx.revokedToken.create({
        data: {
          jti: decoded.jti,
          userId: decoded.id,
          expiresAt: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
        },
      }).catch(() => {});
    }

    // Ověřit uživatele
    const user = await tx.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true, username: true, passwordChangedAt: true },
    });
    if (!user) throw new AppError(401, "User not found");

    // Kontrola: pokud bylo heslo změněno po vydání refresh tokenu, odmítnout
    if (user.passwordChangedAt && decoded.iat) {
      const changedAt = user.passwordChangedAt.getTime();
      const tokenIssuedAt = decoded.iat * 1000;
      if (changedAt > tokenIssuedAt) {
        logger.warn({ userId: decoded.id }, "Refresh token rejected — password changed after token issued");
        throw new AppError(401, "Token invalidated by password change — please log in again");
      }
    }

    return user;
  });

  // Vydat nový token (mimo transakci)
  const payload: JwtPayload = { id: result.id, role: result.role, username: result.username };
  const newRefreshToken = signRefreshToken(payload);
  res.cookie("refreshToken", newRefreshToken, COOKIE_OPTIONS);
  res.json({ token: signToken(payload) });
}

export async function verifyEmailToken(req: AuthRequest, res: Response) {
  const { token } = req.body;
  if (!token) throw new AppError(400, "Token required");

  const { verifyEmail } = await import("../utils/emailVerification");
  const success = await verifyEmail(token);

  if (!success) throw new AppError(400, "Neplatný nebo expirovaný verifikační token");
  res.json({ success: true });
}

export async function resendVerification(req: AuthRequest, res: Response) {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) throw new AppError(404, "User not found");
  if (user.emailVerifiedAt) throw new AppError(400, "Email již je ověřen");

  await sendVerificationEmail(user.id, user.email);
  res.json({ success: true });
}

export async function forgotPassword(req: AuthRequest, res: Response) {
  const { email } = req.body;
  if (!email) throw new AppError(400, "Email is required");

  const { sendResetEmail } = await import("../utils/passwordReset");
  await sendResetEmail(email);

  // Vždy vrátíme success, i když email neexistuje (security)
  res.json({ success: true });
}

export async function resetPassword(req: AuthRequest, res: Response) {
  const { token, password } = req.body;
  if (!token || !password) throw new AppError(400, "Token and password are required");

  if (password.length < 8) throw new AppError(400, "Heslo musí mít alespoň 8 znaků");

  const bcrypt = await import("bcryptjs");
  const { verifyResetToken, clearResetToken } = await import("../utils/passwordReset");

  const user = await verifyResetToken(token);
  if (!user) throw new AppError(400, "Neplatný nebo expirovaný token");

  const hashed = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed, passwordChangedAt: new Date() },
  });
  // Po změně hesla: NEMAŽEME historii revokedTokenů — to by obnovilo dříve zneplatněné (kradené) tokeny.
  // Aktivní session vyprší přirozeně do 7 dnů (expirace refresh tokenu).
  // Pro okamžité odhlášení všech zařízení je potřeba přidat passwordChangedAt do User modelu
  // a kontrolovat jej při refreshi (vyžaduje migraci).

  await clearResetToken(user.id);

  // Odhlásit ze všech zařízení – smazat refresh token
  res.clearCookie("refreshToken", { path: "/api/auth" });

  res.json({ success: true });
}
