import prisma from "./prisma";

export interface FraudCheckResult {
  suspicious: boolean;
  reasons: string[];
  score: number; // 0–100, vyšší = podezřelejší
}

/** Jednoduchá detekce podezřelých aktivit */
export async function checkAuctionFraud(userId: string, startingPrice: number): Promise<FraudCheckResult> {
  const reasons: string[] = [];
  let score = 0;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      createdAt: true,
      trustScore: true,
      totalSales: true,
      verified: true,
      _count: { select: { auctions: true } },
    },
  });

  if (!user) return { suspicious: false, reasons: [], score: 0 };

  // 1. Nový účet + vysoká cena
  const daysOld = (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  if (daysOld < 7 && startingPrice > 1000) {
    reasons.push("Nový účet (méně než 7 dní) s vysokou vyvolávací cenou");
    score += 30;
  }

  // 2. Nízké trustScore + vysoká cena
  if (user.trustScore < 20 && startingPrice > 2000) {
    reasons.push("Nízké skóre důvěry s vysokou cenou");
    score += 20;
  }

  // 3. Neověřený účet + vysoká cena
  if (!user.verified && startingPrice > 3000) {
    reasons.push("Neověřený účet s vysokou cenou");
    score += 15;
  }

  // 4. Žádné předchozí prodeje + vysoká cena
  if (user.totalSales === 0 && startingPrice > 1500) {
    reasons.push("Žádné dokončené prodeje");
    score += 15;
  }

  // 5. Příliš mnoho aktivních aukcí (potenciální spam)
  if (user._count.auctions > 20) {
    reasons.push("Moc aktivních aukcí");
    score += 10;
  }

  return {
    suspicious: score >= 30,
    reasons,
    score: Math.min(score, 100),
  };
}

/** Detekce podezřelého bidding chování */
export async function checkBidFraud(userId: string, auctionId: string): Promise<FraudCheckResult> {
  const reasons: string[] = [];
  let score = 0;

  // Rychlé příhozy vlastní aukce (zkontrolováno už v controlleru)
  // Sledování více aukcí od stejného nového uživatele
  const recentBids = await prisma.bid.count({
    where: {
      userId,
      createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
    },
  });

  if (recentBids > 10) {
    reasons.push("Příliš mnoho příhozů za krátkou dobu");
    score += 20;
  }

  return {
    suspicious: score >= 20,
    reasons,
    score: Math.min(score, 100),
  };
}
