import { Router } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import * as paymentController from "../controllers/paymentController";

const router = Router();

router.post("/create-checkout", authenticate, asyncHandler(paymentController.createCheckoutSession));
router.post("/webhook", asyncHandler(paymentController.handleWebhook));
router.post("/review", authenticate, asyncHandler(paymentController.submitReview));
router.get("/reviews/:userId", asyncHandler(paymentController.getReviews));
router.get("/config", asyncHandler(paymentController.getConfig));

export default router;
