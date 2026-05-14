import bcrypt from "bcryptjs";
import prisma from "./utils/prisma";

async function seed() {
  // Clean up existing seed data first to avoid duplicates
  await prisma.bid.deleteMany({ where: { auction: { user: { email: "demo@cardmarket.com" } } } });
  await prisma.notification.deleteMany({ where: { user: { email: "demo@cardmarket.com" } } });
  await prisma.watchlist.deleteMany({ where: { auction: { user: { email: "demo@cardmarket.com" } } } });
  await prisma.transaction.deleteMany({ where: { seller: { email: "demo@cardmarket.com" } } });
  await prisma.auction.deleteMany({ where: { user: { email: "demo@cardmarket.com" } } });

  const password = await bcrypt.hash("demo123", 10);
  const user = await prisma.user.upsert({
    where: { email: "demo@cardmarket.com" },
    update: {},
    create: {
      email: "demo@cardmarket.com",
      username: "demo",
      password,
      role: "SELLER",
      trustScore: 85,
      verified: true,
    },
  });

  const cards = [
    { id: "A1-001", name: "Charizard", setName: "Genetic Apex", setCode: "A1", rarity: "☆☆☆☆" },
    { id: "A1-002", name: "Mewtwo", setName: "Genetic Apex", setCode: "A1", rarity: "☆☆☆☆" },
    { id: "A1-003", name: "Pikachu", setName: "Genetic Apex", setCode: "A1", rarity: "☆☆☆" },
    { id: "A2-001", name: "Darkrai", setName: "Space-Time Smackdown", setCode: "A2", rarity: "☆☆☆" },
    { id: "A1a-001", name: "Mew", setName: "Mythical Island", setCode: "A1a", rarity: "☆☆☆☆" },
  ];

  for (const card of cards) {
    await prisma.card.upsert({
      where: { id: card.id },
      update: { name: card.name, setName: card.setName, rarity: card.rarity },
      create: card,
    });
  }

  const now = new Date();
  for (let i = 0; i < 3; i++) {
    await prisma.auction.create({
      data: {
        title: `Testovací aukce ${i + 1}`,
        description: `Popis testovací aukce ${i + 1}`,
        startingPrice: 10 + i * 5,
        currentPrice: 10 + i * 5,
        endTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        userId: user.id,
        cardId: cards[i].id,
        featured: i === 0,
        minIncrement: 1,
      },
    });
  }

  console.log("Seed complete");
}

seed().catch(console.error);
