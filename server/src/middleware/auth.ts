import { Request, Response, NextFunction } from "express";
import { verifyToken, JwtPayload } from "../utils/jwt";
import logger from "../utils/logger";

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
  username?: string;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
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

export { JwtPayload };