import { Router } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import { validateBody, createWantedSchema } from "../utils/validation";
import { asyncHandler } from "../middleware/errorHandler";
import * as wantedController from "../controllers/wantedController";

const router = Router();

router.get("/", asyncHandler(wantedController.list));
router.post("/", authenticate, validateBody(createWantedSchema), asyncHandler(wantedController.create));
router.delete("/:id", authenticate, asyncHandler(wantedController.remove));

export default router;
