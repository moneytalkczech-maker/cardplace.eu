import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import http from "http";
import path from "path";
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
import profileRoutes from "./routes/profile";
import prisma from "./utils/prisma";
import logger from "./utils/logger";
import { errorHandler } from "./middleware/errorHandler";

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
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" }, contentSecurityPolicy: false }));

const CORS_ORIGIN = process.env.CORS_ORIGIN;
if (!CORS_ORIGIN) {
  logger.fatal("CORS_ORIGIN environment variable is required");
  process.exit(1);
}
app.use(cors({ origin: CORS_ORIGIN }));
app.use(passport.initialize());
app.use(express.json({ limit: "10mb" }));

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/api/auth", oauthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/auctions", auctionRoutes);
app.use("/api/users", userRoutes);
app.use("/api/cards", cardRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/wanted", wantedRoutes);
app.use("/api/collection", collectionRoutes);
app.use("/api/follow", followRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/profile", profileRoutes);
// Status monitor — admin only in production
if (process.env.NODE_ENV === "production") {
  app.use("/status", authenticate, (req: any, _res: any, next: any) => {
    if (req.userRole !== "ADMIN") return _res.status(403).json({ error: "Admin access required" });
    next();
  });
}
app.use(statusMonitor());

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
    const result = await prisma.auction.updateMany({
      where: { status: "ACTIVE", endTime: { lte: now } },
      data: { status: "ENDED" },
    });
    if (result.count > 0) logger.info({ count: result.count }, "Expired auctions cleaned up");
  } catch (err) {
    logger.error({ err }, "Cleanup error");
  }
}, 60_000);