import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import * as ctrl from "../controllers/databaseCardsController";

const router = Router();

// Public
router.get("/", asyncHandler(ctrl.searchCards));
router.get("/:id", asyncHandler(ctrl.getCard));
router.get("/:id/prices", asyncHandler(ctrl.getPrices));
router.get("/:id/price-history", asyncHandler(ctrl.getPriceHistory));

// Admin
router.post("/", authenticate, asyncHandler(ctrl.createCard));
router.put("/:id", authenticate, asyncHandler(ctrl.updateCard));
router.delete("/:id", authenticate, asyncHandler(ctrl.deleteCard));
router.post("/:id/refresh-prices", authenticate, asyncHandler(ctrl.refreshPrice));
router.post("/refresh-prices", authenticate, asyncHandler(ctrl.refreshAllPrices));

export default router;
