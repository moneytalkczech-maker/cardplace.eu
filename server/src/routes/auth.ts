import { Router } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { authenticate } from "../middleware/auth";
import { AuthRequest } from "../middleware/auth";
import { validateBody, registerSchema, loginSchema } from "../utils/validation";
import { asyncHandler } from "../middleware/errorHandler";
import * as authController from "../controllers/authController";

const skipLimiter = (req: any, _res: any, next: any) => next();

const loginLimiter = process.env.NODE_ENV === "test"
  ? skipLimiter
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 10,
      message: { error: "Příliš mnoho pokusů o přihlášení, zkus to za 15 minut" },
      standardHeaders: true,
      legacyHeaders: false,
    });

const registerLimiter = process.env.NODE_ENV === "test"
  ? skipLimiter
  : rateLimit({
      windowMs: 60 * 60 * 1000,
      max: 5,
      message: { error: "Příliš mnoho registrací, zkus to za hodinu" },
      standardHeaders: true,
      legacyHeaders: false,
    });

const router = Router();

router.post("/register", registerLimiter, validateBody(registerSchema), asyncHandler(authController.register));
router.post("/login", loginLimiter, validateBody(loginSchema), asyncHandler(authController.login));
router.get("/me", authenticate, asyncHandler(authController.me));
router.get("/referral-code", authenticate, asyncHandler(authController.getReferralCode));

const refreshSchema = z.object({ refreshToken: z.string().min(1) });
router.post("/refresh", validateBody(refreshSchema), asyncHandler(authController.refresh));

export default router;
