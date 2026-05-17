import prisma from "./prisma";

export interface FraudCheckResult {
  suspicious: boolean;
  reasons: string[];
  score: number; // 0–100, vyšší = podezřelejší
}

/** Práh pro označení aukce za podezřelou */
const SUSPICIOUS_THRESHOLD = 30;

/** Detekce podezřelých aktivit při vytváření aukce */
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
      emailVerifiedAt: true,
      createdIp: true,
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

  // 5. Neověřený email + jakákoli aukce
  if (!user.emailVerifiedAt && startingPrice > 0) {
    reasons.push("Email není ověřený");
    score += 10;
  }

  // 6. Příliš mnoho aktivních aukcí (potenciální spam)
  if (user._count.auctions > 20) {
    reasons.push("Moc aktivních aukcí");
    score += 10;
  }

  // 7. Velmi nový účet (méně než 1 den) s jakoukoli aukcí
  if (daysOld < 1) {
    reasons.push("Účet vytvořen před méně než 24 hodinami");
    score += 20;
  }

  return {
    suspicious: score >= SUSPICIOUS_THRESHOLD,
    reasons,
    score: Math.min(score, 100),
  };
}

/** Detekce podezřelého bidding chování */
export async function checkBidFraud(userId: string, auctionId: string, bidAmount: number): Promise<FraudCheckResult> {
  const reasons: string[] = [];
  let score = 0;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { createdAt: true, trustScore: true },
  });

  if (!user) return { suspicious: false, reasons: [], score: 0 };

  // 1. Rychlé příhozy (více než 10 bidů za hodinu)
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

  // 2. Nový účet bidující vysoké částky
  const daysOld = (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  if (daysOld < 3 && bidAmount > 5000) {
    reasons.push("Nový účet s vysokým příhozem");
    score += 25;
  }

  // 3. Nízký trust score + vysoký bid
  if (user.trustScore < 10 && bidAmount > 3000) {
    reasons.push("Nízké skóre důvěry u vysokého příhozu");
    score += 15;
  }

  // 4. Kontrola, zda uživatel nebiduje vlastní aukci (shilling detection)
  const auctionOwner = await prisma.auction.findUnique({
    where: { id: auctionId },
    select: { userId: true },
  });
  if (auctionOwner && auctionOwner.userId === userId) {
    reasons.push("Příhoz na vlastní aukci");
    score += 50;
  }

  // 5. Počet aktivních aukcí, kde uživatel biduje (pattern detection)
  const distinctAuctionBids = await prisma.bid.groupBy({
    by: ["auctionId"],
    where: {
      userId,
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });
  if (distinctAuctionBids.length > 20) {
    reasons.push("Příliš mnoho různých aukcí v krátkém čase");
    score += 10;
  }

  return {
    suspicious: score >= SUSPICIOUS_THRESHOLD,
    reasons,
    score: Math.min(score, 100),
  };
}
