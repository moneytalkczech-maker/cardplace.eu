import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authenticate, AuthRequest } from "../middleware/auth";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import * as ctrl from "../controllers/reportController";

const router = Router();

const reportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Příliš mnoho nahlášení, zkus to za 15 minut" },
  standardHeaders: true,
  legacyHeaders: false,
});

function adminOrModerator(req: AuthRequest, _res: any, next: any) {
  const role = req.userRole?.toLowerCase();
  if (role !== "admin" && role !== "moderator") {
    throw new AppError(403, "Admin or moderator access required");
  }
  next();
}

router.post("/", authenticate, reportLimiter, asyncHandler(ctrl.createReport));
router.get("/", authenticate, adminOrModerator, asyncHandler(ctrl.listReports));
router.patch("/:id", authenticate, adminOrModerator, asyncHandler(ctrl.updateReportStatus));

export default router;
