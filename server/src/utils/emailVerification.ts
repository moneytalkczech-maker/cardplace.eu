import crypto from "crypto";
import prisma from "./prisma";
import logger from "./logger";

export function generateVerifyToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function sendVerificationEmail(userId: string, email: string): Promise<void> {
  const token = generateVerifyToken();
  const baseUrl = process.env.CORS_ORIGIN || "http://localhost:5173";

  // Hashovat token před uložením do DB — při kompromitaci DB útočník nevidí raw tokeny
  await prisma.user.update({
    where: { id: userId },
    data: {
      emailVerifyToken: hashToken(token),
      emailVerifyExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
    },
  });

  const link = `${baseUrl}/verify-email?token=${token}`;

  // Pokusíme se odeslat email přes Resend
  try {
    const { Resend } = await import("resend");
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      await resend.emails.send({
        from: process.env.EMAIL_FROM || "CardPlace <noreply@cardplace.eu>",
        to: email,
        subject: "Ověř svůj email — CardPlace.eu",
        html: `
          <h2>Vítej v CardPlace.eu!</h2>
          <p>Pro aktivaci účtu klikni na tlačítko:</p>
          <a href="${link}" style="display:inline-block;padding:12px 24px;background:#00C8FF;color:#000;text-decoration:none;border-radius:8px;font-weight:bold;">Ověřit email</a>
          <p><small>Platnost odkazu: 24 hodin</small></p>
        `,
      });
      return;
    }
  } catch {
    // Resend není nakonfigurován
    logger.warn({ email }, "Email service not configured, verification email not sent");
  }

  if (!process.env.RESEND_API_KEY) {
    logger.info({ email }, "Verification email would be sent here in production");
  }
}

export async function verifyEmail(token: string): Promise<boolean> {
  // Hashovat vstupní token před lookupem — v DB je uložen hash
  const user = await prisma.user.findFirst({
    where: {
      emailVerifyToken: hashToken(token),
      emailVerifyExpiresAt: { gte: new Date() }, // Token nesmí být expirovaný
    },
  });

  if (!user) return false;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerifiedAt: new Date(),
      emailVerifyToken: null,
      emailVerifyExpiresAt: null,
    },
  });

  return true;
}

export function isEmailVerified(user: { emailVerifiedAt?: Date | null }): boolean {
  return !!user.emailVerifiedAt;
}
