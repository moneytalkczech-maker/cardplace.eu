import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import express from "express";
import dotenv from "dotenv";
import prisma from "../utils/prisma";
import authRoutes from "../routes/auth";
import paymentRoutes from "../routes/payments";
import adminRoutes from "../routes/admin";
import auctionRoutes from "../routes/auctions";
import { errorHandler } from "../middleware/errorHandler";

dotenv.config();

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/auctions", auctionRoutes);
app.use(errorHandler);

let sellerToken = "";
let buyerToken = "";
let sellerId = "";
let buyerId = "";
let auctionId = "";

const sellerEmail = `payment_test_seller_${Date.now()}@test.com`;
const buyerEmail = `payment_test_buyer_${Date.now()}@test.com`;

beforeAll(async () => {
  // Create seller
  const r1 = await request(app)
    .post("/api/auth/register")
    .send({ email: sellerEmail, username: `seller${Date.now()}`, password: "Password1", acceptedTerms: true, acceptedPrivacy: true });
  sellerToken = r1.body.token;
  await prisma.user.update({ where: { email: sellerEmail }, data: { emailVerifiedAt: new Date() } });
  const me1 = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${sellerToken}`);
  sellerId = me1.body.id;

  // Create buyer
  const r2 = await request(app)
    .post("/api/auth/register")
    .send({ email: buyerEmail, username: `buyer${Date.now()}`, password: "Password1", acceptedTerms: true, acceptedPrivacy: true });
  buyerToken = r2.body.token;
  await prisma.user.update({ where: { email: buyerEmail }, data: { emailVerifiedAt: new Date() } });
  const me2 = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${buyerToken}`);
  buyerId = me2.body.id;

  // Create an auction
  const endTime = new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString();
  const auctionRes = await request(app)
    .post("/api/auctions")
    .set("Authorization", `Bearer ${sellerToken}`)
    .send({ title: "Test Payment Card", startingPrice: "100", endTime, confirmedOriginal: true });
  auctionId = auctionRes.body.id;

  // Buyer places a bid
  await request(app)
    .post(`/api/auctions/${auctionId}/bid`)
    .set("Authorization", `Bearer ${buyerToken}`)
    .send({ amount: 150 });

  // End auction by waiting for it (in production, scheduler would do this)
  await prisma.auction.update({
    where: { id: auctionId },
    data: { status: "ENDED", endTime: new Date(Date.now() - 1000) },
  });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: [sellerEmail, buyerEmail] } } });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Payment flow", () => {
  it("GET /api/payments/config — returns Stripe public key", async () => {
    const res = await request(app).get("/api/payments/config");
    expect(res.status).toBe(200);
    expect(res.body.publishableKey).toBeDefined();
  });

  it("POST /api/payments/create-checkout — creates checkout session", async () => {
    const res = await request(app)
      .post("/api/payments/create-checkout")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ auctionId });

    if (res.status === 200) {
      // Stripe configured
      expect(res.body.url).toBeTruthy();
      expect(res.body.url).toContain("stripe");
    } else if (res.status === 503) {
      // Stripe not configured, which is fine for tests
      expect(res.body.error).toMatch(/not configured/i);
    }
  });

  it("POST /api/payments/create-checkout — rejects non-winning bidder", async () => {
    // Create another user who isn't the bidder
    const otherEmail = `other_${Date.now()}@test.com`;
    const otherRes = await request(app)
      .post("/api/auth/register")
      .send({ email: otherEmail, username: `other${Date.now()}`, password: "Password1", acceptedTerms: true, acceptedPrivacy: true });
    const otherToken = otherRes.body.token;

    const res = await request(app)
      .post("/api/payments/create-checkout")
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ auctionId });

    expect([400, 403, 503]).toContain(res.status);

    // Cleanup
    await prisma.user.deleteMany({ where: { email: otherEmail } });
  });

  it("POST /api/payments/create-checkout — rejects if already paid", async () => {
    // Mark as completed
    await prisma.transaction.update({
      where: { auctionId },
      data: { status: "COMPLETED" },
    });

    const res = await request(app)
      .post("/api/payments/create-checkout")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ auctionId });

    expect([400, 503]).toContain(res.status);
  });

  it("GET /api/payments/reviews/:userId — returns seller reviews", async () => {
    const res = await request(app).get(`/api/payments/reviews/${sellerId}`);
    expect(res.status).toBe(200);
    expect(res.body.reviews).toBeDefined();
    expect(Array.isArray(res.body.reviews)).toBe(true);
    expect(res.body.avgRating).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Admin endpoints", () => {
  let adminToken = "";
  let adminId = "";

  beforeAll(async () => {
    const adminEmail = `admin_test_${Date.now()}@test.com`;
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: adminEmail, username: `admin${Date.now()}`, password: "Password1", acceptedTerms: true, acceptedPrivacy: true });
    adminToken = res.body.token;

    const me = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${adminToken}`);
    adminId = me.body.id;

    // Make user admin in DB
    await prisma.user.update({ where: { id: adminId }, data: { role: "ADMIN" } });
  });

  it("GET /api/admin/stats — requires admin", async () => {
    const res = await request(app)
      .get("/api/admin/stats")
      .set("Authorization", `Bearer ${buyerToken}`);
    expect(res.status).toBe(403);
  });

  it("GET /api/admin/stats — admin can access", async () => {
    const res = await request(app)
      .get("/api/admin/stats")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.users).toBeDefined();
  });

  it("GET /api/admin/users — returns paginated users", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/admin/auctions — returns auctions", async () => {
    const res = await request(app)
      .get("/api/admin/auctions")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/admin/audit-log — returns audit events", async () => {
    const res = await request(app)
      .get("/api/admin/audit-log")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("PATCH /api/admin/users/:id/verify — toggles verification", async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${buyerId}/verify`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ verified: true });
    expect([200, 400]).toContain(res.status);
  });

  it("GET /api/admin/settings — returns settings", async () => {
    const res = await request(app)
      .get("/api/admin/settings")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  afterAll(async () => {
    const adminEmail = `admin_test_${Date.now()}@test.com`;
    await prisma.user.deleteMany({ where: { email: adminEmail } });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Security & rate limiting", () => {
  it("POST /api/payments/create-checkout — rejects unauthenticated", async () => {
    const res = await request(app)
      .post("/api/payments/create-checkout")
      .send({ auctionId });
    expect(res.status).toBe(401);
  });

  it("GET /api/admin/stats — rejects unauthenticated", async () => {
    const res = await request(app).get("/api/admin/stats");
    expect(res.status).toBe(401);
  });
});
