import { Router } from "express";
import { authenticate, adminOnly } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import * as adminController from "../controllers/adminController";

const router = Router();

router.get("/users", authenticate, adminOnly, asyncHandler(adminController.listUsers));
router.patch("/users/:id/role", authenticate, adminOnly, asyncHandler(adminController.updateUserRole));
router.patch("/users/:id/verify", authenticate, adminOnly, asyncHandler(adminController.toggleUserVerification));
router.delete("/users/:id", authenticate, adminOnly, asyncHandler(adminController.deleteUser));
router.patch("/users/:id/ban", authenticate, adminOnly, asyncHandler(adminController.toggleUserBan));
router.get("/auctions", authenticate, adminOnly, asyncHandler(adminController.listAuctions));
router.patch("/auctions/:id/cancel", authenticate, adminOnly, asyncHandler(adminController.cancelAuction));
router.patch("/auctions/:id/feature", authenticate, adminOnly, asyncHandler(adminController.toggleAuctionFeature));
router.get("/stats", authenticate, adminOnly, asyncHandler(adminController.getStats));
router.get("/audit-log", authenticate, adminOnly, asyncHandler(adminController.listAuditLogs));
router.get("/bids", authenticate, adminOnly, asyncHandler(adminController.listBids));
router.get("/settings", authenticate, adminOnly, asyncHandler(adminController.listSettings));
router.patch("/settings/:id", authenticate, adminOnly, asyncHandler(adminController.updateSetting));

// Cards management
router.get("/cards", authenticate, adminOnly, asyncHandler(adminController.listCards));
router.patch("/cards/:id/status", authenticate, adminOnly, asyncHandler(adminController.updateCardStatus));
router.delete("/cards/:id", authenticate, adminOnly, asyncHandler(adminController.deleteCard));

// Card Database
router.get("/card-database", authenticate, adminOnly, asyncHandler(adminController.listDatabaseCards));
router.delete("/card-database/:id", authenticate, adminOnly, asyncHandler(adminController.deleteDatabaseCard));

// Uploads
router.get("/uploads", authenticate, adminOnly, asyncHandler(adminController.listUploads));
router.delete("/uploads/:id", authenticate, adminOnly, asyncHandler(adminController.deleteUpload));

// Email templates
router.get("/email-templates", authenticate, adminOnly, asyncHandler(adminController.listEmailTemplates));
router.patch("/email-templates/:id", authenticate, adminOnly, asyncHandler(adminController.updateEmailTemplate));

// Legal documents
router.get("/legal-documents", authenticate, adminOnly, asyncHandler(adminController.listLegalDocuments));
router.patch("/legal-documents/:id", authenticate, adminOnly, asyncHandler(adminController.updateLegalDocument));

// System info
router.get("/system", authenticate, adminOnly, asyncHandler(adminController.getSystemInfo));

// Security settings
router.get("/security", authenticate, adminOnly, asyncHandler(adminController.getSecuritySettings));
router.patch("/security", authenticate, adminOnly, asyncHandler(adminController.updateSecuritySetting));

// Card data sources (AI)
router.get("/card-data-sources", authenticate, adminOnly, asyncHandler(adminController.listCardDataSources));

export default router;
