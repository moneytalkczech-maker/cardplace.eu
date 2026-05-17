import { Router } from "express";
import { authenticate, adminOnly } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import * as ctrl from "../controllers/databaseCardsController";

const router = Router();

// Public
router.get("/", asyncHandler(ctrl.searchCards));
router.get("/:id", asyncHandler(ctrl.getCard));
router.get("/:id/prices", asyncHandler(ctrl.getPrices));
router.get("/:id/price-history", asyncHandler(ctrl.getPriceHistory));

// Admin
router.post("/", authenticate, adminOnly, asyncHandler(ctrl.createCard));
router.put("/:id", authenticate, adminOnly, asyncHandler(ctrl.updateCard));
router.delete("/:id", authenticate, adminOnly, asyncHandler(ctrl.deleteCard));
router.post("/:id/refresh-prices", authenticate, adminOnly, asyncHandler(ctrl.refreshPrice));
router.post("/refresh-prices", authenticate, adminOnly, asyncHandler(ctrl.refreshAllPrices));

export default router;
