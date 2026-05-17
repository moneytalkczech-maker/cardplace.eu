import prisma from "./prisma";

const CURRENCY_KEYS: Record<string, string> = {
  EUR: "currency_eur_to_czk",
  USD: "currency_usd_to_czk",
  GBP: "currency_gbp_to_czk",
};

const ENV_FALLBACKS: Record<string, { env: string; default: string }> = {
  EUR: { env: "EUR_TO_CZK", default: "25.30" },
  USD: { env: "USD_TO_CZK", default: "23.20" },
  GBP: { env: "GBP_TO_CZK", default: "29.50" },
};

/** Load currency rates from DB (SiteSetting), fallback to env/hardcoded */
async function loadRates(): Promise<Record<string, number>> {
  const rates: Record<string, number> = { CZK: 1 };

  for (const [currency, dbKey] of Object.entries(CURRENCY_KEYS)) {
    try {
      const setting = await prisma.siteSetting.findUnique({ where: { key: dbKey } });
      if (setting) {
        rates[currency] = parseFloat(setting.value);
        continue;
      }
    } catch {
      // DB unavailable — fallback below
    }

    // Fallback: env var → hardcoded default
    const fallback = ENV_FALLBACKS[currency];
    rates[currency] = parseFloat(process.env[fallback.env] || fallback.default);
  }

  return rates;
}

/** In-memory cache refreshable via refreshRates() */
let cachedRates: Record<string, number> | null = null;

/** Get current rates (cached after first load) */
export async function getRates(): Promise<Record<string, number>> {
  if (!cachedRates) {
    cachedRates = await loadRates();
  }
  return cachedRates;
}

/** Force reload rates from DB (call after admin updates a rate) */
export async function refreshRates(): Promise<Record<string, number>> {
  cachedRates = await loadRates();
  return cachedRates;
}

/** Admin: update a specific currency rate in the DB */
export async function setRate(currency: string, value: number): Promise<void> {
  const key = CURRENCY_KEYS[currency.toUpperCase()];
  if (!key) throw new Error(`Unsupported currency: ${currency}`);

  await prisma.siteSetting.upsert({
    where: { key },
    update: { value: String(value), type: "number", group: "currency" },
    create: { key, value: String(value), type: "number", group: "currency", description: `Směnný kurz ${currency} → CZK` },
  });

  // Invalidate cache on next read
  cachedRates = null;
}

export async function toCzk(amount: number, fromCurrency: string): Promise<number> {
  const rates = await getRates();
  const rate = rates[fromCurrency.toUpperCase()];
  if (!rate) return amount;
  return Math.round(amount * rate * 100) / 100;
}

export async function fromCzk(amount: number, toCurrency: string): Promise<number> {
  const rates = await getRates();
  const rate = rates[toCurrency.toUpperCase()];
  if (!rate) return amount;
  return Math.round((amount / rate) * 100) / 100;
}

export async function convert(amount: number, from: string, to: string): Promise<number> {
  const inCzk = await toCzk(amount, from);
  return await fromCzk(inCzk, to);
}
