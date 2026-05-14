import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { authenticate, AuthRequest } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import * as profileController from "../controllers/profileController";

const router = Router();

const uploadDir = path.join(__dirname, "../../uploads/avatars");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    file.mimetype.startsWith("image/") ? cb(null, true) : cb(new Error("Only images"));
  },
});

router.patch("/", authenticate, asyncHandler(profileController.updateProfile));
router.patch("/password", authenticate, asyncHandler(profileController.changePassword));
router.post("/avatar", authenticate, upload.single("avatar"), asyncHandler(profileController.uploadAvatar));

export default router;
