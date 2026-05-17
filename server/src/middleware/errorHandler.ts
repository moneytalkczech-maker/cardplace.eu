import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import logger from "../utils/logger";

export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = "AppError";
  }
}

export function asyncHandler<T extends Request = Request>(fn: (req: T, res: Response, next: NextFunction) => Promise<any>) {
  return (req: T, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

const PRISMA_ERROR_CODES: Record<string, { status: number; message: string }> = {
  P2000: { status: 400, message: "Value too long for column" },
  P2001: { status: 404, message: "Record not found" },
  P2002: { status: 409, message: "Tento záznam již existuje" },
  P2003: { status: 400, message: "Neplatný referenční záznam" },
  P2025: { status: 404, message: "Záznam nenalezen" },
};

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  // AppError — známé chyby
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Prisma chyby — překlad na uživatelsky přívětivé zprávy
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code in PRISMA_ERROR_CODES) {
    const mapping = PRISMA_ERROR_CODES[err.code];
    // U P2002 zkusíme extrahovat který field selhal
    let message = mapping.message;
    if (err.code === "P2002" && err.meta?.target) {
      const fields = (err.meta.target as string[]).join(", ");
      message = `Záznam s tímto ${fields} již existuje`;
    }
    return res.status(mapping.status).json({ error: message, code: err.code });
  }

  // Neznámé chyby
  logger.error({ err, stack: err.stack }, "Unhandled error");
  return res.status(500).json({ error: "Internal server error" });
}
