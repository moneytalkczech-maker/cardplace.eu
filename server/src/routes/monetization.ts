import { Router } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import * as mc from "../controllers/monetizationController";

const router = Router();

// Public prices for frontend
router.get("/prices", asyncHandler(async (_req, res) => {
  const config = await (await import("../utils/fees")).ensureMonetizationConfig();
  res.json({
    vipMonthly: config.vipMonthly,
    vipYearly: config.vipYearly,
    verifiedPrice: config.verifiedPrice,
    boostTop: config.boostTop,
    boostHomepage: config.boostHomepage,
    boostHighlight: config.boostHighlight,
    boostSocial: config.boostSocial,
    feePhase: config.feePhase,
  });
}));

// Admin config
router.get("/config", authenticate, asyncHandler(mc.getConfig));
router.patch("/config", authenticate, asyncHandler(mc.updateConfig));

// Founder program
router.get("/founders", asyncHandler(mc.listFounders));
router.post("/founders/assign", authenticate, asyncHandler(mc.assignFounder));

// VIP
router.post("/vip/create-checkout", authenticate, asyncHandler(mc.createVipCheckout));

// Verified
router.post("/verified/create-checkout", authenticate, asyncHandler(mc.createVerifiedCheckout));

// Boost
router.post("/boost/create-checkout", authenticate, asyncHandler(mc.createBoostCheckout));

// Webhook (raw body pro Stripe)
router.post("/webhook", asyncHandler(mc.handleMonetizationWebhook));

export default router;
