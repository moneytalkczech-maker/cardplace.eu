import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import express from "express";
import prisma from "../utils/prisma";
import { ensureMonetizationConfig } from "../utils/fees";
import monetizationRoutes from "../routes/monetization";
import { errorHandler } from "../middleware/errorHandler";

const app = express();
app.use(express.json());
app.use("/api/monetization", monetizationRoutes);
app.use(errorHandler);

describe("Monetization", () => {
  beforeAll(async () => {
    await ensureMonetizationConfig();
  });

  it("GET /api/monetization/prices — returns public prices", async () => {
    const res = await request(app).get("/api/monetization/prices");
    expect(res.status).toBe(200);
    expect(res.body.vipMonthly).toBeDefined();
    expect(res.body.boostTop).toBeDefined();
    expect(res.body.feePhase).toBe("phase1");
  });

  it("GET /api/monetization/founders — returns founder list", async () => {
    const res = await request(app).get("/api/monetization/founders");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("Fee calculation utility exists and works", async () => {
    const { calculateFee } = await import("../utils/fees");
    const result = await calculateFee(1000, "test-seller");
    // Phase 1 = 0% fee
    expect(result.feePercent).toBe(0);
    expect(result.fee).toBe(0);
    expect(result.netAmount).toBe(1000);
  });
});
