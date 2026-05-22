import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import rateLimit from "express-rate-limit";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { authenticate } from "../middleware/auth";
import { validateFileType, getAllowedMimeTypes } from "../utils/fileValidation";

const router = Router();

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  message: { error: "Příliš mnoho nahraných souborů. Zkuste to za hodinu." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
});

const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const ALLOWED_MIME = getAllowedMimeTypes();
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeName = crypto.randomBytes(16).toString("hex");
    cb(null, safeName); // Bez ext — ukládáme bez přípony (prevence path traversal)
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Povoleny jsou pouze JPEG, PNG a WebP obrázky"));
    }
  },
});

// Ověření magic bytes po uploadu
function validateMagicBytes(req: Request, res: Response, next: NextFunction) {
  if (!req.file) return next();
  const filePath = req.file.path;
  try {
    const buffer = Buffer.alloc(16);
    const fd = fs.openSync(filePath, "r");
    fs.readSync(fd, buffer, 0, 16, 0);
    fs.closeSync(fd);

    if (!validateFileType(buffer, req.file.mimetype)) {
      // Smazat nevalidní soubor
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: "Soubor neodpovídá deklarovanému formátu" });
    }
  } catch {
    return res.status(400).json({ error: "Nepodařilo se ověřit soubor" });
  }
  next();
}

// Wrapper pro multer chyby
function uploadHandler(req: Request, res: Response, next: NextFunction) {
  upload.single("image")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "Soubor je příliš velký (max 10 MB)" });
      }
      return res.status(400).json({ error: err.message });
    }
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}

router.post("/", uploadLimiter, authenticate, uploadHandler, validateMagicBytes, (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
});

export default router;
