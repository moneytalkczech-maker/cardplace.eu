import prisma from "../utils/prisma";
import { updateCardPrices } from "../services/cardmarketPrice.service";
import { updateEbayPrices } from "../services/ebayPrice.service";
import logger from "../utils/logger";

const BATCH_SIZE = 5;

export async function runPriceUpdate(): Promise<void> {
  logger.info("Starting scheduled price update...");

  const cards = await prisma.databaseCard.findMany({
    orderBy: { pricesUpdatedAt: { sort: "asc", nulls: "first" } },
    take: BATCH_SIZE,
  });

  if (cards.length === 0) {
    logger.info("No cards to update prices for");
    return;
  }

  let updated = 0;
  for (const card of cards) {
    try {
      const cmResult = await updateCardPrices(card.id);
      const ebayResult = await updateEbayPrices(card.id);
      if (cmResult || ebayResult) updated++;
      // Pauza mezi requesty
      await new Promise((r) => setTimeout(r, 1000));
    } catch (err) {
      logger.error({ cardId: card.id, err }, "Price update failed for card");
    }
  }

  logger.info({ updated, total: cards.length }, "Price update batch completed");
}
