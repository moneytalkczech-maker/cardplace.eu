import { Response } from "express";
import prisma from "../utils/prisma";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { ensureMonetizationConfig, calculateFee } from "../utils/fees";
import logger from "../utils/logger";

// Singleton Stripe instance
let stripeInstance: any = null;
function getStripe() {
  if (!stripeInstance && process.env.STRIPE_SECRET_KEY) {
    const Stripe = require("stripe");
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-03-31" as any });
  }
  return stripeInstance;
}

/** Add calendar months to a date */
function addCalendarMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/** Idempotency check: skip if webhook event was already processed */
async function isWebhookProcessed(eventId: string): Promise<boolean> {
  const existing = await prisma.siteSetting.findUnique({
    where: { key: `webhook_${eventId}` },
  });
  return !!existing;
}

async function markWebhookProcessed(eventId: string): Promise<void> {
  await prisma.siteSetting.create({
    data: {
      key: `webhook_${eventId}`,
      value: new Date().toISOString(),
      type: "string",
      group: "webhooks",
      description: "Processed Stripe webhook event",
    },
  }).catch(() => {
    // Item already exists (race condition guard) — ignore
  });
}

// ─── Admin: nastavení monetizace ───

export async function getConfig(_req: AuthRequest, res: Response) {
  const config = await ensureMonetizationConfig();
  res.json(config);
}

export async function updateConfig(req: AuthRequest, res: Response) {
  if (req.userRole?.toLowerCase() !== "admin") throw new AppError(403, "Admin access required");

  const allowed = [
    "feePhase", "feeDefault", "feeBelow500", "fee500to5000", "feeAbove5000",
    "feeFounder", "feeVip",
    "verifiedPrice", "vipMonthly", "vipYearly",
    "boostTop", "boostHomepage", "boostHighlight", "boostSocial",
    "founderLimit",
  ];

  const data: Record<string, any> = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) data[key] = req.body[key];
  }

  const config = await prisma.monetizationConfig.update({
    where: { id: "platform" },
    data,
  });
  logger.info({ changes: Object.keys(data) }, "Monetization config updated by admin");
  res.json(config);
}

// ─── Founder program ───

export async function listFounders(_req: AuthRequest, res: Response) {
  const founders = await prisma.user.findMany({
    where: { founder: true },
    select: { id: true, username: true, avatarUrl: true, founderSince: true, trustScore: true },
    orderBy: { founderSince: "asc" },
  });
  res.json(founders);
}

export async function assignFounder(req: AuthRequest, res: Response) {
  if (req.userRole?.toLowerCase() !== "admin") throw new AppError(403, "Admin access required");

  const { userId } = req.body;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, "User not found");
  if (user.founder) throw new AppError(400, "User is already a founder");

  // Atomická operace: kontrola limitu + inkrement + přiřazení v jedné transakci
  // Prevence race condition: dva admini nemohou současně překročit limit
  await prisma.$transaction(async (tx) => {
    const config = await tx.monetizationConfig.findUnique({ where: { id: "platform" } });
    if (!config) throw new AppError(500, "Monetization config not available");

    if (config.founderCount >= config.founderLimit) {
      throw new AppError(400, `Founder limit reached (${config.founderLimit})`);
    }

    // Inkrementovat founderCount v transakci
    await tx.monetizationConfig.update({
      where: { id: "platform" },
      data: { founderCount: { increment: 1 } },
    });

    // Přiřadit founder status
    await tx.user.update({
      where: { id: userId },
      data: {
        founder: true,
        founderSince: new Date(),
        verified: true,
        verifiedType: "founder",
        credits: { increment: 10 },
      },
    });

    await tx.notification.create({
      data: {
        message: "🎉 Jsi founder CardPortal.eu! Získáváš VIP status, verified badge a 10 kreditů zdarma.",
        type: "INFO",
        userId,
      },
    });
  });

  logger.info({ userId }, "Founder assigned by admin");
  res.json({ success: true });
}

// ─── VIP předplatné ───

export async function createVipCheckout(req: AuthRequest, res: Response) {
  const { plan } = req.body; // "monthly" | "yearly"
  if (!["monthly", "yearly"].includes(plan)) throw new AppError(400, "Invalid plan");

  const stripe = getStripe();
  if (!stripe) throw new AppError(503, "Payments not configured");

  const config = await ensureMonetizationConfig();
  if (!config) throw new AppError(500, "Monetization config not available");

  const price = plan === "monthly" ? config.vipMonthly : config.vipYearly;

  // Get or create Stripe customer
  let stripeCustomerId: string | undefined;
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (user?.stripeCustomerId) {
    stripeCustomerId = user.stripeCustomerId;
  } else {
    const customer = await stripe.customers.create({
      email: user?.email,
      metadata: { userId: req.userId! },
    });
    stripeCustomerId = customer.id;
    await prisma.user.update({ where: { id: req.userId }, data: { stripeCustomerId } });
  }

  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: "subscription",
    line_items: [{
      price_data: {
        currency: "czk",
        product_data: { name: `VIP ${plan === "monthly" ? "Měsíční" : "Roční"}` },
        unit_amount: Math.round(price * 100),
        recurring: { interval: plan === "monthly" ? "month" : "year" },
      },
      quantity: 1,
    }],
    metadata: { plan, userId: req.userId!, type: "vip" },
    success_url: `${process.env.CORS_ORIGIN}/profile?vip=success`,
    cancel_url: `${process.env.CORS_ORIGIN}/profile?vip=cancel`,
  });

  res.json({ url: session.url });
}

// ─── Verified platba ───

export async function createVerifiedCheckout(req: AuthRequest, res: Response) {
  const stripe = getStripe();
  if (!stripe) throw new AppError(503, "Payments not configured");

  const config = await ensureMonetizationConfig();
  if (!config) throw new AppError(500, "Monetization config not available");

  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (user?.verified) throw new AppError(400, "Already verified");

  let stripeCustomerId: string | undefined;
  if (user?.stripeCustomerId) {
    stripeCustomerId = user.stripeCustomerId;
  } else {
    const customer = await stripe.customers.create({
      email: user?.email,
      metadata: { userId: req.userId! },
    });
    stripeCustomerId = customer.id;
    await prisma.user.update({ where: { id: req.userId }, data: { stripeCustomerId } });
  }

  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: "payment",
    line_items: [{
      price_data: {
        currency: "czk",
        product_data: { name: "Verified badge" },
        unit_amount: Math.round(config.verifiedPrice * 100),
      },
      quantity: 1,
    }],
    metadata: { userId: req.userId!, type: "verified" },
    success_url: `${process.env.CORS_ORIGIN}/profile?verified=success`,
    cancel_url: `${process.env.CORS_ORIGIN}/profile?verified=cancel`,
  });

  res.json({ url: session.url });
}

// ─── Boost aukcí (placený) ───

export async function createBoostCheckout(req: AuthRequest, res: Response) {
  const { auctionId, boostType } = req.body; // "top" | "homepage" | "highlight" | "social"
  const validTypes = ["top", "homepage", "highlight", "social"];
  if (!validTypes.includes(boostType)) throw new AppError(400, "Invalid boost type");

  const auction = await prisma.auction.findUnique({ where: { id: auctionId } });
  if (!auction) throw new AppError(404, "Auction not found");
  if (auction.userId !== req.userId) throw new AppError(403, "Not your auction");

  const stripe = getStripe();
  if (!stripe) throw new AppError(503, "Payments not configured");

  const config = await ensureMonetizationConfig();
  if (!config) throw new AppError(500, "Monetization config not available");

  const prices: Record<string, number> = {
    top: config.boostTop,
    homepage: config.boostHomepage,
    highlight: config.boostHighlight,
    social: config.boostSocial,
  };
  const price = prices[boostType];

  const names: Record<string, string> = {
    top: "Top pozice v aukcích",
    homepage: "Homepage boost",
    highlight: "Barevné zvýraznění",
    social: "Instagram/TikTok promo",
  };

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{
      price_data: {
        currency: "czk",
        product_data: { name: names[boostType] },
        unit_amount: Math.round(price * 100),
      },
      quantity: 1,
    }],
    metadata: {
      auctionId,
      userId: req.userId!,
      type: "boost",
      boostType,
    },
    success_url: `${process.env.CORS_ORIGIN}/auctions/${auctionId}?boost=success`,
    cancel_url: `${process.env.CORS_ORIGIN}/auctions/${auctionId}?boost=cancel`,
  });

  res.json({ url: session.url, name: names[boostType], price });
}

// ─── Webhook pro Stripe events ───

export async function handleMonetizationWebhook(req: AuthRequest, res: Response) {
  const stripe = getStripe();
  if (!stripe) {
    logger.warn("Monetization webhook received but Stripe is not configured");
    res.status(503).json({ error: "Payments not configured" });
    return;
  }

  const sig = req.headers["stripe-signature"] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret) {
    logger.error("STRIPE_WEBHOOK_SECRET is not configured — webhooks will be rejected");
    res.status(500).json({ error: "Webhook secret not configured" });
    return;
  }

  let event: any;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch {
    logger.warn({ sig }, "Invalid Stripe webhook signature");
    res.status(400).json({ error: "Invalid signature" });
    return;
  }

  // 🔒 Idempotency check: skip if already processed
  if (event.id && await isWebhookProcessed(event.id)) {
    logger.info({ eventId: event.id }, "Webhook already processed, skipping");
    res.json({ received: true, skipped: true });
    return;
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const meta = session.metadata || {};
      const userId = meta.userId;

      if (meta.type === "verified" && userId) {
        await prisma.user.update({
          where: { id: userId },
          data: { verified: true, verifiedType: "paid" },
        });
        await prisma.notification.create({
          data: { message: "✅ Tvůj účet je nyní ověřený!", type: "INFO", userId },
        });
        logger.info({ userId }, "Verified badge purchased");
      }

      if (meta.type === "boost" && meta.auctionId) {
        // Verify auction belongs to user
        const auction = await prisma.auction.findUnique({ where: { id: meta.auctionId } });
        if (!auction || auction.userId !== userId) {
          logger.warn({ auctionId: meta.auctionId, userId }, "Boost auction mismatch");
          res.json({ received: true });
          return;
        }

        const boostType = meta.boostType;
        const days: Record<string, number> = { top: 7, homepage: 7, highlight: 14, social: 3 };
        const now = new Date();

        await prisma.promotion.create({
          data: {
            type: boostType,
            price: session.amount_total / 100,
            stripeSessionId: session.id,
            status: "ACTIVE",
            startsAt: now,
            endsAt: new Date(now.getTime() + (days[boostType] || 7) * 24 * 60 * 60 * 1000),
            auctionId: meta.auctionId,
            userId,
          },
        });

        // Pro "homepage" boost zapneme featured
        if (boostType === "homepage") {
          await prisma.auction.update({
            where: { id: meta.auctionId },
            data: { featured: true },
          });
        }
      }

      if (meta.type === "vip" && userId) {
        const months = meta.plan === "yearly" ? 12 : 1;
        const now = new Date();
        // Use calendar months instead of 30-day months
        const vipUntil = addCalendarMonths(now, months);

        let stripeSubId: string;
        if (typeof session.subscription === "string") {
          stripeSubId = session.subscription;
        } else {
          stripeSubId = session.id;
          logger.warn({ sessionId: session.id }, "VIP checkout: session.subscription is not a string, using session.id");
        }

        await prisma.user.update({
          where: { id: userId },
          data: { vipUntil },
        });

        await prisma.subscription.create({
          data: {
            plan: `vip_${meta.plan}`,
            status: "ACTIVE",
            stripeSubId,
            currentPeriodStart: now,
            currentPeriodEnd: vipUntil,
            userId,
          },
        });

        await prisma.notification.create({
          data: {
            message: `⭐ Vítá tě VIP! Aktivní do ${vipUntil.toLocaleDateString("cs-CZ")}.`,
            type: "INFO",
            userId,
          },
        });
      }
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object;
      const subId = invoice.subscription;
      if (subId) {
        const sub = await prisma.subscription.findFirst({
          where: { stripeSubId: subId },
        });
        if (sub) {
          const periodEnd = new Date(invoice.lines?.data?.[0]?.period?.end * 1000 || Date.now());
          // Use Stripe's actual period end (which is calendar-accurate)
          await prisma.subscription.update({
            where: { id: sub.id },
            data: {
              currentPeriodEnd: periodEnd,
              status: "ACTIVE",
            },
          });
          await prisma.user.update({
            where: { id: sub.userId },
            data: { vipUntil: periodEnd },
          });
        }
      }
      break;
    }

    case "customer.subscription.deleted": {
      const deletedSub = event.data.object;
      const existing = await prisma.subscription.findFirst({
        where: { stripeSubId: deletedSub.id },
      });
      if (existing) {
        await prisma.subscription.update({
          where: { id: existing.id },
          data: { status: "CANCELLED", cancelledAt: new Date() },
        });
        await prisma.user.update({
          where: { id: existing.userId },
          data: { vipUntil: null },
        });
      }
      break;
    }
  }

  // Mark webhook as processed
  if (event.id) {
    await markWebhookProcessed(event.id);
  }

  res.json({ received: true });
}
