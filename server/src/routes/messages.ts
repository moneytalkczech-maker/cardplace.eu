import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import * as ctrl from "../controllers/messages";

const router = Router();

const sendLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: "Příliš mnoho zpráv, zkus to za minutu" },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
});

router.get("/", authenticate, asyncHandler(ctrl.listConversations));
router.get("/unread", authenticate, asyncHandler(ctrl.getUnreadCount));
router.post("/with/:otherUserId", authenticate, asyncHandler(ctrl.getOrCreateConversation));
router.get("/:conversationId", authenticate, asyncHandler(ctrl.getMessages));
router.post("/:conversationId", authenticate, sendLimiter, asyncHandler(ctrl.sendMessage));

export default router;
