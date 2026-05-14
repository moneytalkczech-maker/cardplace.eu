import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "../routes/auth";
import auctionRoutes from "../routes/auctions";
import userRoutes from "../routes/users";
import cardRoutes from "../routes/cards";
import { errorHandler } from "../middleware/errorHandler";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/auctions", auctionRoutes);
app.use("/api/users", userRoutes);
app.use("/api/cards", cardRoutes);
app.use(errorHandler);

let token = "";
let auctionId = "";

describe("Auth flow", () => {
  it("POST /api/auth/register — creates a new user", async () => {
     const res = await request(app)
       .post("/api/auth/register")
       .send({ email: "test@test.com", username: "testuser", password: "Password1" });
     expect(res.status).toBe(200);
    token = res.body.token;
  });

  it("POST /api/auth/register — rejects duplicate email", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "test@test.com", username: "testuser2", password: "Password1" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already taken/i);
  });

  it("POST /api/auth/login — authenticates user", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@test.com", password: "Password1" });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    token = res.body.token;
  });

  it("POST /api/auth/login — rejects wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@test.com", password: "wrongpass" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid credentials");
  });

  it("GET /api/auth/me — returns authenticated user", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe("test@test.com");
  });
});

describe("Card sync & search", () => {
  it("GET /api/cards/search — returns cards without query", async () => {
    const res = await request(app).get("/api/cards/search");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/cards/search?q=Char — filters by name", async () => {
    const res = await request(app).get("/api/cards/search?q=Char");
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].name.toLowerCase()).toContain("char");
  });
});

describe("Auction flow", () => {
  let bidToken = "";

  beforeAll(async () => {
    await request(app).post("/api/cards/sync").set("Authorization", `Bearer ${token}`);
    // Register a separate user for bidding
    const bidder = await request(app)
      .post("/api/auth/register")
      .send({ email: `bidder${Date.now()}@test.com`, username: `bidder${Date.now()}`, password: "Password1" });
    bidToken = bidder.body.token;
  });

  it("POST /api/auctions — creates an auction", async () => {
    const endTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const res = await request(app)
      .post("/api/auctions")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Test Auction", startingPrice: "10", endTime, cardId: "A1-003" });
    expect(res.status).toBe(200);
    expect(res.body.id).toBeTruthy();
    auctionId = res.body.id;
  });

  it("POST /api/auctions — rejects missing fields", async () => {
    const res = await request(app)
      .post("/api/auctions")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Validation failed|Title required/);
  });

  it("GET /api/auctions — lists auctions", async () => {
    const res = await request(app).get("/api/auctions");
    expect(res.status).toBe(200);
    const data = res.body?.data || res.body;
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  it("GET /api/auctions/:id — returns auction detail", async () => {
    const res = await request(app).get(`/api/auctions/${auctionId}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Test Auction");
  });

  it("POST /api/auctions/:id/bid — places a bid", async () => {
    const res = await request(app)
      .post(`/api/auctions/${auctionId}/bid`)
      .set("Authorization", `Bearer ${bidToken}`)
      .send({ amount: 15 });
    expect(res.status).toBe(200);
    expect(res.body.amount).toBe(15);
  });

  it("POST /api/auctions/:id/bid — rejects bid on own auction", async () => {
    const res = await request(app)
      .post(`/api/auctions/${auctionId}/bid`)
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 20 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/own auction/i);
  });

  it("POST /api/auctions — validates body with Zod", async () => {
    const res = await request(app)
      .post("/api/auctions")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "", startingPrice: -5, endTime: "invalid" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Validation failed|Title required/);
  });
});

describe("Zod validation edge cases", () => {
  it("POST /api/auth/register — rejects invalid email", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "not-an-email", username: "valid", password: "short" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Validation failed");
  });

  it("POST /api/auth/register — rejects short password", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "a@b.com", username: "valid", password: "short" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Validation failed");
  });

  it("POST /api/auth/login — rejects empty body", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Validation failed");
  });
});