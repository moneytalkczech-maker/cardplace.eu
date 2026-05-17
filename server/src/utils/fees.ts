import prisma from "./prisma";

const DEFAULT_FEE_PERCENT = 5;
const FEE_FLOOR_CZK = 5;

export interface FeeResult {
  feePercent: number;
  fee: number;
  netAmount: number;
}

export async function getMonetizationConfig() {
  try {
    const config = await prisma.monetizationConfig.findUnique({
      where: { id: "platform" },
    });
    return config;
  } catch {
    return null;
  }
}

export async function ensureMonetizationConfig() {
  try {
    let config = await prisma.monetizationConfig.findUnique({
      where: { id: "platform" },
    });
    if (!config) {
      config = await prisma.monetizationConfig.create({
        data: { id: "platform" },
      });
    }
    return config;
  } catch {
    return null;
  }
}

/** Convert amount to integer cents to avoid floating-point artifacts */
function toCents(amount: number): number {
  return Math.round(amount * 100);
}

/** Calculate fee with fail-closed: if config is missing, default 5% */
export async function calculateFee(
  amount: number,
  sellerId: string,
): Promise<FeeResult> {
  const [config, seller] = await Promise.all([
    getMonetizationConfig(),
    prisma.user.findUnique({ where: { id: sellerId } }),
  ]);

  // FAIL-CLOSED: If config is missing, use 5% default with fee floor
  if (!config) {
    const feePercent = DEFAULT_FEE_PERCENT;
    const feeCents = Math.max(toCents(amount * feePercent / 100), FEE_FLOOR_CZK * 100);
    const fee = feeCents / 100;
    const netAmount = Math.round((toCents(amount) - feeCents)) / 100;
    return { feePercent, fee, netAmount };
  }

  // Founder nebo VIP → zvýhodněná fee
  if (seller?.founder || (seller?.vipUntil && seller.vipUntil > new Date())) {
    const pct = config.feeFounder;
    const feeCents = Math.max(toCents(amount * pct / 100), FEE_FLOOR_CZK * 100);
    const fee = feeCents / 100;
    const netAmount = Math.round((toCents(amount) - feeCents)) / 100;
    return { feePercent: pct, fee, netAmount };
  }

  // Phase 1 = 0 % (pouze pro testování)
  if (config.feePhase === "phase1") {
    return { feePercent: 0, fee: 0, netAmount: amount };
  }

  // Phase 2 = progressive fee
  let pct = config.feeDefault;
  if (amount <= 500) pct = config.feeBelow500;
  else if (amount <= 5000) pct = config.fee500to5000;
  else pct = config.feeAbove5000;

  const feeCents = Math.max(toCents(amount * pct / 100), FEE_FLOOR_CZK * 100);
  const fee = feeCents / 100;
  const netAmount = Math.round((toCents(amount) - feeCents)) / 100;
  return { feePercent: pct, fee, netAmount };
}
