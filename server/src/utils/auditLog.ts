import prisma from "./prisma";
import { Request } from "express";

export async function createAuditLog(params: {
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
  req?: Request;
}) {
  try {
    const ipAddress = params.req
      ? (params.req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
        params.req.socket?.remoteAddress ||
        null
      : null;
    const userAgent = params.req ? (params.req.headers["user-agent"] as string) || null : null;

    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        ipAddress,
        userAgent,
      },
    });
  } catch {
    // Audit log nesmí nikdy shodit aplikaci
  }
}
