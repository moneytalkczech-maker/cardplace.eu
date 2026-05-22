import crypto from "crypto";
import prisma from "./prisma";
import logger from "./logger";

export function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function sendResetEmail(email: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return false; // Neříkáme, zda email existuje (security)

  const token = generateResetToken();
  const baseUrl = process.env.CORS_ORIGIN || "http://localhost:5173";
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hodina

  // Hashovat token před uložením do DB — při kompromitaci DB útočník nevidí raw tokeny
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: hashToken(token),
      passwordResetExpires: expires,
    },
  });

  const link = `${baseUrl}/reset-password?token=${token}`;

  try {
    const { Resend } = await import("resend");
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      await resend.emails.send({
        from: process.env.EMAIL_FROM || "CardPlace <noreply@cardplace.eu>",
        to: email,
        subject: "Obnova hesla — CardPlace.eu",
        html: `
          <h2>Obnova hesla</h2>
          <p>Někdo požádal o obnovu hesla k tvému účtu CardPlace.eu.</p>
          <p>Pokud to byl někdo jiný, tento email můžeš ignorovat.</p>
          <a href="${link}" style="display:inline-block;padding:12px 24px;background:#00C8FF;color:#000;text-decoration:none;border-radius:8px;font-weight:bold;">Obnovit heslo</a>
          <p><small>Odkaz platí 1 hodinu.</small></p>
        `,
      });
      return true;
    }
  } catch {
    // Ticho
  }

  logger.info({ email }, "Password reset email would be sent here in production");
  return true;
}

export async function verifyResetToken(token: string): Promise<{ id: string } | null> {
  // Hashovat vstupní token před lookupem — v DB je uložen hash
  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: hashToken(token),
      passwordResetExpires: { gte: new Date() },
    },
  });
  if (!user) return null;
  return { id: user.id };
}

export async function clearResetToken(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });
}
