import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authenticate, AuthRequest } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import * as paymentController from "../controllers/paymentController";

const router = Router();

const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Příliš mnoho pokusů o platbu, zkus to za 15 minut" },
  standardHeaders: true,
  legacyHeaders: false,
});

const reviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: "Příliš mnoho recenzí, zkus to za hodinu" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Webhook rate limiter — vyšší limit, ale stále chrání proti floodingu
// Stripe webhook je veřejný endpoint bez autentizace
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: "Too many webhook requests" },
  standardHeaders: true,
  legacyHeaders: false,
  // Rate limit podle IP — Stripe má známé IP rozsahy
  keyGenerator: (req) => req.ip || "unknown",
});

router.post("/create-checkout", authenticate, checkoutLimiter, asyncHandler(paymentController.createCheckoutSession));
router.post("/webhook", webhookLimiter, asyncHandler(paymentController.handleWebhook));
router.post("/review", authenticate, reviewLimiter, asyncHandler(paymentController.submitReview));
router.get("/reviews/:userId", asyncHandler(paymentController.getReviews));
router.get("/config", asyncHandler(paymentController.getConfig));

export default router;
