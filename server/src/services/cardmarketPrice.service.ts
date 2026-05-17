import logger from "../utils/logger";

/**
 * 🔒 Cardmarket API – DEAKTIVOVÁNO
 * 
 * Důvod: Cardmarket Terms of Service zakazují ukládání a komerční použití
 * cenových dat bez písemného souhlasu. Služba je deaktivována do doby,
 * než bude uzavřena oficiální licence.
 * 
 * Viz: CARD_DATABASE_LEGAL_AUDIT.md (Riziko #2)
 */

export interface PriceResult {
  low: number | null;
  avg: number | null;
  trend: number | null;
}

export async function updateCardPrices(_cardId: string): Promise<PriceResult | null> {
  logger.warn("[CARD MARKET API] Deaktivováno – vyžaduje písemnou licenci od Cardmarket");
  return null;
}
