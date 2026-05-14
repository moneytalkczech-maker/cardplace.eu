import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import * as cardController from "../controllers/cardController";

const router = Router();

router.get("/search", asyncHandler(cardController.search));
router.post("/sync", authenticate, asyncHandler(cardController.sync));
router.get("/sets", asyncHandler(cardController.sets));

export default router;
