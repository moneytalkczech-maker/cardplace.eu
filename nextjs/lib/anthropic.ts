import Anthropic from "@anthropic-ai/sdk";

// Server-only — never import in client components
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface CardScanResult {
  detected: boolean;
  cardName?: string;
  setName?: string;
  setCode?: string;
  rarity?: string;
  condition?: "NM" | "LP" | "MP" | "HP" | "DMG";
  game?: "pokemon" | "mtg" | "yugioh" | "sports" | "other";
  confidence?: number;
  language?: string;
  notes?: string;
}

const SYSTEM_PROMPT = `You are an expert trading card identifier specializing in TCG cards (Pokémon, Magic: The Gathering, Yu-Gi-Oh!, sports cards, and other collectible card games).

When shown an image, analyze it carefully and identify any trading card present.

ALWAYS respond with valid JSON only — no markdown, no explanation, just the JSON object.

If a card is detected, return:
{
  "detected": true,
  "cardName": "exact card name",
  "setName": "set/expansion name",
  "setCode": "3-4 letter set code if known",
  "rarity": "Common/Uncommon/Rare/Holo Rare/Ultra Rare/Secret Rare/etc",
  "condition": "NM" | "LP" | "MP" | "HP" | "DMG",
  "game": "pokemon" | "mtg" | "yugioh" | "sports" | "other",
  "confidence": 0-100,
  "language": "en" | "cs" | "de" | "ja" | "other",
  "notes": "any extra info about the card variant, printing, foil type, etc"
}

If no card is detected or the image is unclear:
{ "detected": false, "confidence": 0, "notes": "reason" }

Condition guide:
- NM (Near Mint): No visible wear
- LP (Lightly Played): Minor scratches, very light play wear
- MP (Moderately Played): Noticeable wear but still presentable
- HP (Heavily Played): Significant wear, creases
- DMG (Damaged): Heavy damage, tears, bends`;

export async function scanCardWithClaude(
  imageBase64: string,
  mimeType: string
): Promise<CardScanResult> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: "Identify this trading card. Return JSON only.",
          },
        ],
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text.trim() : "{}";
  // Strip any accidental markdown code fences
  const clean = text.replace(/^```json?\n?/, "").replace(/\n?```$/, "").trim();
  return JSON.parse(clean) as CardScanResult;
}
