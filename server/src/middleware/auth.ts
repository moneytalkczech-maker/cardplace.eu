import { Request, Response, NextFunction } from "express";
import { verifyToken, JwtPayload } from "../utils/jwt";
import prisma from "../utils/prisma";
import logger from "../utils/logger";

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
  username?: string;
}

/**
 * Autentizace + kontrola ban/suspend statusu.
 * Zabanovaní nebo suspendovaní uživatelé jsou odmítnuti s 403.
 */
export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }
  const token = header.split(" ")[1];
  try {
    const decoded = verifyToken(token);
    req.userId = decoded.id;
    req.userRole = decoded.role;
    req.username = decoded.username;

    // Kontrola ban/suspend statusu — DB lookup per request
    // Cache by mohla být přidána pro produkci (Redis, TTL 60s)
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { status: true },
    });
    if (user?.status === "banned") {
      logger.warn({ userId: decoded.id }, "Banned user attempted to access API");
      return res.status(403).json({ error: "Account is banned" });
    }
    if (user?.status === "suspended") {
      logger.warn({ userId: decoded.id }, "Suspended user attempted to access API");
      return res.status(403).json({ error: "Account is suspended" });
    }

    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    const token = header.split(" ")[1];
    try {
      const decoded = verifyToken(token);
      req.userId = decoded.id;
      req.userRole = decoded.role;
    } catch (err) {
      logger.warn({ err }, "Optional auth: invalid token");
    }
  }
  next();
}

export function adminOnly(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.userRole?.toLowerCase() !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

export { JwtPayload };