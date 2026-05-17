import prisma from "./utils/prisma";
import bcrypt from "bcryptjs";
import logger from "./utils/logger";

async function seed() {
  logger.info("Seeding database...");

  // 1. Admin user
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@cardplace.eu" },
    update: {},
    create: {
      email: "admin@cardplace.eu",
      username: "admin",
      password: adminPassword,
      role: "admin",
      verified: true,
      emailVerifiedAt: new Date(),
      credits: 999,
      trustScore: 100,
    },
  });
  logger.info({ userId: admin.id }, "Admin user created");

  // 2. Test users (10 uživatelů)
  const userPassword = await bcrypt.hash("user1234", 10);
  const users = [];
  const usernames = ["sběratel1", "pokemonMaster", "magicFan", "yugiohPro", "cardCollector", "traderCZ", "rareHunter", "flipperSK", "vintageCards", "newbie2024"];
  for (let i = 0; i < 10; i++) {
    const user = await prisma.user.upsert({
      where: { email: `user${i + 1}@cardplace.eu` },
      update: {},
      create: {
        email: `user${i + 1}@cardplace.eu`,
        username: usernames[i],
        password: userPassword,
        role: "user",
        verified: i < 4,
        credits: 10 + Math.floor(Math.random() * 20),
        trustScore: Math.floor(Math.random() * 80) + 10,
        totalSales: Math.floor(Math.random() * 15),
        emailVerifiedAt: new Date(),
      },
    });
    users.push(user);
  }
  logger.info({ count: users.length }, "Test users created");

  // 3. Card sets (10 setů)
  const sets = [
    { name: "Scarlet & Violet", slug: "scarlet-violet", category: "pokemon", brand: "Pokémon" },
    { name: "Paldean Fates", slug: "paldean-fates", category: "pokemon", brand: "Pokémon" },
    { name: "Temporal Forces", slug: "temporal-forces", category: "pokemon", brand: "Pokémon" },
    { name: "The Lost Age", slug: "the-lost-age", category: "pokemon", brand: "Pokémon" },
    { name: "Wild Force", slug: "wild-force", category: "pokemon", brand: "Pokémon" },
    { name: "Magic: The Gathering – Modern Horizons 3", slug: "mh3", category: "magic", brand: "Wizards of the Coast" },
    { name: "Magic: The Gathering – Murders at Karlov Manor", slug: "murders", category: "magic", brand: "Wizards of the Coast" },
    { name: "Yu-Gi-Oh! – Phantom Nightmare", slug: "phantom-nightmare", category: "yugioh", brand: "Konami" },
    { name: "Yu-Gi-Oh! – Rage of the Abyss", slug: "rage-abyss", category: "yugioh", brand: "Konami" },
    { name: "Magic: The Gathering – Lord of the Rings", slug: "lotr", category: "magic", brand: "Wizards of the Coast" },
  ];

  const createdSets = [];
  for (const set of sets) {
    const created = await prisma.cardSet.upsert({
      where: { slug: set.slug },
      update: {},
      create: {
        ...set,
        year: "2024",
        totalCards: Math.floor(Math.random() * 100) + 50,
      },
    });
    createdSets.push(created);
  }
  logger.info({ count: createdSets.length }, "Card sets created");

  // 4. Database cards (100+ karet)
  const cardNames = [
    { name: "Charizard ex", rarity: "Ultra Rare", playerName: "Charizard" },
    { name: "Pikachu ex", rarity: "Ultra Rare", playerName: "Pikachu" },
    { name: "Eevee", rarity: "Common", playerName: "Eevee" },
    { name: "Gengar VMAX", rarity: "Secret Rare", playerName: "Gengar" },
    { name: "Mewtwo V", rarity: "Rare", playerName: "Mewtwo" },
    { name: "Rayquaza V", rarity: "Rare", playerName: "Rayquaza" },
    { name: "Umbreon VMAX", rarity: "Secret Rare", playerName: "Umbreon" },
    { name: "Greninja ex", rarity: "Ultra Rare", playerName: "Greninja" },
    { name: "Lucario V", rarity: "Rare", playerName: "Lucario" },
    { name: "Gardevoir ex", rarity: "Ultra Rare", playerName: "Gardevoir" },
    { name: "Dragonite ex", rarity: "Ultra Rare", playerName: "Dragonite" },
    { name: "Snorlax", rarity: "Uncommon", playerName: "Snorlax" },
    { name: "Mimikyu V", rarity: "Rare", playerName: "Mimikyu" },
    { name: "Lugia V", rarity: "Ultra Rare", playerName: "Lugia" },
    { name: "Arceus VSTAR", rarity: "Secret Rare", playerName: "Arceus" },
  ];

  let totalCards = 0;
  for (const set of createdSets) {
    for (let i = 0; i < cardNames.length; i++) {
      const card = cardNames[i];
      const slug = `${set.slug}-${card.playerName.toLowerCase()}-${i + 1}`;
      await prisma.databaseCard.upsert({
        where: { slug },
        update: {},
        create: {
          setId: set.id,
          name: card.name,
          slug,
          cardNumber: `${i + 1}/${cardNames.length}`,
          playerName: card.playerName,
          rarity: card.rarity,
          type: set.category === "pokemon" ? "Pokémon" : set.category === "magic" ? "Creature" : "Monster",
          priceCardmarketAvg: Math.random() * 5000 + 50,
          priceEbayAvg: Math.random() * 5000 + 50,
          currency: "CZK",
          dataSource: "seed",
          licenseStatus: "own_data",
        },
      });
      totalCards++;
    }
  }
  logger.info({ cards: totalCards }, "Database cards created");

  // 5. Site settings
  const settings = [
    { key: "platform_name", value: "CardPlace.eu", type: "string", group: "general", description: "Název platformy" },
    { key: "support_email", value: "info@cardplace.eu", type: "string", group: "general", description: "Kontaktní email" },
    { key: "max_auction_duration", value: "14", type: "number", group: "general", description: "Maximální délka aukce (dny)" },
    { key: "min_auction_price", value: "10", type: "number", group: "fees", description: "Minimální vyvolávací cena" },
    { key: "fee_percent", value: "5", type: "number", group: "fees", description: "Provize platformy (%)" },
    { key: "currency_eur_to_czk", value: "25.30", type: "number", group: "currency", description: "Směnný kurz EUR → CZK" },
    { key: "currency_usd_to_czk", value: "23.20", type: "number", group: "currency", description: "Směnný kurz USD → CZK" },
    { key: "currency_gbp_to_czk", value: "29.50", type: "number", group: "currency", description: "Směnný kurz GBP → CZK" },
  ];

  for (const s of settings) {
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }
  logger.info({ count: settings.length }, "Site settings created");

  // 6. Legal documents
  const docs = [
    { slug: "terms", title: "Obchodní podmínky", content: "<h1>Obchodní podmínky</h1><p>Tyto obchodní podmínky upravují...</p>", locale: "cs", published: true, publishedAt: new Date() },
    { slug: "privacy", title: "Ochrana osobních údajů", content: "<h1>GDPR</h1><p>Zásady zpracování osobních údajů...</p>", locale: "cs", published: true, publishedAt: new Date() },
    { slug: "cookies", title: "Cookies", content: "<h1>Cookie policy</h1><p>Tento web používá...</p>", locale: "cs", published: true, publishedAt: new Date() },
  ];

  for (const d of docs) {
    await prisma.legalDocument.upsert({
      where: { slug: d.slug },
      update: {},
      create: d,
    });
  }
  logger.info({ count: docs.length }, "Legal documents created");

  // 7. Test auctions (25 aukcí)
  const conditions = ["NM", "LP", "MP", "HP", "DMG"];
  const auctionTitles = [
    "Charizard ex — Scarlet & Violet",
    "Pikachu ex — Paldean Fates",
    "Gengar VMAX — Temporal Forces",
    "Vzácné Rainbow Rare Eevee",
    "Mewtwo V — platinová edice",
    "Rayquaza V — Secret Rare",
    "Umbreon VMAX — Alt Art",
    "Greninja ex — Ultra Rare",
    "Lucario V — Full Art",
    "Gardevoir ex — Special Art",
    "Dragonite ex — Illustration Rare",
    "Snorlax — Vintage",
    "Mimikyu V — Secret Rare",
    "Lugia V — Rainbow Rare",
    "Arceus VSTAR — Gold Secret",
    "Black Lotus — Alpha (Proxy)",
    "Mox Sapphire — Beta (Proxy)",
    "Dark Magician — 1st Edition",
    "Blue-Eyes White Dragon — LOB-001",
    "Exodia the Forbidden One — 1st Ed",
    "Charizard Base Set — Holo (Reprint)",
    "Blastoise Base Set — Holo",
    "Venusaur Base Set — Holo",
    "Pikachu Illustrator — Proxy",
    "One Ring — Serialized (Proxy)",
  ];

  const statuses = ["ACTIVE", "ACTIVE", "ACTIVE", "ACTIVE", "ACTIVE", "ACTIVE", "ACTIVE", "ENDED", "ENDED", "COMPLETED"];
  const createdAuctions = [];

  for (let i = 0; i < auctionTitles.length; i++) {
    const user = users[i % users.length];
    const status = statuses[i % statuses.length];
    const endTime = status === "ACTIVE"
      ? new Date(Date.now() + (Math.floor(Math.random() * 7) + 1) * 24 * 60 * 60 * 1000)
      : new Date(Date.now() - Math.floor(Math.random() * 3) * 24 * 60 * 60 * 1000);
    const startingPrice = 50 + Math.floor(Math.random() * 500);
    const currentPrice = status === "ENDED" || status === "COMPLETED"
      ? startingPrice + Math.floor(Math.random() * 2000)
      : startingPrice + Math.floor(Math.random() * 200);

    const auction = await prisma.auction.create({
      data: {
        title: auctionTitles[i],
        description: `Testovací aukce #${i + 1}. ${cardNames[i % cardNames.length].name} — ${cardNames[i % cardNames.length].rarity}. Stav: ${conditions[i % conditions.length]}`,
        condition: conditions[i % conditions.length],
        startingPrice,
        currentPrice,
        minIncrement: Math.max(1, Math.floor(currentPrice * 0.05)),
        endTime,
        status: status === "COMPLETED" ? "ENDED" : status,
        featured: i < 5,
        userId: user.id,
      },
    });
    createdAuctions.push(auction);

    // Přidat bids na aktivní aukce
    if (status === "ACTIVE" && i > 0) {
      const numBids = Math.floor(Math.random() * 5) + 1;
      for (let b = 0; b < numBids; b++) {
        const bidder = users[(i + b + 1) % users.length];
        const bidAmount = startingPrice + (b + 1) * Math.floor(Math.random() * 50 + 10);
        await prisma.bid.create({
          data: {
            amount: bidAmount,
            userId: bidder.id,
            auctionId: auction.id,
            createdAt: new Date(Date.now() - (numBids - b) * 60 * 60 * 1000),
          },
        });
      }
    }

    // Přidat watchlisty
    const numWatchers = Math.floor(Math.random() * 4);
    for (let w = 0; w < numWatchers; w++) {
      const watcher = users[(i + w + 3) % users.length];
      await prisma.watchlist.create({
        data: {
          userId: watcher.id,
          auctionId: auction.id,
        },
      }).catch(() => {}); // Ignore duplicates
    }
  }
  logger.info({ count: auctionTitles.length }, "Test auctions created");

  // 8. Dokončené transakce (pro COMPLETED aukce)
  for (const auction of createdAuctions.filter((_, i) => statuses[i % statuses.length] === "COMPLETED")) {
    const bids = await prisma.bid.findMany({
      where: { auctionId: auction.id },
      orderBy: { amount: "desc" },
      take: 1,
    });
    if (bids.length > 0) {
      await prisma.transaction.create({
        data: {
          amount: bids[0].amount,
          fee: bids[0].amount * 0.05,
          feePercent: 5,
          netAmount: bids[0].amount * 0.95,
          status: "COMPLETED",
          auctionId: auction.id,
          buyerId: bids[0].userId,
          sellerId: auction.userId,
        },
      });
    }
  }
  logger.info("Completed transactions created");

  // 9. Recenze
  const completedTransactions = await prisma.transaction.findMany({ where: { status: "COMPLETED" } });
  for (const tx of completedTransactions) {
    await prisma.review.create({
      data: {
        rating: Math.floor(Math.random() * 2) + 4, // 4-5
        comment: "Skvělý obchod, rychlé jednání!",
        transactionId: tx.id,
        reviewerId: tx.buyerId,
        reviewedId: tx.sellerId,
      },
    }).catch(() => {});
  }
  logger.info("Reviews created");

  logger.info("✅ Seed complete!");
}

seed()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
