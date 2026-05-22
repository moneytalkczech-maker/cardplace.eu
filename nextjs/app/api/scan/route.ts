import { NextRequest, NextResponse } from "next/server";
import { scanCardWithClaude } from "@/lib/anthropic";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Simple in-memory rate limiter (resets on cold start)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  const maxScans = 30;

  const entry = rateLimitMap.get(userId);
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxScans) return false;
  entry.count++;
  return true;
}

function getUserId(request: NextRequest): string {
  const auth = request.headers.get("authorization");
  // Use token as rate-limit key (anonymous fallback: IP)
  if (auth?.startsWith("Bearer ")) return auth.slice(7, 40);
  return request.headers.get("x-forwarded-for") || "anonymous";
}

export async function POST(request: NextRequest) {
  const userId = getUserId(request);

  if (!checkRateLimit(userId)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Max 30 scans per hour." },
      { status: 429 }
    );
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    let imageBase64: string;
    let mimeType: string;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("image") as File | null;

      if (!file) {
        return NextResponse.json({ error: "No image provided" }, { status: 400 });
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: "Image too large (max 10MB)" }, { status: 413 });
      }

      mimeType = file.type || "image/jpeg";
      if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(mimeType)) {
        return NextResponse.json({ error: "Unsupported image format" }, { status: 400 });
      }

      const buffer = await file.arrayBuffer();
      imageBase64 = Buffer.from(buffer).toString("base64");
    } else if (contentType.includes("application/json")) {
      const body = await request.json();
      if (!body.image) {
        return NextResponse.json({ error: "No image provided" }, { status: 400 });
      }
      // Expect base64 data URL: "data:image/jpeg;base64,..."
      const match = (body.image as string).match(/^data:(image\/\w+);base64,(.+)$/);
      if (!match) {
        return NextResponse.json({ error: "Invalid base64 image" }, { status: 400 });
      }
      mimeType = match[1];
      imageBase64 = match[2];
    } else {
      return NextResponse.json({ error: "Unsupported content type" }, { status: 415 });
    }

    const result = await scanCardWithClaude(imageBase64, mimeType);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/scan] Error:", message);

    if (message.includes("API key") || message.includes("authentication")) {
      return NextResponse.json({ error: "AI service configuration error" }, { status: 502 });
    }
    return NextResponse.json({ error: "AI scan failed. Please try again." }, { status: 502 });
  }
}
