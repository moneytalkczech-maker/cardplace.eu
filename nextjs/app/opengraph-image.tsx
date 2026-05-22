import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "CardPlace.eu — Aukce sběratelských karet";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "linear-gradient(135deg, #050A12 0%, #0B1220 50%, #050A12 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Neon glow circle */}
        <div
          style={{
            position: "absolute",
            top: -100,
            left: -100,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0,200,255,0.15) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(167,255,0,0.1) 0%, transparent 70%)",
          }}
        />

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <div
            style={{
              width: 72,
              height: 72,
              background: "linear-gradient(135deg, #050A12, #0B1220)",
              borderRadius: 14,
              border: "3px solid #00C8FF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: 40, fontWeight: 900, color: "#00C8FF" }}>C</span>
          </div>
          <span style={{ fontSize: 52, fontWeight: 900, color: "#FFFFFF", letterSpacing: -2 }}>
            CardPlace
            <span style={{ color: "#00C8FF" }}>.eu</span>
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            color: "rgba(255,255,255,0.6)",
            textAlign: "center",
            maxWidth: 700,
            lineHeight: 1.4,
          }}
        >
          Největší česká platforma pro aukce sběratelských karet
        </div>

        {/* Tags */}
        <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
          {["Pokémon", "MTG", "Yu-Gi-Oh!", "Sportovní karty"].map((tag) => (
            <div
              key={tag}
              style={{
                padding: "8px 18px",
                background: "rgba(0,200,255,0.1)",
                border: "1px solid rgba(0,200,255,0.3)",
                borderRadius: 20,
                fontSize: 16,
                color: "#00C8FF",
                fontWeight: 600,
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
