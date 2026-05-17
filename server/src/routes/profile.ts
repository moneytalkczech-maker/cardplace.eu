import { Router } from "express";
import rateLimit from "express-rate-limit";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { authenticate, AuthRequest } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import { AppError } from "../middleware/errorHandler";
import { validateFileType, getAllowedMimeTypes } from "../utils/fileValidation";
import * as profileController from "../controllers/profileController";

const router = Router();

const uploadDir = path.join(__dirname, "../../uploads/avatars");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const ALLOWED_MIME = getAllowedMimeTypes();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, _file, cb) => {
    const safeName = crypto.randomBytes(16).toString("hex");
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG and WebP images are allowed"));
    }
  },
});

// Middleware pro magic-byte validaci
function validateAvatar(req: AuthRequest, _res: any, next: any) {
  if (!req.file) throw new AppError(400, "No file uploaded");
  const filePath = req.file.path;
  try {
    const buffer = Buffer.alloc(16);
    const fd = fs.openSync(filePath, "r");
    fs.readSync(fd, buffer, 0, 16, 0);
    fs.closeSync(fd);
    if (!validateFileType(buffer, req.file.mimetype)) {
      fs.unlinkSync(filePath);
      throw new AppError(400, "File does not match declared format");
    }
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    throw new AppError(400, "Failed to validate file");
  }
  next();
}

const passwordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: { error: "Příliš mnoho pokusů o změnu hesla, zkus to za 15 minut" },
  standardHeaders: true,
  legacyHeaders: false,
});

router.patch("/", authenticate, asyncHandler(profileController.updateProfile));
router.patch("/password", authenticate, passwordLimiter, asyncHandler(profileController.changePassword));
router.post("/avatar", authenticate, upload.single("avatar"), validateAvatar, asyncHandler(profileController.uploadAvatar));

// GDPR endpointy
router.get("/export-data", authenticate, asyncHandler(profileController.exportData));
router.post("/delete-account", authenticate, asyncHandler(profileController.deleteAccount));

export default router;
