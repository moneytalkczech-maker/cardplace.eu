import { Router } from "express";
import { authenticate, optionalAuth, AuthRequest } from "../middleware/auth";
import { validateBody, validateQuery, createAuctionSchema, bidSchema, auctionListSchema } from "../utils/validation";
import { asyncHandler } from "../middleware/errorHandler";
import * as auctionController from "../controllers/auctionController";

const router = Router();

router.get("/", optionalAuth, validateQuery(auctionListSchema), asyncHandler(auctionController.list));
router.get("/featured", asyncHandler(auctionController.featured));
router.get("/trending", asyncHandler(auctionController.trending));
router.get("/last-sold", asyncHandler(auctionController.lastSold));
router.get("/:id", optionalAuth, asyncHandler(auctionController.getById));
router.post("/", authenticate, validateBody(createAuctionSchema), asyncHandler(auctionController.create));
router.post("/:id/bid", authenticate, validateBody(bidSchema), asyncHandler(auctionController.placeBid));
router.post("/:id/boost", authenticate, asyncHandler(auctionController.boost));
router.post("/:id/watch", authenticate, asyncHandler(auctionController.toggleWatch));
router.delete("/:id", authenticate, asyncHandler(auctionController.remove));

export default router;
