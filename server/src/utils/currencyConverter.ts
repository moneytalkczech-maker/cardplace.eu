const rates: Record<string, number> = {
  EUR: parseFloat(process.env.EUR_TO_CZK || "25.30"),
  USD: parseFloat(process.env.USD_TO_CZK || "23.20"),
  GBP: parseFloat(process.env.GBP_TO_CZK || "29.50"),
  CZK: 1,
};

export function toCzk(amount: number, fromCurrency: string): number {
  const rate = rates[fromCurrency.toUpperCase()];
  if (!rate) return amount;
  return Math.round(amount * rate * 100) / 100;
}

export function fromCzk(amount: number, toCurrency: string): number {
  const rate = rates[toCurrency.toUpperCase()];
  if (!rate) return amount;
  return Math.round((amount / rate) * 100) / 100;
}

export function convert(amount: number, from: string, to: string): number {
  const inCzk = toCzk(amount, from);
  return fromCzk(inCzk, to);
}
