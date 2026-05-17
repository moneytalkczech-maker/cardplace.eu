import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authenticate, optionalAuth, AuthRequest } from "../middleware/auth";
import { validateBody, validateQuery, createAuctionSchema, bidSchema, auctionListSchema } from "../utils/validation";
import { asyncHandler } from "../middleware/errorHandler";
import * as auctionController from "../controllers/auctionController";

const router = Router();

// Rate limiters
const createAuctionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: "Příliš mnoho vytvořených aukcí, zkus to za hodinu" },
  standardHeaders: true,
  legacyHeaders: false,
});

const bidLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  message: { error: "Příliš mnoho příhozů, zkus to za 5 minut" },
  standardHeaders: true,
  legacyHeaders: false,
});

const boostLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Příliš mnoho boostů, zkus to za 15 minut" },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get("/", optionalAuth, validateQuery(auctionListSchema), asyncHandler(auctionController.list));
router.get("/featured", asyncHandler(auctionController.featured));
router.get("/trending", asyncHandler(auctionController.trending));
router.get("/last-sold", asyncHandler(auctionController.lastSold));
router.get("/:id", optionalAuth, asyncHandler(auctionController.getById));
router.post("/", authenticate, createAuctionLimiter, validateBody(createAuctionSchema), asyncHandler(auctionController.create));
router.post("/:id/bid", authenticate, bidLimiter, validateBody(bidSchema), asyncHandler(auctionController.placeBid));
router.post("/:id/buy-now", authenticate, asyncHandler(auctionController.buyNow));
router.post("/:id/boost", authenticate, boostLimiter, asyncHandler(auctionController.boost));
router.post("/:id/watch", authenticate, asyncHandler(auctionController.toggleWatch));
router.delete("/:id", authenticate, asyncHandler(auctionController.remove));

export default router;
