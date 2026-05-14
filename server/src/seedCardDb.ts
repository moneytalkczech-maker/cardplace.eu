import prisma from "./utils/prisma";

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function seed() {
  console.log("Seeding card database...");

  // === POKÉMON EDICE ===
  const pokemonSet1 = await prisma.cardSet.upsert({
    where: { slug: "genetic-apex" },
    update: {},
    create: {
      name: "Genetic Apex",
      slug: "genetic-apex",
      category: "pokemon",
      brand: "Pokémon / Creatures Inc.",
      year: "2024",
      imageUrl: "/images/sets/genetic-apex.png",
      description: "Základní edice Pokémon TCG Pocket. Obsahuje 286 karet včetně ex karet a ilustračních vzácností.",
      totalCards: 286,
    },
  });

  const pokemonSet2 = await prisma.cardSet.upsert({
    where: { slug: "mythical-island" },
    update: {},
    create: {
      name: "Mythical Island",
      slug: "mythical-island",
      category: "pokemon",
      brand: "Pokémon / Creatures Inc.",
      year: "2024",
      imageUrl: "/images/sets/mythical-island.png",
      description: "Druhá edice Pokémon TCG Pocket. Nové Mew ex karty a rozšíření Genetic Apex.",
      totalCards: 86,
    },
  });

  // === FOTBALOVÉ EDICE ===
  const fotbalSet1 = await prisma.cardSet.upsert({
    where: { slug: "topps-chrome-uefa-2023-24" },
    update: {},
    create: {
      name: "2023-24 Topps Chrome UEFA",
      slug: "topps-chrome-uefa-2023-24",
      category: "sports",
      brand: "Topps",
      year: "2024",
      imageUrl: "/images/sets/topps-chrome-uefa.png",
      description: "Luxusní edice Champions League s chromovým zpracováním. Obsahuje hvězdy jako Mbappé, Haaland a Bellingham.",
      totalCards: 200,
    },
  });

  const fotbalSet2 = await prisma.cardSet.upsert({
    where: { slug: "panini-prizm-world-cup-2022" },
    update: {},
    create: {
      name: "2022 Panini Prizm World Cup",
      slug: "panini-prizm-world-cup-2022",
      category: "sports",
      brand: "Panini",
      year: "2022",
      imageUrl: "/images/sets/panini-prizm-wc-2022.png",
      description: "Oficiální edice Mistrovství světa 2022 v Kataru včetně Messiho a Mbappého.",
      totalCards: 150,
    },
  });

  // === HOKEJOVÁ EDICE ===
  const hokejSet1 = await prisma.cardSet.upsert({
    where: { slug: "upper-deck-series-1-2023-24" },
    update: {},
    create: {
      name: "2023-24 Upper Deck Series 1",
      slug: "upper-deck-series-1-2023-24",
      category: "sports",
      brand: "Upper Deck",
      year: "2023",
      imageUrl: "/images/sets/upper-deck-2023-24.png",
      description: "Základní edice NHL karet od Upper Deck. Rookies, Young Guns a hvězdy jako McDavid a Pastrňák.",
      totalCards: 250,
    },
  });

  // === KARTY ===
  console.log("Adding cards...");

  // Pokémon – Genetic Apex
  const pokemonCards = [
    { name: "Charizard ex", cardNumber: "A1-001", rarity: "⭐⭐⭐⭐", imageUrl: "" },
    { name: "Mewtwo ex", cardNumber: "A1-002", rarity: "⭐⭐⭐⭐", imageUrl: "" },
    { name: "Pikachu ex", cardNumber: "A1-003", rarity: "⭐⭐⭐", imageUrl: "" },
    { name: "Arcanine ex", cardNumber: "A1-004", rarity: "⭐⭐⭐", imageUrl: "" },
    { name: "Starmie ex", cardNumber: "A1-005", rarity: "⭐⭐⭐", imageUrl: "" },
  ];

  for (const c of pokemonCards) {
    await prisma.databaseCard.upsert({
      where: { slug: slugify(`${c.cardNumber}-${c.name}`) },
      update: {},
      create: {
        setId: pokemonSet1.id, name: c.name, slug: slugify(`${c.cardNumber}-${c.name}`),
        cardNumber: c.cardNumber, rarity: c.rarity, imageUrl: c.imageUrl,
        playerName: c.name,
      },
    });
  }

  // Fotbal – Topps Chrome UEFA
  const fotbalCards = [
    { name: "Kylian Mbappé", cardNumber: "TC-1", rarity: "⭐⭐⭐⭐", playerName: "Kylian Mbappé", team: "Paris Saint-Germain / France" },
    { name: "Erling Haaland", cardNumber: "TC-2", rarity: "⭐⭐⭐", playerName: "Erling Haaland", team: "Manchester City / Norway" },
    { name: "Jude Bellingham", cardNumber: "TC-3", rarity: "⭐⭐⭐", playerName: "Jude Bellingham", team: "Real Madrid / England" },
    { name: "Vinícius Jr", cardNumber: "TC-4", rarity: "⭐⭐⭐", playerName: "Vinícius Júnior", team: "Real Madrid / Brazil" },
    { name: "Harry Kane", cardNumber: "TC-5", rarity: "⭐⭐⭐", playerName: "Harry Kane", team: "Bayern Munich / England" },
  ];

  for (const c of fotbalCards) {
    await prisma.databaseCard.upsert({
      where: { slug: slugify(`${c.cardNumber}-${c.name}`) },
      update: {},
      create: {
        setId: fotbalSet1.id, name: c.name, slug: slugify(`${c.cardNumber}-${c.name}`),
        cardNumber: c.cardNumber, rarity: c.rarity, playerName: c.playerName,
        team: c.team, type: "Base",
      },
    });
  }

  // Hokej – Upper Deck
  const hokejCards = [
    { name: "Connor McDavid", cardNumber: "UD-1", rarity: "⭐⭐⭐⭐", playerName: "Connor McDavid", team: "Edmonton Oilers" },
    { name: "David Pastrňák", cardNumber: "UD-2", rarity: "⭐⭐⭐", playerName: "David Pastrňák", team: "Boston Bruins" },
    { name: "Auston Matthews", cardNumber: "UD-3", rarity: "⭐⭐⭐", playerName: "Auston Matthews", team: "Toronto Maple Leafs" },
    { name: "Nathan MacKinnon", cardNumber: "UD-4", rarity: "⭐⭐⭐", playerName: "Nathan MacKinnon", team: "Colorado Avalanche" },
    { name: "Connor Bedard", cardNumber: "UD-5", rarity: "⭐⭐⭐⭐", playerName: "Connor Bedard", team: "Chicago Blackhawks" },
  ];

  for (const c of hokejCards) {
    await prisma.databaseCard.upsert({
      where: { slug: slugify(`${c.cardNumber}-${c.name}`) },
      update: {},
      create: {
        setId: hokejSet1.id, name: c.name, slug: slugify(`${c.cardNumber}-${c.name}`),
        cardNumber: c.cardNumber, rarity: c.rarity, playerName: c.playerName,
        team: c.team, type: "Young Guns",
      },
    });
  }

  console.log("Card database seeded successfully!");
}

seed().catch(console.error);
