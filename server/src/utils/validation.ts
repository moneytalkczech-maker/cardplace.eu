import { Request, Response, NextFunction } from "express";
import { z, ZodSchema } from "zod";
import logger from "../utils/logger";

const isProd = process.env.NODE_ENV === "production";

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        // V produkci skrýt detaily validačních chyb (prevence information disclosure)
        if (isProd) {
          logger.warn({ errors: err.errors, path: req.path }, "Validation failed");
          return res.status(400).json({ error: "Invalid request" });
        }
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
        if (isProd) {
          logger.warn({ errors: err.errors, path: req.path }, "Query validation failed");
          return res.status(400).json({ error: "Invalid request" });
        }
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
  acceptedTerms: z.boolean().refine((v) => v === true, { message: "Je nutné souhlasit s obchodními podmínkami" }),
  acceptedPrivacy: z.boolean().refine((v) => v === true, { message: "Je nutné souhlasit se zpracováním osobních údajů" }),
  confirmedAge: z.boolean().refine((v) => v === true, { message: "Musíte být starší 18 let" }),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format").min(1, "Email required"),
  password: z.string().min(1, "Password required"),
});

// Auction schemas
export const createAuctionSchema = z.object({
  title: z.string().min(1, "Title required").max(200, "Title too long"),
  description: z.string().max(5000, "Description too long").optional(),
  imageUrl: z.string().url("Invalid image URL").optional(),
  startingPrice: z.coerce.number().positive("Starting price must be positive"),
  buyNowPrice: z.coerce.number().positive("Buy now price must be positive").optional(),
  endTime: z.string().refine((v) => !isNaN(Date.parse(v)), { message: "Invalid date format" })
    .refine((v) => new Date(v) > new Date(), { message: "End time must be in the future" }),
  cardId: z.string().optional(),
  confirmedOriginal: z.boolean().refine((v) => v === true, { message: "Je nutné potvrdit originalitu položky" }),
}).refine((data) => {
  // Buy now cena musí být vyšší než vyvolávací cena
  if (data.buyNowPrice && data.buyNowPrice <= data.startingPrice) {
    return false;
  }
  return true;
}, { message: "Buy now cena musí být vyšší než vyvolávací cena" });

export const bidSchema = z.object({
  amount: z.coerce.number().positive("Bid amount must be positive"),
  maxBid: z.coerce.number().positive("Max bid must be positive").optional(),
});

// Collection schemas
export const addToCollectionSchema = z.object({
  cardId: z.string().min(1, "Card ID required"),
  cardName: z.string().min(1, "Card name required"),
  cardSet: z.string().optional(),
  cardRarity: z.string().optional(),
  cardImage: z.string().optional(),
  quantity: z.coerce.number().int().min(1).default(1),
  purchasePrice: z.coerce.number().optional(),
  marketValue: z.coerce.number().optional(),
  condition: z.string().optional(),
  notes: z.string().max(500).optional(),
  category: z.string().optional(),
});

export const updateCollectionItemSchema = z.object({
  quantity: z.coerce.number().int().min(0).optional(),
  condition: z.string().optional(),
  notes: z.string().max(500).optional(),
  marketValue: z.coerce.number().optional(),
  purchasePrice: z.coerce.number().optional(),
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
  auctionId: z.string().min(1, "Auction ID required").max(100, "Auction ID too long"),
});

// Query schemas
export const auctionQuerySchema = z.object({
  status: z.string().max(50).optional(),
  search: z.string().max(200, "Search query too long").optional(),
  category: z.enum(["pokemon", "magic", "yugioh", "sports", "other"]).optional(),
  sort: z.enum(["ending", "price-asc", "price-desc", "trending"]).optional(),
});

export const paginationSchema = z.object({
  cursor: z.string().optional(),
  take: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const auctionListSchema = auctionQuerySchema.merge(paginationSchema);