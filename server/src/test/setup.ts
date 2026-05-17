import { beforeAll, afterAll } from "vitest";
import prisma from "../utils/prisma";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-key";
process.env.REFRESH_TOKEN_SECRET = "test-refresh-secret-key";
process.env.CORS_ORIGIN = "http://localhost:5173";
process.env.PORT = "4001";
// NOTE: Tests require PostgreSQL running with valid DATABASE_URL in server/.env
// After secrets rotation, update server/.env with valid DB credentials before running tests.

beforeAll(async () => {
  await prisma.$connect();
  await prisma.bid.deleteMany({ where: { auction: { user: { email: { startsWith: "test@" } } } } });
  await prisma.notification.deleteMany({ where: { user: { email: { startsWith: "test@" } } } });
  await prisma.watchlist.deleteMany({ where: { auction: { user: { email: { startsWith: "test@" } } } } });
  await prisma.transaction.deleteMany({ where: { seller: { email: { startsWith: "test@" } } } });
  await prisma.auction.deleteMany({ where: { user: { email: { startsWith: "test@" } } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: "test@" } } });
});

afterAll(async () => {
  await prisma.$disconnect();
});