import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import express from "express";
import dotenv from "dotenv";
import prisma from "../utils/prisma";
import authRoutes from "../routes/auth";
import profileRoutes from "../routes/profile";
import collectionRoutes from "../routes/collection";
import wantedRoutes from "../routes/wanted";
import followRoutes from "../routes/follow";
import userRoutes from "../routes/users";
import { errorHandler } from "../middleware/errorHandler";

dotenv.config();

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/collection", collectionRoutes);
app.use("/api/wanted", wantedRoutes);
app.use("/api/follow", followRoutes);
app.use("/api/users", userRoutes);
app.use(errorHandler);

let token = "";
let userId = "";
let token2 = "";
let userId2 = "";
let wantedId = "";
let collectionItemId = "";

const email1 = `profile_test_${Date.now()}@test.com`;
const email2 = `follow_target_${Date.now()}@test.com`;

beforeAll(async () => {
  // Create user 1
  const r1 = await request(app)
    .post("/api/auth/register")
    .send({ email: email1, username: `profuser${Date.now()}`, password: "Password1", acceptedTerms: true, acceptedPrivacy: true });
  token = r1.body.token;
  await prisma.user.update({ where: { email: email1 }, data: { emailVerifiedAt: new Date() } });
  const me1 = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);
  userId = me1.body.id;

  // Create user 2
  const r2 = await request(app)
    .post("/api/auth/register")
    .send({ email: email2, username: `followtgt${Date.now()}`, password: "Password1", acceptedTerms: true, acceptedPrivacy: true });
  token2 = r2.body.token;
  await prisma.user.update({ where: { email: email2 }, data: { emailVerifiedAt: new Date() } });
  const me2 = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token2}`);
  userId2 = me2.body.id;
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: [email1, email2] } } });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Profile", () => {
  it("PATCH /api/profile — updates username", async () => {
    const newName = `updated${Date.now()}`;
    const res = await request(app)
      .patch("/api/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({ username: newName });
    expect(res.status).toBe(200);
    expect(res.body.username).toBe(newName);
  });

  it("PATCH /api/profile — rejects unauthenticated", async () => {
    const res = await request(app).patch("/api/profile").send({ username: "hacker" });
    expect(res.status).toBe(401);
  });

  it("PATCH /api/profile/password — rejects wrong current password", async () => {
    const res = await request(app)
      .patch("/api/profile/password")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPassword: "WrongPass1", newPassword: "NewPass123" });
    expect(res.status).toBe(400);
  });

  it("GET /api/profile/export-data — returns GDPR data", async () => {
    const res = await request(app)
      .get("/api/profile/export-data")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.auctions).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Collection", () => {
  it("GET /api/collection/:userId — returns empty collection", async () => {
    const res = await request(app).get(`/api/collection/${userId}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("POST /api/collection — adds a card to collection", async () => {
    const res = await request(app)
      .post("/api/collection")
      .set("Authorization", `Bearer ${token}`)
      .send({ cardId: "test-card-001", cardName: "Charizard", condition: "NM", quantity: 1 });
    expect([200, 201]).toContain(res.status);
    expect(res.body.id).toBeTruthy();
    collectionItemId = res.body.id;
  });

  it("GET /api/collection/:userId — lists added card", async () => {
    const res = await request(app).get(`/api/collection/${userId}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("GET /api/collection/:userId/value — returns collection value", async () => {
    const res = await request(app).get(`/api/collection/${userId}/value`);
    expect(res.status).toBe(200);
    expect(typeof res.body.totalValue).toBe("number");
  });

  it("PATCH /api/collection/:id — updates item quantity", async () => {
    const res = await request(app)
      .patch(`/api/collection/${collectionItemId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ quantity: 3 });
    expect(res.status).toBe(200);
    expect(res.body.quantity).toBe(3);
  });

  it("DELETE /api/collection/:id — removes item", async () => {
    const res = await request(app)
      .delete(`/api/collection/${collectionItemId}`)
      .set("Authorization", `Bearer ${token}`);
    expect([200, 204]).toContain(res.status);
  });

  it("POST /api/collection — rejects unauthenticated", async () => {
    const res = await request(app)
      .post("/api/collection")
      .send({ cardId: "test-card-002", cardName: "Pikachu", condition: "NM", quantity: 1 });
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Wanted cards", () => {
  it("GET /api/wanted — lists wanted cards (public)", async () => {
    const res = await request(app).get("/api/wanted");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("POST /api/wanted — creates wanted card", async () => {
    const res = await request(app)
      .post("/api/wanted")
      .set("Authorization", `Bearer ${token}`)
      .send({ cardId: "want-card-001", cardName: "Mewtwo", maxPrice: 500 });
    expect([200, 201]).toContain(res.status);
    expect(res.body.id).toBeTruthy();
    wantedId = res.body.id;
  });

  it("POST /api/wanted — rejects missing cardName", async () => {
    const res = await request(app)
      .post("/api/wanted")
      .set("Authorization", `Bearer ${token}`)
      .send({ cardId: "want-card-002" });
    expect(res.status).toBe(400);
  });

  it("POST /api/wanted — rejects unauthenticated", async () => {
    const res = await request(app)
      .post("/api/wanted")
      .send({ cardId: "want-card-003", cardName: "Mewtwo" });
    expect(res.status).toBe(401);
  });

  it("DELETE /api/wanted/:id — removes wanted card", async () => {
    const res = await request(app)
      .delete(`/api/wanted/${wantedId}`)
      .set("Authorization", `Bearer ${token}`);
    expect([200, 204]).toContain(res.status);
  });

  it("DELETE /api/wanted/:id — rejects deleting another user's wanted", async () => {
    // Create a wanted card as user2
    const created = await request(app)
      .post("/api/wanted")
      .set("Authorization", `Bearer ${token2}`)
      .send({ cardId: "want-card-004", cardName: "Rayquaza" });
    const otherId = created.body.id;

    const res = await request(app)
      .delete(`/api/wanted/${otherId}`)
      .set("Authorization", `Bearer ${token}`);
    expect([403, 404]).toContain(res.status);

    // Cleanup
    await request(app).delete(`/api/wanted/${otherId}`).set("Authorization", `Bearer ${token2}`);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Follow system", () => {
  it("POST /api/follow/:id — follows user", async () => {
    const res = await request(app)
      .post(`/api/follow/${userId2}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.following).toBe(true);
  });

  it("GET /api/follow/:id/check — returns following=true", async () => {
    const res = await request(app)
      .get(`/api/follow/${userId2}/check`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.following).toBe(true);
  });

  it("GET /api/follow/:id/followers — lists followers", async () => {
    const res = await request(app).get(`/api/follow/${userId2}/followers`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("GET /api/follow/:id/following — lists who user follows", async () => {
    const res = await request(app).get(`/api/follow/${userId}/following`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("POST /api/follow/:id — unfollows user (toggle)", async () => {
    const res = await request(app)
      .post(`/api/follow/${userId2}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.following).toBe(false);
  });

  it("POST /api/follow/:id — rejects following self", async () => {
    const res = await request(app)
      .post(`/api/follow/${userId}`)
      .set("Authorization", `Bearer ${token}`);
    expect([400, 403]).toContain(res.status);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Notifications", () => {
  it("GET /api/users/notifications — returns notifications", async () => {
    const res = await request(app)
      .get("/api/users/notifications")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/users/notifications — rejects unauthenticated", async () => {
    const res = await request(app).get("/api/users/notifications");
    expect(res.status).toBe(401);
  });

  it("POST /api/users/notifications/read — marks all as read", async () => {
    const res = await request(app)
      .post("/api/users/notifications/read")
      .set("Authorization", `Bearer ${token}`);
    expect([200, 204]).toContain(res.status);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("User endpoints", () => {
  it("GET /api/users/profile/:id — returns public profile", async () => {
    const res = await request(app).get(`/api/users/profile/${userId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(userId);
  });

  it("GET /api/users/my-auctions — returns user's auctions", async () => {
    const res = await request(app)
      .get("/api/users/my-auctions")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/users/my-bids — returns user's bids", async () => {
    const res = await request(app)
      .get("/api/users/my-bids")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/users/watchlist — returns watchlist", async () => {
    const res = await request(app)
      .get("/api/users/watchlist")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/users/rank/:id — returns user rank", async () => {
    const res = await request(app).get(`/api/users/rank/${userId}`);
    expect(res.status).toBe(200);
    expect(res.body.rank).toBeDefined();
  });

  it("POST /api/users/daily-credit — claims daily credit", async () => {
    const res = await request(app)
      .post("/api/users/daily-credit")
      .set("Authorization", `Bearer ${token}`);
    expect([200, 400]).toContain(res.status);
    // 200 = claimed, 400 = already claimed today
  });
});
