import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: "linear-gradient(135deg, #050A12 0%, #0B1220 100%)",
          borderRadius: 36,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "4px solid #00C8FF",
        }}
      >
        <div
          style={{
            fontFamily: "sans-serif",
            fontSize: 100,
            fontWeight: 900,
            color: "#00C8FF",
            letterSpacing: -4,
          }}
        >
          C
        </div>
      </div>
    ),
    { ...size }
  );
}
