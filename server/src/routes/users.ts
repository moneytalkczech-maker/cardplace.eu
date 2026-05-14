import { Router } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import { validateBody, completeTransactionSchema } from "../utils/validation";
import { asyncHandler } from "../middleware/errorHandler";
import * as userController from "../controllers/userController";

const router = Router();

router.get("/profile/:id", asyncHandler(userController.getProfile));
router.get("/my-auctions", authenticate, asyncHandler(userController.getMyAuctions));
router.get("/my-bids", authenticate, asyncHandler(userController.getMyBids));
router.get("/watchlist", authenticate, asyncHandler(userController.getWatchlist));
router.get("/notifications", authenticate, asyncHandler(userController.getNotifications));
router.post("/notifications/read", authenticate, asyncHandler(userController.markNotificationsRead));
router.patch("/notifications/:id/read", authenticate, asyncHandler(userController.markNotificationRead));
router.post("/complete-transaction", authenticate, validateBody(completeTransactionSchema), asyncHandler(userController.completeTransaction));
router.get("/rank/:id", asyncHandler(userController.getRank));
router.post("/recalculate-trust", authenticate, asyncHandler(userController.recalculateTrust));
router.post("/daily-credit", authenticate, asyncHandler(userController.claimDailyCredit));

export default router;
