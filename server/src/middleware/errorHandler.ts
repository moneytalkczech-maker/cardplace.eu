import { Request, Response, NextFunction } from "express";
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

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  logger.error({ err }, "Unhandled error");
  return res.status(500).json({ error: "Internal server error" });
}