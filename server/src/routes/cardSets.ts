import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import * as ctrl from "../controllers/cardSetsController";

const router = Router();

// Public
router.get("/", asyncHandler(ctrl.listSets));
router.get("/:id", asyncHandler(ctrl.getSet));

// Admin
router.post("/", authenticate, asyncHandler(ctrl.createSet));
router.put("/:id", authenticate, asyncHandler(ctrl.updateSet));
router.delete("/:id", authenticate, asyncHandler(ctrl.deleteSet));
router.post("/import", authenticate, asyncHandler(ctrl.importCsv));

export default router;
