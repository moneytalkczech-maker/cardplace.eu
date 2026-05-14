import { Router } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import * as adminController from "../controllers/adminController";

const router = Router();

function adminOnly(req: AuthRequest, _res: any, next: any) {
  if (req.userRole !== "ADMIN") throw new AppError(403, "Admin access required");
  next();
}

router.get("/users", authenticate, adminOnly, asyncHandler(adminController.listUsers));
router.patch("/users/:id/role", authenticate, adminOnly, asyncHandler(adminController.updateUserRole));
router.patch("/users/:id/verify", authenticate, adminOnly, asyncHandler(adminController.toggleUserVerification));
router.delete("/users/:id", authenticate, adminOnly, asyncHandler(adminController.deleteUser));
router.get("/auctions", authenticate, adminOnly, asyncHandler(adminController.listAuctions));
router.patch("/auctions/:id/cancel", authenticate, adminOnly, asyncHandler(adminController.cancelAuction));
router.get("/stats", authenticate, adminOnly, asyncHandler(adminController.getStats));

export default router;
