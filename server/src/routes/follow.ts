import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authenticate, AuthRequest } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import * as followController from "../controllers/followController";

const router = Router();

const followLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: "Příliš mnoho follow akcí, zkus to za 15 minut" },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/:id", authenticate, followLimiter, asyncHandler(followController.toggleFollow));
router.get("/:id/check", authenticate, asyncHandler(followController.checkFollow));
router.get("/:id/followers", asyncHandler(followController.getFollowers));
router.get("/:id/following", asyncHandler(followController.getFollowing));

export default router;
