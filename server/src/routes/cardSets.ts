import { Router } from "express";
import { authenticate, adminOnly } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import * as ctrl from "../controllers/cardSetsController";

const router = Router();

// Public
router.get("/", asyncHandler(ctrl.listSets));
router.get("/:id", asyncHandler(ctrl.getSet));

// Admin
router.post("/", authenticate, adminOnly, asyncHandler(ctrl.createSet));
router.put("/:id", authenticate, adminOnly, asyncHandler(ctrl.updateSet));
router.delete("/:id", authenticate, adminOnly, asyncHandler(ctrl.deleteSet));
router.post("/import", authenticate, adminOnly, asyncHandler(ctrl.importCsv));

export default router;
