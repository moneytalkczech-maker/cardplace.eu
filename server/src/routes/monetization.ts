import { Router } from "express";
import { authenticate, adminOnly, AuthRequest } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import * as mc from "../controllers/monetizationController";

const router = Router();

// Public prices for frontend
router.get("/prices", asyncHandler(async (_req, res) => {
  const { ensureMonetizationConfig } = await import("../utils/fees");
  const config = await ensureMonetizationConfig();
  res.json({
    vipMonthly: config?.vipMonthly ?? 199,
    vipYearly: config?.vipYearly ?? 1990,
    verifiedPrice: config?.verifiedPrice ?? 199,
    boostTop: config?.boostTop ?? 19,
    boostHomepage: config?.boostHomepage ?? 49,
    boostHighlight: config?.boostHighlight ?? 15,
    boostSocial: config?.boostSocial ?? 99,
    feePhase: config?.feePhase ?? "phase1",
  });
}));

// Admin config
router.get("/config", authenticate, adminOnly, asyncHandler(mc.getConfig));
router.patch("/config", authenticate, adminOnly, asyncHandler(mc.updateConfig));

// Founder program
router.get("/founders", asyncHandler(mc.listFounders));
router.post("/founders/assign", authenticate, adminOnly, asyncHandler(mc.assignFounder));

// VIP
router.post("/vip/create-checkout", authenticate, asyncHandler(mc.createVipCheckout));

// Verified
router.post("/verified/create-checkout", authenticate, asyncHandler(mc.createVerifiedCheckout));

// Boost
router.post("/boost/create-checkout", authenticate, asyncHandler(mc.createBoostCheckout));

// Webhook (raw body pro Stripe)
router.post("/webhook", asyncHandler(mc.handleMonetizationWebhook));

export default router;
