import { Request, Response, NextFunction } from "express";
import { z, ZodSchema } from "zod";

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: err.errors });
      }
      return res.status(400).json({ error: "Invalid request body" });
    }
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: err.errors });
      }
      return res.status(400).json({ error: "Invalid query parameters" });
    }
  };
}

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email("Invalid email format").min(1, "Email required"),
  username: z.string().min(2, "Username must be at least 2 characters").max(30, "Username too long"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one digit"),
  referralCode: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format").min(1, "Email required"),
  password: z.string().min(1, "Password required"),
});

// Auction schemas
export const createAuctionSchema = z.object({
  title: z.string().min(1, "Title required").max(200, "Title too long"),
  description: z.string().optional(),
  imageUrl: z.string().url("Invalid image URL").optional(),
  startingPrice: z.coerce.number().positive("Starting price must be positive"),
  endTime: z.string().refine((v) => !isNaN(Date.parse(v)), { message: "Invalid date format" }),
  cardId: z.string().min(1, "Card ID required"),
});

export const bidSchema = z.object({
  amount: z.coerce.number().positive("Bid amount must be positive"),
});

// Collection schemas
export const addToCollectionSchema = z.object({
  cardId: z.string().min(1, "Card ID required"),
  cardName: z.string().min(1, "Card name required"),
  cardSet: z.string().optional(),
  cardRarity: z.enum(["common", "uncommon", "rare", "mythic", "special"]).optional(),
  cardImage: z.string().url("Invalid image URL").optional(),
  quantity: z.coerce.number().int().min(1).default(1),
  purchasePrice: z.coerce.number().positive("Purchase price must be positive").optional(),
  condition: z.enum(["NM", "LP", "MP", "HP", "PO", "D"]).default("NM"),
});

export const updateCollectionItemSchema = z.object({
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
});

// Wanted card schemas
export const createWantedSchema = z.object({
  cardId: z.string().min(1, "Card ID required"),
  cardName: z.string().min(1, "Card name required"),
  cardSet: z.string().optional(),
  description: z.string().optional(),
  maxPrice: z.coerce.number().positive("Max price must be positive").optional(),
});

// Transaction schema
export const completeTransactionSchema = z.object({
  auctionId: z.string().min(1, "Auction ID required"),
});

// Query schemas
export const auctionQuerySchema = z.object({
  status: z.string().optional(),
  search: z.string().optional(),
  category: z.string().optional(),
  sort: z.enum(["ending", "price-asc", "price-desc", "trending"]).optional(),
});

export const paginationSchema = z.object({
  cursor: z.string().optional(),
  take: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const auctionListSchema = auctionQuerySchema.merge(paginationSchema);