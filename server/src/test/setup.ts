import { beforeAll, afterAll } from "vitest";
import prisma from "../utils/prisma";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-key";
process.env.CORS_ORIGIN = "http://localhost:5173";
process.env.PORT = "4001";

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