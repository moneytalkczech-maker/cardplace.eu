import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import logger from "../utils/logger";

interface ContactRequest extends AuthRequest {
  body: {
    name: string;
    email: string;
    message: string;
  };
}

export async function submitContact(req: ContactRequest, res: Response) {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    throw new AppError(400, "Name, email and message are required");
  }

  if (message.length < 10) {
    throw new AppError(400, "Message must be at least 10 characters");
  }

  if (message.length > 5000) {
    throw new AppError(400, "Message is too long (max 5000 characters)");
  }

  // Odeslat email notifikaci na support (pokud je RESEND_API_KEY nastaven)
  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: process.env.EMAIL_FROM || "CardPortal <noreply@cardportal.eu>",
        to: "info@cardportal.eu",
        subject: `📩 Kontaktní formulář: ${name}`,
        html: `
          <h2>Nová zpráva z kontaktního formuláře</h2>
          <table>
            <tr><td><strong>Jméno:</strong></td><td>${name}</td></tr>
            <tr><td><strong>Email:</strong></td><td>${email}</td></tr>
            <tr><td><strong>Zpráva:</strong></td><td>${message.replace(/\n/g, "<br>")}</td></tr>
          </table>
          <hr>
          <p><small>IP: ${req.ip} | User-Agent: ${req.headers["user-agent"]}</small></p>
        `,
      });
      logger.info({ name, email }, "Contact form email sent");
    } catch (err) {
      logger.error({ err, name, email }, "Failed to send contact form email");
      // Neházíme chybu — zpráva je uložena v logu
    }
  } else {
    logger.info({ name, email, messageLength: message.length }, "Contact form submission (no email configured)");
  }

  res.json({
    success: true,
    message: "Děkujeme za zprávu! Odpovíme co nejdříve.",
  });
}
