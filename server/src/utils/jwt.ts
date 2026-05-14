import jwt from "jsonwebtoken";

export interface JwtPayload {
  id: string;
  role: string;
  username?: string;
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
  const secret = process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET;
  if (!secret) throw new Error("REFRESH_TOKEN_SECRET or JWT_SECRET is required");
  _refreshSecret = secret;
  return secret;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "15m" });
}

export function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, getRefreshSecret(), { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, getJwtSecret()) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, getRefreshSecret()) as JwtPayload;
}