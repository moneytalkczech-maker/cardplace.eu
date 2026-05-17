import { Response } from "express";
import path from "path";
import fs from "fs";
import prisma from "../utils/prisma";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { createAuditLog } from "../utils/auditLog";
import logger from "../utils/logger";

export async function listUsers(req: AuthRequest, res: Response) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true, email: true, username: true, role: true,
        trustScore: true, verified: true, totalSales: true, createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.user.count(),
  ]);

  res.json({
    data: users,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function updateUserRole(req: AuthRequest, res: Response) {
  const { role } = req.body;
  if (!role || typeof role !== "string") throw new AppError(400, "Role is required");
  const normalizedRole = role.toLowerCase();
  if (!["user", "seller", "admin"].includes(normalizedRole)) throw new AppError(400, "Invalid role");

  const targetUser = await prisma.user.findUnique({ where: { id: req.params.id as string } });
  if (!targetUser) throw new AppError(404, "User not found");
  if (targetUser.role === "admin" && normalizedRole !== "admin") {
    // Prevence nechtěné de-escalace admina
    throw new AppError(400, "Cannot remove admin role — use dedicated admin management");
  }

  const user = await prisma.user.update({
    where: { id: req.params.id as string },
    data: { role: normalizedRole },
    select: { id: true, email: true, username: true, role: true },
  });

  await createAuditLog({
    userId: req.userId,
    action: "admin.updateUserRole",
    entityType: "user",
    entityId: user.id,
    metadata: { username: user.username, previousRole: targetUser.role, newRole: normalizedRole },
    req,
  });

  logger.info({ userId: user.id, newRole: normalizedRole }, "User role updated by admin");
  res.json(user);
}

export async function toggleUserVerification(req: AuthRequest, res: Response) {
  const user = await prisma.user.findUnique({ where: { id: req.params.id as string } });
  if (!user) throw new AppError(404, "User not found");
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { verified: !user.verified },
    select: { id: true, username: true, verified: true },
  });

  await createAuditLog({
    userId: req.userId,
    action: updated.verified ? "admin.verifyUser" : "admin.unverifyUser",
    entityType: "user",
    entityId: user.id,
    metadata: { username: user.username },
    req,
  });

  res.json(updated);
}

export async function deleteUser(req: AuthRequest, res: Response) {
  const id = req.params.id as string;

  // Nejprve načíst cesty k souborům (před transakcí)
  const uploads = await prisma.upload.findMany({ where: { userId: id }, select: { path: true } });

  // 1. Smazat všechna data v transakci — pokud selže, soubory zůstanou
  await prisma.$transaction([
    // Hodnocení (given i received)
    prisma.review.deleteMany({ where: { OR: [{ reviewerId: id }, { reviewedId: id }] } }),
    // Transakce (jako buyer i seller)
    prisma.transaction.deleteMany({ where: { OR: [{ buyerId: id }, { sellerId: id }] } }),
    // Follow (oba směry)
    prisma.follow.deleteMany({ where: { OR: [{ followerId: id }, { followingId: id }] } }),
    // Poptávky
    prisma.wantedCard.deleteMany({ where: { userId: id } }),
    // Promotions
    prisma.promotion.deleteMany({ where: { userId: id } }),
    // Subscription
    prisma.subscription.deleteMany({ where: { userId: id } }),
    // Admin notes
    prisma.adminNote.deleteMany({ where: { authorId: id } }),
    // Audit logy — NEMAŽEME, pouze anonymizujeme
    // prisma.auditLog.deleteMany({ where: { userId: id } }),
    prisma.auditLog.updateMany({ where: { userId: id }, data: { userId: null } }),
    // Upload záznamy
    prisma.upload.deleteMany({ where: { userId: id } }),
    // Referral (jako referrer i referred)
    prisma.referral.deleteMany({ where: { OR: [{ referrerId: id }, { referredId: id }] } }),
    // Notifikace
    prisma.notification.deleteMany({ where: { userId: id } }),
    // Watchlist
    prisma.watchlist.deleteMany({ where: { userId: id } }),
    // Collection
    prisma.collectionItem.deleteMany({ where: { userId: id } }),
    // Reporty (kde je reporter)
    prisma.report.deleteMany({ where: { reporterId: id } }),
    // Příhozy
    prisma.bid.deleteMany({ where: { userId: id } }),
    // Aukce
    prisma.auction.deleteMany({ where: { userId: id } }),
    // Revoked tokens
    prisma.revokedToken.deleteMany({ where: { userId: id } }),
    // Samotný user
    prisma.user.delete({ where: { id } }),
  ]);

  // 2. Smazat fyzické soubory AŽ PO úspěšné transakci
  for (const u of uploads) {
    const filePath = path.join(__dirname, "../../", u.path);
    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch { /* file may not exist */ }
  }

  await createAuditLog({
    userId: req.userId,
    action: "admin.deleteUser",
    entityType: "user",
    entityId: id,
    metadata: { reason: "Admin deletion" },
    req,
  });

  logger.info({ userId: id }, "User and all related data deleted by admin");
  res.json({ success: true });
}

export async function listAuctions(req: AuthRequest, res: Response) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
  const skip = (page - 1) * limit;

  const [auctions, total] = await Promise.all([
    prisma.auction.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, username: true } },
        _count: { select: { bids: true } },
      },
      skip,
      take: limit,
    }),
    prisma.auction.count(),
  ]);

  res.json({
    data: auctions,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function cancelAuction(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  const auction = await prisma.auction.findUnique({
    where: { id },
    include: { transaction: { select: { status: true } } },
  });
  if (!auction) throw new AppError(404, "Auction not found");
  if (auction.transaction?.status === "COMPLETED") {
    throw new AppError(400, "Cannot cancel an auction with a completed transaction");
  }
  await prisma.auction.update({ where: { id }, data: { status: "CANCELLED" } });

  await createAuditLog({
    userId: req.userId,
    action: "admin.cancelAuction",
    entityType: "auction",
    entityId: id,
    metadata: { title: auction.title, previousStatus: auction.status },
    req,
  });

  logger.info({ auctionId: id }, "Auction cancelled by admin");
  res.json({ success: true });
}

export async function listAuditLogs(req: AuthRequest, res: Response) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        user: { select: { id: true, username: true } },
      },
    }),
    prisma.auditLog.count(),
  ]);

  res.json({ data: logs, total, page, totalPages: Math.ceil(total / limit) });
}

export async function listBids(req: AuthRequest, res: Response) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
  const skip = (page - 1) * limit;

  const [bids, total] = await Promise.all([
    prisma.bid.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        user: { select: { id: true, username: true } },
        auction: { select: { id: true, title: true } },
      },
    }),
    prisma.bid.count(),
  ]);

  res.json({ data: bids, total, page, totalPages: Math.ceil(total / limit) });
}

export async function listSettings(_req: AuthRequest, res: Response) {
  const settings = await prisma.siteSetting.findMany({ orderBy: [{ group: "asc" }, { key: "asc" }] });
  res.json(settings);
}

export async function updateSetting(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  const { value } = req.body;
  if (value === undefined || value === null) throw new AppError(400, "Value is required");
  if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") {
    throw new AppError(400, "Value must be a string, number, or boolean");
  }
  // Omezit délku hodnoty — prevence DoS
  const strValue = String(value);
  if (strValue.length > 10000) throw new AppError(400, "Value too long (max 10000 characters)");

  const existing = await prisma.siteSetting.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "Setting not found");

  const setting = await prisma.siteSetting.update({
    where: { id },
    data: { value: strValue },
  });

  await createAuditLog({
    userId: req.userId,
    action: "admin.updateSetting",
    entityType: "setting",
    entityId: id,
    metadata: { key: setting.key, previousValue: existing.value, newValue: strValue },
    req,
  });

  logger.info({ key: setting.key }, "Site setting updated by admin");
  res.json(setting);
}

export async function getStats(_req: AuthRequest, res: Response) {
  const [users, auctions, bids, transactions, collections] = await Promise.all([
    prisma.user.count(),
    prisma.auction.count(),
    prisma.bid.count(),
    prisma.transaction.count(),
    prisma.collectionItem.count(),
  ]);
  res.json({ users, auctions, bids, transactions, collections });
}

export async function toggleUserBan(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError(404, "User not found");
  if (user.role === "admin") throw new AppError(403, "Cannot ban another admin");

  const newStatus = user.status === "banned" ? "active" : "banned";
  const updated = await prisma.user.update({
    where: { id },
    data: { status: newStatus },
    select: { id: true, username: true, status: true },
  });

  await createAuditLog({
    userId: req.userId,
    action: newStatus === "banned" ? "user.ban" : "user.unban",
    entityType: "user",
    entityId: id,
    metadata: { username: user.username, previousStatus: user.status },
    req,
  });

  logger.info({ userId: id, newStatus }, "User status toggled by admin");
  res.json(updated);
}

export async function toggleAuctionFeature(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  const auction = await prisma.auction.findUnique({ where: { id } });
  if (!auction) throw new AppError(404, "Auction not found");

  const updated = await prisma.auction.update({
    where: { id },
    data: { featured: !auction.featured },
    select: { id: true, title: true, featured: true },
  });

  await createAuditLog({
    userId: req.userId,
    action: updated.featured ? "auction.feature" : "auction.unfeature",
    entityType: "auction",
    entityId: id,
    metadata: { title: auction.title },
    req,
  });

  logger.info({ auctionId: id, featured: updated.featured }, "Auction featured status toggled by admin");
  res.json(updated);
}

// ─── Cards (admin) ─────────────────────────────────────────────

export async function listCards(req: AuthRequest, res: Response) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
  const skip = (page - 1) * limit;
  const search = (req.query.search as string) || "";

  const where = search
    ? { OR: [{ name: { contains: search, mode: "insensitive" as const } }, { setName: { contains: search, mode: "insensitive" as const } }] }
    : {};

  const [cards, total] = await Promise.all([
    prisma.card.findMany({
      where,
      orderBy: { id: "desc" },
      skip,
      take: limit,
      include: { _count: { select: { auctions: true } } },
    }),
    prisma.card.count({ where }),
  ]);

  res.json({ data: cards, total, page, totalPages: Math.ceil(total / limit) });
}

export async function updateCardStatus(req: AuthRequest, res: Response) {
  const { status } = req.body;
  if (!["active", "archived", "hidden"].includes(status)) throw new AppError(400, "Invalid status");
  const card = await prisma.card.update({
    where: { id: req.params.id as string },
    data: { status },
    select: { id: true, name: true, status: true },
  });

  await createAuditLog({
    userId: req.userId,
    action: "admin.updateCardStatus",
    entityType: "card",
    entityId: card.id,
    metadata: { name: card.name, newStatus: status },
    req,
  });

  logger.info({ cardId: card.id, status }, "Card status updated by admin");
  res.json(card);
}

export async function deleteCard(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  const card = await prisma.card.findUnique({ where: { id }, select: { name: true } });
  await prisma.card.delete({ where: { id } });

  await createAuditLog({
    userId: req.userId,
    action: "admin.deleteCard",
    entityType: "card",
    entityId: id,
    metadata: { name: card?.name },
    req,
  });

  logger.info({ cardId: id }, "Card deleted by admin");
  res.json({ success: true });
}

// ─── Card Database (admin) ─────────────────────────────────────

export async function listDatabaseCards(req: AuthRequest, res: Response) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
  const skip = (page - 1) * limit;
  const search = (req.query.search as string) || "";

  const where = search
    ? { OR: [{ name: { contains: search, mode: "insensitive" as const } }, { playerName: { contains: search, mode: "insensitive" as const } }] }
    : {};

  const [cards, total] = await Promise.all([
    prisma.databaseCard.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: { set: { select: { name: true, category: true } } },
    }),
    prisma.databaseCard.count({ where }),
  ]);

  res.json({ data: cards, total, page, totalPages: Math.ceil(total / limit) });
}

export async function deleteDatabaseCard(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  const card = await prisma.databaseCard.findUnique({ where: { id }, select: { name: true } });
  await prisma.databaseCard.delete({ where: { id } });

  await createAuditLog({
    userId: req.userId,
    action: "admin.deleteDatabaseCard",
    entityType: "databaseCard",
    entityId: id,
    metadata: { name: card?.name },
    req,
  });

  logger.info({ cardId: id }, "Database card deleted by admin");
  res.json({ success: true });
}

// ─── Uploads (admin) ─────────────────────────────────────────

export async function listUploads(req: AuthRequest, res: Response) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
  const skip = (page - 1) * limit;

  const [uploads, total] = await Promise.all([
    prisma.upload.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: { user: { select: { id: true, username: true } } },
    }),
    prisma.upload.count(),
  ]);

  res.json({ data: uploads, total, page, totalPages: Math.ceil(total / limit) });
}

export async function deleteUpload(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  const upload = await prisma.upload.findUnique({ where: { id } });
  if (!upload) throw new AppError(404, "Upload not found");

  // 1. Smazat DB záznam nejdřív — pokud selže, soubor zůstane
  await prisma.upload.delete({ where: { id } });

  // 2. Smazat fyzický soubor až po úspěšném DB delete
  const filePath = path.join(__dirname, "../../", upload.path);
  try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch { /* ignore — orphan file, can be cleaned up later */ }

  await createAuditLog({
    userId: req.userId,
    action: "admin.deleteUpload",
    entityType: "upload",
    entityId: id,
    metadata: { filename: upload.originalName, userId: upload.userId },
    req,
  });

  logger.info({ uploadId: id }, "Upload deleted by admin");
  res.json({ success: true });
}

// ─── Email Templates (admin) ─────────────────────────────────

export async function listEmailTemplates(_req: AuthRequest, res: Response) {
  const templates = await prisma.emailTemplate.findMany({ orderBy: { key: "asc" } });
  res.json(templates);
}

export async function updateEmailTemplate(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  const { subject, bodyHtml } = req.body;
  if (!subject && !bodyHtml) throw new AppError(400, "Subject or bodyHtml required");

  // Validace délky — prevence DoS
  if (subject && subject.length > 500) throw new AppError(400, "Subject too long (max 500 characters)");
  if (bodyHtml && bodyHtml.length > 50000) throw new AppError(400, "Body too long (max 50000 characters)");

  const existing = await prisma.emailTemplate.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "Email template not found");

  const data: Record<string, string> = {};
  if (subject !== undefined) data.subject = subject;
  if (bodyHtml !== undefined) data.bodyHtml = bodyHtml;
  const template = await prisma.emailTemplate.update({ where: { id }, data });

  await createAuditLog({
    userId: req.userId,
    action: "admin.updateEmailTemplate",
    entityType: "emailTemplate",
    entityId: id,
    metadata: { key: template.key, subjectChanged: !!subject, bodyChanged: !!bodyHtml },
    req,
  });

  logger.info({ templateId: id }, "Email template updated by admin");
  res.json(template);
}

// ─── Legal Documents (admin) ─────────────────────────────────

export async function listLegalDocuments(_req: AuthRequest, res: Response) {
  const docs = await prisma.legalDocument.findMany({ orderBy: [{ locale: "asc" }, { slug: "asc" }] });
  res.json(docs);
}

export async function updateLegalDocument(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  const { title, content, published } = req.body;
  if (!title && !content && published === undefined) throw new AppError(400, "Nothing to update");

  // Validace délky
  if (title && title.length > 500) throw new AppError(400, "Title too long (max 500 characters)");
  if (content && content.length > 100000) throw new AppError(400, "Content too long (max 100000 characters)");

  const existing = await prisma.legalDocument.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "Legal document not found");

  const data: Record<string, unknown> = {};
  if (title !== undefined) data.title = title;
  if (content !== undefined) data.content = content;
  if (published !== undefined) {
    data.published = published;
    data.publishedAt = published ? new Date() : null;
    data.version = { increment: 1 };
  }
  const doc = await prisma.legalDocument.update({ where: { id }, data });

  await createAuditLog({
    userId: req.userId,
    action: "admin.updateLegalDocument",
    entityType: "legalDocument",
    entityId: id,
    metadata: { slug: doc.slug, version: doc.version, published: doc.published },
    req,
  });

  logger.info({ docId: id }, "Legal document updated by admin");
  res.json(doc);
}

// ─── System Info (admin) ──────────────────────────────────────

export async function getSystemInfo(_req: AuthRequest, res: Response) {
  const [userCount, auctionCount, bidCount, transactionCount, uploadCount, cardCount, dbCardCount, templateCount, docCount] = await Promise.all([
    prisma.user.count(),
    prisma.auction.count(),
    prisma.bid.count(),
    prisma.transaction.count(),
    prisma.upload.count(),
    prisma.card.count(),
    prisma.databaseCard.count(),
    prisma.emailTemplate.count(),
    prisma.legalDocument.count(),
  ]);

  res.json({
    counts: {
      users: userCount,
      auctions: auctionCount,
      bids: bidCount,
      transactions: transactionCount,
      uploads: uploadCount,
      cards: cardCount,
      databaseCards: dbCardCount,
      emailTemplates: templateCount,
      legalDocuments: docCount,
    },
    nodeVersion: process.version,
    platform: process.platform,
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime(),
  });
}

// ─── Security Settings (admin) ────────────────────────────────

export async function getSecuritySettings(_req: AuthRequest, res: Response) {
  const settings = await prisma.siteSetting.findMany({
    where: { group: "security" },
    orderBy: { key: "asc" },
  });

  // If no security settings exist yet, return defaults
  if (settings.length === 0) {
    const defaults = [
      { id: "max-login-attempts", key: "max_login_attempts", value: "5", type: "number", group: "security", description: "Maximální počet pokusů o přihlášení" },
      { id: "lockout-duration", key: "lockout_duration", value: "15", type: "number", group: "security", description: "Doba zablokování (minuty)" },
      { id: "require-email-verify", key: "require_email_verify", value: "false", type: "boolean", group: "security", description: "Vyžadovat ověření emailu" },
      { id: "rate-limit-auth", key: "rate_limit_auth", value: "10", type: "number", group: "security", description: "Rate limit pro auth endpointy (za minutu)" },
    ];
    return res.json(defaults);
  }

  res.json(settings);
}

export async function updateSecuritySetting(req: AuthRequest, res: Response) {
  const { key, value } = req.body;
  if (!key || value === undefined) throw new AppError(400, "Key and value required");
  if (typeof key !== "string" || key.length > 100) throw new AppError(400, "Invalid key");
  if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") {
    throw new AppError(400, "Value must be a string, number, or boolean");
  }

  const existing = await prisma.siteSetting.findUnique({ where: { key } });

  const setting = await prisma.siteSetting.upsert({
    where: { key },
    update: { value: String(value) },
    create: { key, value: String(value), type: "string", group: "security" },
  });

  await createAuditLog({
    userId: req.userId,
    action: "admin.updateSecuritySetting",
    entityType: "securitySetting",
    entityId: setting.id,
    metadata: { key, previousValue: existing?.value, newValue: String(value) },
    req,
  });

  logger.info({ key, value }, "Security setting updated by admin");
  res.json(setting);
}

// ─── Card Data Sources (AI) ──────────────────────────────────

export async function listCardDataSources(_req: AuthRequest, res: Response) {
  const sources = await prisma.cardDataSource.findMany({ orderBy: { name: "asc" } });
  res.json(sources);
}
