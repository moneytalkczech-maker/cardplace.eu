import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import express from "express";
import dotenv from "dotenv";
import prisma from "../utils/prisma";
import authRoutes from "../routes/auth";
import uploadRoutes from "../routes/upload";
import { errorHandler } from "../middleware/errorHandler";

dotenv.config();

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use(errorHandler);

let token = "";
const email = `upload_test_${Date.now()}@test.com`;

// Minimal 1×1 transparent PNG (valid magic bytes + proper PNG structure)
const MINIMAL_PNG = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
  0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk length + type
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1×1 px
  0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, // 8-bit RGB
  0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT start
  0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00, // compressed pixel data
  0x00, 0x00, 0x02, 0x00, 0x01, 0xE2, 0x21, 0xBC, // checksum
  0x33, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, // IEND start
  0x44, 0xAE, 0x42, 0x60, 0x82,                   // IEND end
]);

beforeAll(async () => {
  const r = await request(app)
    .post("/api/auth/register")
    .send({ email, username: `uploader${Date.now()}`, password: "Password1!", acceptedTerms: true, acceptedPrivacy: true });
  token = r.body.token;
  await prisma.user.update({ where: { email }, data: { emailVerifiedAt: new Date() } });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email } });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Upload", () => {
  it("POST /api/upload — rejects unauthenticated", async () => {
    const res = await request(app)
      .post("/api/upload")
      .attach("image", MINIMAL_PNG, { filename: "test.png", contentType: "image/png" });
    expect(res.status).toBe(401);
  });

  it("POST /api/upload — rejects missing file", async () => {
    const res = await request(app)
      .post("/api/upload")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });

  it("POST /api/upload — rejects invalid MIME type (text/plain)", async () => {
    const res = await request(app)
      .post("/api/upload")
      .set("Authorization", `Bearer ${token}`)
      .attach("image", Buffer.from("not an image"), { filename: "hack.txt", contentType: "text/plain" });
    expect(res.status).toBe(400);
  });

  it("POST /api/upload — accepts valid PNG and returns URL", async () => {
    const res = await request(app)
      .post("/api/upload")
      .set("Authorization", `Bearer ${token}`)
      .attach("image", MINIMAL_PNG, { filename: "card.png", contentType: "image/png" });
    expect(res.status).toBe(200);
    expect(res.body.url).toMatch(/^\/uploads\//);
  });

  it("POST /api/upload — rejects PNG bytes sent as JPEG MIME", async () => {
    const res = await request(app)
      .post("/api/upload")
      .set("Authorization", `Bearer ${token}`)
      .attach("image", MINIMAL_PNG, { filename: "fake.jpg", contentType: "image/jpeg" });
    // Should fail magic bytes validation since JPEG expects FF D8 FF header
    expect(res.status).toBe(400);
  });
});
