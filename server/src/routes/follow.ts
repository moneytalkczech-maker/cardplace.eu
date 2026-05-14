import { Router } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import * as followController from "../controllers/followController";

const router = Router();

router.post("/:id", authenticate, asyncHandler(followController.toggleFollow));
router.get("/:id/check", authenticate, asyncHandler(followController.checkFollow));
router.get("/:id/followers", asyncHandler(followController.getFollowers));
router.get("/:id/following", asyncHandler(followController.getFollowing));

export default router;
