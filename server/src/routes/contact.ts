import { Router } from "express";
import rateLimit from "express-rate-limit";
import { asyncHandler } from "../middleware/errorHandler";
import { submitContact } from "../controllers/contactController";

const router = Router();

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { error: "Příliš mnoho zpráv, zkus to za hodinu" },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/", contactLimiter, asyncHandler(submitContact));

export default router;
