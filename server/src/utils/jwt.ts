import jwt from "jsonwebtoken";
import crypto from "crypto";

export interface JwtPayload {
  id: string;
  role: string;
  username?: string;
  jti?: string; // JWT ID for refresh token rotation
  iat?: number; // Issued at timestamp
}

let _secret: string | null = null;
let _refreshSecret: string | null = null;

export function getJwtSecret(): string {
  if (_secret) return _secret;
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET environment variable is required");
  _secret = secret;
  return secret;
}

export function getRefreshSecret(): string {
  if (_refreshSecret) return _refreshSecret;
  const secret = process.env.REFRESH_TOKEN_SECRET;
  if (!secret) throw new Error("REFRESH_TOKEN_SECRET environment variable is required (must differ from JWT_SECRET)");
  if (secret === process.env.JWT_SECRET) {
    throw new Error("REFRESH_TOKEN_SECRET must differ from JWT_SECRET");
  }
  _refreshSecret = secret;
  return secret;
}

export function generateJti(): string {
  return crypto.randomBytes(16).toString("hex");
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "15m" });
}

export function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign(
    { ...payload, jti: generateJti() },
    getRefreshSecret(),
    { expiresIn: "7d" }
  );
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, getJwtSecret(), { algorithms: ["HS256"] }) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, getRefreshSecret(), { algorithms: ["HS256"] }) as JwtPayload;
}
