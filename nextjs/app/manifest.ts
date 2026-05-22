import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CardPortal.eu — Aukce sběratelských karet",
    short_name: "CardPortal",
    description: "Největší česká platforma pro aukce sběratelských karet. Pokémon, MTG, Yu-Gi-Oh! a sportovní karty.",
    start_url: "/",
    display: "standalone",
    background_color: "#050A12",
    theme_color: "#00C8FF",
    orientation: "portrait-primary",
    categories: ["shopping", "finance", "games"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: "Skenovat kartu",
        url: "/scan",
        description: "AI identifikace karty z fotky",
      },
      {
        name: "Aukce",
        url: "/auctions",
        description: "Procházet aktivní aukce",
      },
    ],
  };
}
