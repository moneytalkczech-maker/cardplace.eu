import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import * as cardController from "../controllers/cardController";

const router = Router();

router.get("/search", asyncHandler(cardController.search));
router.post("/sync", authenticate, asyncHandler(cardController.sync));
router.get("/sets", asyncHandler(cardController.sets));
router.get("/price-history", asyncHandler(cardController.priceHistory));
router.get("/similar", asyncHandler(cardController.similarCards));

export default router;
