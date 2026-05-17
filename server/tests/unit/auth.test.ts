import { describe, it, expect, vi, beforeEach } from "vitest";
import { authenticate, adminOnly } from "../../src/middleware/auth";
import * as jwt from "../../src/utils/jwt";
import prisma from "../../src/utils/prisma";

// Mock dependencies
vi.mock("../../src/utils/jwt", () => ({
  verifyToken: vi.fn(),
}));

vi.mock("../../src/utils/prisma", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("../../src/utils/logger", () => ({
  default: {
    warn: vi.fn(),
  },
}));

describe("Auth Middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("authenticate", () => {
    const mockNext = vi.fn();

    it("should reject request without authorization header", () => {
      const req = { headers: {} } as any;
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;

      authenticate(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "No token provided" });
    });

    it("should reject request with invalid token", () => {
      const req = { headers: { authorization: "Bearer invalid" } } as any;
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;

      vi.mocked(jwt.verifyToken).mockImplementation(() => {
        throw new Error("Invalid token");
      });

      authenticate(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid token" });
    });

    it("should reject banned user with 403", async () => {
      const req = {
        headers: { authorization: "Bearer validtoken" },
      } as any;
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;

      vi.mocked(jwt.verifyToken).mockReturnValue({
        id: "user123",
        role: "user",
        username: "testuser",
      });

      vi.mocked(prisma.user.findUnique).mockResolvedValue({ status: "banned" });

      await authenticate(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: "Account is banned" });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should reject suspended user with 403", async () => {
      const req = {
        headers: { authorization: "Bearer validtoken" },
      } as any;
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;

      vi.mocked(jwt.verifyToken).mockReturnValue({
        id: "user123",
        role: "user",
        username: "testuser",
      });

      vi.mocked(prisma.user.findUnique).mockResolvedValue({ status: "suspended" });

      await authenticate(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: "Account is suspended" });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should allow active user and call next", async () => {
      const req = {
        headers: { authorization: "Bearer validtoken" },
      } as any;
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;

      vi.mocked(jwt.verifyToken).mockReturnValue({
        id: "user123",
        role: "user",
        username: "testuser",
      });

      vi.mocked(prisma.user.findUnique).mockResolvedValue({ status: "active" });

      await authenticate(req, res, mockNext);

      expect(req.userId).toBe("user123");
      expect(req.userRole).toBe("user");
      expect(req.username).toBe("testuser");
      expect(mockNext).toHaveBeenCalled();
    });

    it("should allow user with null status (legacy)", async () => {
      const req = {
        headers: { authorization: "Bearer validtoken" },
      } as any;
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;

      vi.mocked(jwt.verifyToken).mockReturnValue({
        id: "user123",
        role: "user",
        username: "testuser",
      });

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await authenticate(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe("adminOnly", () => {
    it("should allow admin user", () => {
      const req = { userRole: "admin" } as any;
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;
      const next = vi.fn();

      adminOnly(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("should reject non-admin user", () => {
      const req = { userRole: "user" } as any;
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;
      const next = vi.fn();

      adminOnly(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it("should reject user without role", () => {
      const req = { userRole: undefined } as any;
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;
      const next = vi.fn();

      adminOnly(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
