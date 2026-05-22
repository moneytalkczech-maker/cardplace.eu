import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import express from "express";
import dotenv from "dotenv";
import prisma from "../utils/prisma";
import authRoutes from "../routes/auth";
import messagesRoutes from "../routes/messages";
import reportsRoutes from "../routes/reports";
import contactRoutes from "../routes/contact";
import cardSetsRoutes from "../routes/cardSets";
import databaseCardsRoutes from "../routes/databaseCards";
import auctionRoutes from "../routes/auctions";
import { errorHandler } from "../middleware/errorHandler";

dotenv.config();

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/card-sets", cardSetsRoutes);
app.use("/api/database-cards", databaseCardsRoutes);
app.use("/api/auctions", auctionRoutes);
app.use(errorHandler);

let token1 = "";
let token2 = "";
let userId1 = "";
let userId2 = "";
let auctionId = "";
let conversationId = "";

const email1 = `msg_test1_${Date.now()}@test.com`;
const email2 = `msg_test2_${Date.now()}@test.com`;

beforeAll(async () => {
  // Create two test users
  const r1 = await request(app)
    .post("/api/auth/register")
    .send({ email: email1, username: `msguser1_${Date.now()}`, password: "Password1!", acceptedTerms: true, acceptedPrivacy: true });
  token1 = r1.body.token;
  await prisma.user.update({ where: { email: email1 }, data: { emailVerifiedAt: new Date() } });
  const me1 = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token1}`);
  userId1 = me1.body.id;

  const r2 = await request(app)
    .post("/api/auth/register")
    .send({ email: email2, username: `msguser2_${Date.now()}`, password: "Password1!", acceptedTerms: true, acceptedPrivacy: true });
  token2 = r2.body.token;
  await prisma.user.update({ where: { email: email2 }, data: { emailVerifiedAt: new Date() } });
  const me2 = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token2}`);
  userId2 = me2.body.id;

  // Create an auction for reporting
  const endTime = new Date(Date.now() + 86400000).toISOString();
  const aRes = await request(app)
    .post("/api/auctions")
    .set("Authorization", `Bearer ${token1}`)
    .send({ title: "Test Report Auction", description: "For testing reports", condition: "NM", startingPrice: 100, endTime });
  if (aRes.body.id) auctionId = aRes.body.id;
});

afterAll(async () => {
  await prisma.report.deleteMany({ where: { reporter: { email: { startsWith: "msg_test" } } } });
  await prisma.message.deleteMany({ where: { sender: { email: { startsWith: "msg_test" } } } });
  await prisma.conversation.deleteMany({ where: { user1: { email: { startsWith: "msg_test" } } } });
  await prisma.bid.deleteMany({ where: { auction: { user: { email: { startsWith: "msg_test" } } } } });
  await prisma.auction.deleteMany({ where: { user: { email: { startsWith: "msg_test" } } } });
  await prisma.user.deleteMany({ where: { email: { in: [email1, email2] } } });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Messages — conversations", () => {
  it("GET /api/messages — returns empty list for new user", async () => {
    const res = await request(app)
      .get("/api/messages")
      .set("Authorization", `Bearer ${token1}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/messages — rejects unauthenticated", async () => {
    const res = await request(app).get("/api/messages");
    expect(res.status).toBe(401);
  });

  it("POST /api/messages/with/:userId — creates or returns conversation", async () => {
    const res = await request(app)
      .post(`/api/messages/with/${userId2}`)
      .set("Authorization", `Bearer ${token1}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBeTruthy();
    conversationId = res.body.id;
  });

  it("POST /api/messages/with/:userId — same call returns same conversation", async () => {
    const res = await request(app)
      .post(`/api/messages/with/${userId2}`)
      .set("Authorization", `Bearer ${token1}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(conversationId);
  });

  it("POST /api/messages/with/self — rejects messaging yourself", async () => {
    const res = await request(app)
      .post(`/api/messages/with/${userId1}`)
      .set("Authorization", `Bearer ${token1}`);
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Messages — sending and reading", () => {
  it("POST /api/messages/:conversationId — sends a message", async () => {
    const res = await request(app)
      .post(`/api/messages/${conversationId}`)
      .set("Authorization", `Bearer ${token1}`)
      .send({ body: "Hello from user1!" });
    expect(res.status).toBe(201);
    expect(res.body.body).toBe("Hello from user1!");
    expect(res.body.senderId).toBe(userId1);
  });

  it("POST /api/messages/:conversationId — rejects empty body", async () => {
    const res = await request(app)
      .post(`/api/messages/${conversationId}`)
      .set("Authorization", `Bearer ${token1}`)
      .send({ body: "" });
    expect(res.status).toBe(400);
  });

  it("GET /api/messages/:conversationId — returns messages", async () => {
    const res = await request(app)
      .get(`/api/messages/${conversationId}`)
      .set("Authorization", `Bearer ${token1}`);
    expect(res.status).toBe(200);
    expect(res.body.messages).toBeDefined();
    expect(res.body.messages.length).toBeGreaterThan(0);
  });

  it("GET /api/messages/:conversationId — recipient can read messages", async () => {
    const res = await request(app)
      .get(`/api/messages/${conversationId}`)
      .set("Authorization", `Bearer ${token2}`);
    expect(res.status).toBe(200);
    expect(res.body.messages.length).toBeGreaterThan(0);
  });

  it("GET /api/messages/unread — returns unread count for recipient", async () => {
    const res = await request(app)
      .get("/api/messages/unread")
      .set("Authorization", `Bearer ${token2}`);
    expect(res.status).toBe(200);
    expect(typeof res.body.unread).toBe("number");
    expect(res.body.unread).toBeGreaterThan(0);
  });

  it("GET /api/messages/unread — returns 0 for sender", async () => {
    const res = await request(app)
      .get("/api/messages/unread")
      .set("Authorization", `Bearer ${token1}`);
    expect(res.status).toBe(200);
    expect(res.body.unread).toBe(0);
  });

  it("GET /api/messages — lists conversation after message", async () => {
    const res = await request(app)
      .get("/api/messages")
      .set("Authorization", `Bearer ${token1}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    const convo = res.body.find((c: { id: string }) => c.id === conversationId);
    expect(convo).toBeDefined();
    expect(convo.lastMessage.body).toBe("Hello from user1!");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Reports", () => {
  it("POST /api/reports — creates a report", async () => {
    if (!auctionId) return;
    const res = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${token2}`)
      .send({ auctionId, reason: "fake", description: "This looks suspicious" });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeTruthy();
    expect(res.body.reason).toBe("fake");
  });

  it("POST /api/reports — rejects missing auction ID", async () => {
    const res = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${token2}`)
      .send({ reason: "fake" });
    expect(res.status).toBe(400);
  });

  it("POST /api/reports — rejects invalid reason", async () => {
    const res = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${token2}`)
      .send({ auctionId, reason: "not_a_valid_reason" });
    expect(res.status).toBe(400);
  });

  it("POST /api/reports — rejects unauthenticated", async () => {
    const res = await request(app)
      .post("/api/reports")
      .send({ auctionId, reason: "fake" });
    expect(res.status).toBe(401);
  });

  it("GET /api/reports — rejects non-admin", async () => {
    const res = await request(app)
      .get("/api/reports")
      .set("Authorization", `Bearer ${token1}`);
    expect(res.status).toBe(403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Contact form", () => {
  it("POST /api/contact — accepts valid submission", async () => {
    const res = await request(app)
      .post("/api/contact")
      .send({ name: "Test User", email: "contact@example.com", message: "This is a test message for the contact form." });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("POST /api/contact — rejects missing fields", async () => {
    const res = await request(app)
      .post("/api/contact")
      .send({ name: "Test User" });
    expect(res.status).toBe(400);
  });

  it("POST /api/contact — rejects too short message", async () => {
    const res = await request(app)
      .post("/api/contact")
      .send({ name: "A", email: "a@b.com", message: "short" });
    expect(res.status).toBe(400);
  });

  it("POST /api/contact — rejects too long message", async () => {
    const res = await request(app)
      .post("/api/contact")
      .send({ name: "A", email: "a@b.com", message: "x".repeat(5001) });
    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Card sets (public)", () => {
  it("GET /api/card-sets — returns array", async () => {
    const res = await request(app).get("/api/card-sets");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/card-sets — does not require auth", async () => {
    const res = await request(app).get("/api/card-sets");
    expect(res.status).toBe(200);
  });

  it("POST /api/card-sets — rejects non-admin", async () => {
    const res = await request(app)
      .post("/api/card-sets")
      .set("Authorization", `Bearer ${token1}`)
      .send({ name: "Test Set", slug: "test-set", category: "pokemon" });
    expect(res.status).toBe(403);
  });

  it("POST /api/card-sets — rejects unauthenticated", async () => {
    const res = await request(app)
      .post("/api/card-sets")
      .send({ name: "Test Set", slug: "test-set", category: "pokemon" });
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Database cards (public)", () => {
  it("GET /api/database-cards — returns array", async () => {
    const res = await request(app).get("/api/database-cards");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/database-cards?q=test — filters by query", async () => {
    const res = await request(app).get("/api/database-cards?q=test");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/database-cards/:id — returns 404 for unknown id", async () => {
    const res = await request(app).get("/api/database-cards/nonexistent-id-xyz");
    expect(res.status).toBe(404);
  });

  it("POST /api/database-cards — rejects non-admin", async () => {
    const res = await request(app)
      .post("/api/database-cards")
      .set("Authorization", `Bearer ${token1}`)
      .send({ name: "Test Card", setId: "test-set" });
    expect(res.status).toBe(403);
  });
});
