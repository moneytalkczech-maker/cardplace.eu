import { beforeAll, afterAll } from "vitest";
import prisma from "../utils/prisma";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-key";
process.env.REFRESH_TOKEN_SECRET = "test-refresh-secret-key";
process.env.CORS_ORIGIN = "http://localhost:5173";
process.env.PORT = "4001";

// DB-dependent setup only runs when DATABASE_URL is configured
// Unit tests (mocked Prisma) skip this block automatically
const hasDb = Boolean(process.env.DATABASE_URL);

beforeAll(async () => {
  if (!hasDb) return;
  await prisma.$connect();
  await prisma.bid.deleteMany({ where: { auction: { user: { email: { startsWith: "test@" } } } } });
  await prisma.notification.deleteMany({ where: { user: { email: { startsWith: "test@" } } } });
  await prisma.watchlist.deleteMany({ where: { auction: { user: { email: { startsWith: "test@" } } } } });
  await prisma.transaction.deleteMany({ where: { seller: { email: { startsWith: "test@" } } } });
  await prisma.auction.deleteMany({ where: { user: { email: { startsWith: "test@" } } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: "test@" } } });
});

afterAll(async () => {
  if (!hasDb) return;
  await prisma.$disconnect();
});