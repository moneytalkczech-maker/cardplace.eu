import prisma from "./prisma";

export interface FeeResult {
  feePercent: number;
  fee: number;
  netAmount: number;
}

export async function getMonetizationConfig() {
  const config = await prisma.monetizationConfig.findUnique({
    where: { id: "platform" },
  });
  return config;
}

export async function ensureMonetizationConfig() {
  const existing = await prisma.monetizationConfig.findUnique({
    where: { id: "platform" },
  });
  if (!existing) {
    return prisma.monetizationConfig.create({
      data: { id: "platform" },
    });
  }
  return existing;
}

export async function calculateFee(
  amount: number,
  sellerId: string,
): Promise<FeeResult> {
  const [config, seller] = await Promise.all([
    getMonetizationConfig(),
    prisma.user.findUnique({ where: { id: sellerId } }),
  ]);

  if (!config) {
    return { feePercent: 0, fee: 0, netAmount: amount };
  }

  // Founder nebo VIP → zvýhodněná fee
  if (seller?.founder || (seller?.vipUntil && seller.vipUntil > new Date())) {
    const pct = config.feeFounder;
    const fee = Math.round((amount * pct) / 100 * 100) / 100;
    return { feePercent: pct, fee, netAmount: Math.round((amount - fee) * 100) / 100 };
  }

  // Phase 1 = 0 %
  if (config.feePhase === "phase1") {
    return { feePercent: 0, fee: 0, netAmount: amount };
  }

  // Phase 2 = progressive fee
  let pct = config.feeDefault;
  if (amount <= 500) pct = config.feeBelow500;
  else if (amount <= 5000) pct = config.fee500to5000;
  else pct = config.feeAbove5000;

  const fee = Math.round((amount * pct) / 100 * 100) / 100;
  return { feePercent: pct, fee, netAmount: Math.round((amount - fee) * 100) / 100 };
}
