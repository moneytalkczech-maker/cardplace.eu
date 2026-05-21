import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import http from "http";
import path from "path";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import statusMonitor from "express-status-monitor";
import * as Sentry from "@sentry/node";
import { initSocket } from "./socket";
import { authenticate } from "./middleware/auth";
import passport from "passport";
import oauthRoutes from "./routes/oauth";
import authRoutes from "./routes/auth";
import auctionRoutes from "./routes/auctions";
import userRoutes from "./routes/users";
import cardRoutes from "./routes/cards";
import uploadRoutes from "./routes/upload";
import wantedRoutes from "./routes/wanted";
import followRoutes from "./routes/follow";
import collectionRoutes from "./routes/collection";
import adminRoutes from "./routes/admin";
import paymentRoutes from "./routes/payments";
import monetizationRoutes from "./routes/monetization";
import profileRoutes from "./routes/profile";
import reportRoutes from "./routes/reports";
import contactRoutes from "./routes/contact";
import cardSetsRoutes from "./routes/cardSets";
import databaseCardsRoutes from "./routes/databaseCards";
import prisma from "./utils/prisma";
import logger from "./utils/logger";
import { errorHandler } from "./middleware/errorHandler";
import { cardSetsSitemap, cardsSitemap } from "./controllers/sitemapController";
import { sendWonEmail, sendSoldEmail } from "./utils/email";

dotenv.config();

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "production",
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || "0.1"),
  });
  logger.info("Sentry initialized");
}

const app = express();
const server = http.createServer(app);

// Raw body for Stripe webhook
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));
app.use("/api/monetization/webhook", express.raw({ type: "application/json" }));
const isDev = process.env.NODE_ENV !== "production";
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", ...(isDev ? ["'unsafe-eval'"] : [])],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: [
        "'self'",
        "https://api.stripe.com",
        "https://checkout.stripe.com",
        ...(isDev ? ["ws://localhost:*"] : []),
      ],
      frameSrc: ["'self'", "https://checkout.stripe.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      formAction: ["'self'"],
      ...(!isDev ? { upgradeInsecureRequests: [] } : {}),
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  xFrameOptions: { action: "deny" },
  xContentTypeOptions: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
}));

// Další security headers
app.use((_req, res, next) => {
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("X-DNS-Prefetch-Control", "off");
  res.setHeader("X-Download-Options", "noopen");
  res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
  next();
});

const CORS_ORIGIN = process.env.CORS_ORIGIN;
if (!CORS_ORIGIN) {
  logger.fatal("CORS_ORIGIN environment variable is required");
  process.exit(1);
}

// Trust proxy — správné čtení IP za reverse proxy (nginx, Cloudflare)
// Nutné pro rate limiting, jinak útočník obchází limity přes X-Forwarded-For
app.set("trust proxy", 1);

app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(passport.initialize());
app.use(cookieParser());

// General API rate limiter (bezpečnostní síť)
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuta
  max: 100,
  message: { error: "Příliš mnoho požadavků, zkus to za minutu" },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", apiLimiter);

// Request logging
app.use((req, _res, next) => {
  logger.info({ method: req.method, url: req.url, ip: req.ip }, "Request");
  next();
});

app.use(express.json({ limit: "10mb" }));

app.get("/sitemap-card-sets.xml", cardSetsSitemap);
app.get("/sitemap-cards.xml", cardsSitemap);

app.use("/uploads", express.static(path.join(__dirname, "../uploads"), {
  setHeaders: (res, filePath) => {
    // Explicitní Content-Type pro obrázky — prevence MIME sniffing
    const ext = path.extname(filePath).toLowerCase();
    const mimeMap: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".gif": "image/gif",
    };
    if (mimeMap[ext]) {
      res.setHeader("Content-Type", mimeMap[ext]);
      res.setHeader("X-Content-Type-Options", "nosniff");
    }
  },
}));
app.use("/api/auth", oauthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/auctions", auctionRoutes);
app.use("/api/users", userRoutes);
app.use("/api/cards", cardRoutes);
app.use("/api/card-sets", cardSetsRoutes);
app.use("/api/database-cards", databaseCardsRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/wanted", wantedRoutes);
app.use("/api/collection", collectionRoutes);
app.use("/api/follow", followRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/monetization", monetizationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/profile", profileRoutes);
// Status monitor — admin only, pouze v development/staging
// V produkci vypnut — odhaluje interní metriky (CPU, memory, response times)
if (isDev) {
  app.use("/status", authenticate, (req: any, _res: any, next: any) => {
    if (req.userRole?.toLowerCase() !== "admin") return _res.status(403).json({ error: "Admin access required" });
    next();
  });
  app.use(statusMonitor());
}

app.get("/api/health", async (_req, res) => {
  let dbStatus = "ok";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = "error";
  }
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: dbStatus,
    memory: process.memoryUsage().rss,
    version: process.env.npm_package_version || "1.0.0",
  });
});

if (process.env.SENTRY_DSN) app.use(Sentry.expressErrorHandler() as any);
app.use(errorHandler);

const io = initSocket(server);
app.set("io", io);

async function main() {
  try {
    await prisma.$connect();
    logger.info("Database connected");

    const PORT = process.env.PORT;
    if (!PORT) {
      logger.fatal("PORT environment variable is required");
      process.exit(1);
    }

    server.listen(PORT, () => {
      logger.info({ port: PORT }, "Server started");
    });
  } catch (err) {
    logger.fatal({ err }, "Failed to start server");
    process.exit(1);
  }
}

function shutdown(signal: string) {
  logger.info({ signal }, "Shutting down gracefully");
  io.close();
  server.close(async () => {
    await prisma.$disconnect();
    logger.info("Shutdown complete");
    process.exit(0);
  });
  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

main();

setInterval(async () => {
  const now = new Date();
  try {
    // Najít aukce k ukončení (s vítězi pro notifikace)
    const expiring = await prisma.auction.findMany({
      where: { status: "ACTIVE", endTime: { lte: now } },
      select: {
        id: true, title: true, userId: true,
        user: { select: { email: true, username: true } },
        bids: { orderBy: { amount: "desc" }, take: 1, select: { userId: true, user: { select: { email: true, username: true } } } },
      },
    });

    if (expiring.length > 0) {
      await prisma.auction.updateMany({
        where: { id: { in: expiring.map((a) => a.id) } },
        data: { status: "ENDED" },
      });
      logger.info({ count: expiring.length }, "Expired auctions ended");

      // Notifikace vítěze a prodávajícího
      for (const auction of expiring) {
        const winner = auction.bids[0];
        if (winner) {
          // In-app notifikace
          await prisma.notification.createMany({
            data: [
              { userId: winner.userId, type: "AUCTION_WON", message: `Vyhrál jsi aukci: "${auction.title}"`, link: `/auctions/${auction.id}` },
              { userId: auction.userId, type: "AUCTION_SOLD", message: `Tvoje aukce byla prodána: "${auction.title}"`, link: `/auctions/${auction.id}` },
            ],
          });
          // Emailové notifikace
          sendWonEmail(winner.user.email, winner.user.username, auction.title, auction.id).catch(() => {});
          sendSoldEmail(auction.user.email, auction.user.username, auction.title).catch(() => {});
        }
      }
    }

    // Smazat expirované revoked tokeny
    const cleaned = await prisma.revokedToken.deleteMany({
      where: { expiresAt: { lte: now } },
    });
    if (cleaned.count > 0) logger.debug({ count: cleaned.count }, "Expired revoked tokens cleaned up");
  } catch (err) {
    logger.error({ err }, "Cleanup error");
  }
}, 60_000);