import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authenticate, AuthRequest } from "../middleware/auth";
import { validateBody, createWantedSchema } from "../utils/validation";
import { asyncHandler } from "../middleware/errorHandler";
import * as wantedController from "../controllers/wantedController";

const router = Router();

const createWantedLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Příliš mnoho poptávek, zkus to za 15 minut" },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get("/", asyncHandler(wantedController.list));
router.post("/", authenticate, createWantedLimiter, validateBody(createWantedSchema), asyncHandler(wantedController.create));
router.delete("/:id", authenticate, asyncHandler(wantedController.remove));

export default router;
