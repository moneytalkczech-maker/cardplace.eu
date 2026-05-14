import { Response } from "express";
import Stripe from "stripe";
import prisma from "../utils/prisma";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import logger from "../utils/logger";
import { trustDeltaForTransaction } from "../utils/trust";
import { sendPaymentReceivedEmail, sendWonEmail, sendSoldEmail } from "../utils/email";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-03-31" as any })
  : null;

export async function createCheckoutSession(req: AuthRequest, res: Response) {
  if (!stripe) throw new AppError(503, "Payments not configured (STRIPE_SECRET_KEY missing)");

  const { auctionId } = req.body;
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    include: { bids: { orderBy: { amount: "desc" }, take: 1 }, user: true },
  });
  if (!auction) throw new AppError(404, "Auction not found");
  if (auction.status !== "ENDED") throw new AppError(400, "Auction not ended");
  if (auction.userId === req.userId) throw new AppError(400, "Cannot pay for your own auction");

  const winningBid = auction.bids[0];
  if (!winningBid) throw new AppError(400, "No winning bid");
  if (winningBid.userId !== req.userId) throw new AppError(403, "You did not win this auction");

  const existing = await prisma.transaction.findUnique({ where: { auctionId } });
  if (existing?.status === "COMPLETED") throw new AppError(400, "Already paid");

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
    mode: "payment",
    payment_intent_data: {
      metadata: { auctionId, buyerId: req.userId!, sellerId: auction.userId },
    },
    line_items: [{
      price_data: {
        currency: "czk",
        product_data: { name: auction.title, description: `Auction #${auctionId}` },
        unit_amount: Math.round(winningBid.amount * 100),
      },
      quantity: 1,
    }],
    success_url: `${process.env.CORS_ORIGIN}/auctions/${auctionId}?payment=success`,
    cancel_url: `${process.env.CORS_ORIGIN}/auctions/${auctionId}?payment=cancel`,
  });

  await prisma.transaction.upsert({
    where: { auctionId },
    update: { stripeSessionId: session.id, status: "PENDING" },
    create: {
      amount: winningBid.amount, status: "PENDING", stripeSessionId: session.id,
      auctionId, buyerId: req.userId!, sellerId: auction.userId,
    },
  });

  res.json({ url: session.url });
}

export async function handleWebhook(req: AuthRequest, res: Response) {
  if (!stripe) throw new AppError(503, "Payments not configured");

  const sig = req.headers["stripe-signature"] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: any;
  if (endpointSecret) {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } else {
    event = req.body;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const auctionId = session.metadata?.auctionId;
    const buyerId = session.metadata?.buyerId;
    const sellerId = session.metadata?.sellerId;

    if (auctionId && buyerId && sellerId) {
      const paymentIntentId = session.payment_intent as string;
      const transaction = await prisma.transaction.findUnique({ where: { auctionId } });

      if (transaction && transaction.status !== "COMPLETED") {
        await prisma.transaction.update({
          where: { auctionId },
          data: { status: "COMPLETED", stripePaymentIntentId: paymentIntentId },
        });

        const winningBid = await prisma.bid.findFirst({ where: { auctionId }, orderBy: { amount: "desc" } });
        if (winningBid) {
          const delta = trustDeltaForTransaction(winningBid.amount);
          await prisma.user.update({
            where: { id: sellerId },
            data: {
              trustScore: { increment: delta },
              totalSales: { increment: 1 },
              credits: { increment: 1 },
            },
          });
          await prisma.user.update({ where: { id: buyerId }, data: { trustScore: { increment: 1 } } });
        }

        await prisma.notification.create({
          data: {
            message: "Aukce byla zaplacena!",
            type: "PAYMENT",
            link: `/auctions/${auctionId}`,
            userId: sellerId,
          },
        });

        const [auction, buyer, seller] = await Promise.all([
          prisma.auction.findUnique({ where: { id: auctionId }, select: { title: true } }),
          prisma.user.findUnique({ where: { id: buyerId }, select: { email: true, username: true } }),
          prisma.user.findUnique({ where: { id: sellerId }, select: { email: true, username: true } }),
        ]);
        if (seller?.email && auction) sendPaymentReceivedEmail(seller.email, seller.username, auction.title, auctionId).catch(() => {});
        if (buyer?.email && auction) sendWonEmail(buyer.email, buyer.username, auction.title, auctionId).catch(() => {});
        if (seller?.email && auction) sendSoldEmail(seller.email, seller.username, auction.title).catch(() => {});

        logger.info({ auctionId, buyerId, sellerId }, "Payment completed");
      }
    }
  }

  res.json({ received: true });
}

export async function submitReview(req: AuthRequest, res: Response) {
  const { transactionId, rating, comment } = req.body;
  if (!rating || rating < 1 || rating > 5) throw new AppError(400, "Rating must be 1-5");

  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { review: true },
  });
  if (!transaction) throw new AppError(404, "Transaction not found");
  if (transaction.buyerId !== req.userId) throw new AppError(403, "Only buyer can review");
  if (transaction.status !== "COMPLETED") throw new AppError(400, "Transaction not completed");
  if (transaction.review) throw new AppError(400, "Already reviewed");

  const review = await prisma.review.create({
    data: {
      rating, comment, transactionId: transaction.id,
      reviewerId: req.userId!, reviewedId: transaction.sellerId,
    },
  });

  await prisma.user.update({
    where: { id: transaction.sellerId },
    data: { trustScore: { increment: rating - 3 } },
  });

  res.json(review);
}

export async function getReviews(req: AuthRequest, res: Response) {
  const reviews = await prisma.review.findMany({
    where: { reviewedId: req.params.userId as string },
    orderBy: { createdAt: "desc" },
    include: { reviewer: { select: { id: true, username: true } } },
  });
  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;
  res.json({ reviews, avgRating, count: reviews.length });
}

export async function getConfig(_req: AuthRequest, res: Response) {
  res.json({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || "" });
}
