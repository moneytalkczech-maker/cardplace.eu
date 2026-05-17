import { Response } from "express";
import prisma from "../utils/prisma";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { createAuditLog } from "../utils/auditLog";
import logger from "../utils/logger";

export async function createReport(req: AuthRequest, res: Response) {
  const { auctionId, reason, description } = req.body;
  if (!auctionId || !reason) throw new AppError(400, "Auction ID and reason required");

  const validReasons = ["fake", "stolen_image", "scam", "inappropriate", "suspicious_price", "other"];
  if (!validReasons.includes(reason)) throw new AppError(400, "Invalid reason");

  // Limit délky popisu — prevence DoS a stored XSS
  if (description && description.length > 2000) {
    throw new AppError(400, "Popis je příliš dlouhý (max 2000 znaků)");
  }

  const report = await prisma.report.create({
    data: { auctionId, reporterId: req.userId!, reason, description },
  });

  await createAuditLog({
    userId: req.userId,
    action: "report.create",
    entityType: "report",
    entityId: report.id,
    metadata: { auctionId, reason },
    req,
  });

  res.json({ success: true, reportId: report.id });
}

export async function listReports(req: AuthRequest, res: Response) {
  const { status } = req.query as Record<string, string>;
  const where: any = {};
  if (status) where.status = status;

  const reports = await prisma.report.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      auction: { select: { id: true, title: true, status: true } },
      reporter: { select: { id: true, username: true } },
    },
    take: 100,
  });

  res.json(reports);
}

export async function updateReportStatus(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  const { status } = req.body;
  if (!["reviewed", "resolved", "rejected"].includes(status)) {
    throw new AppError(400, "Invalid status value");
  }
  const report = await prisma.report.findUnique({ where: { id } });
  if (!report) throw new AppError(404, "Report not found");
  const updated = await prisma.report.update({ where: { id }, data: { status } });
  res.json(updated);
}
