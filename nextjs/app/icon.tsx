import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: "linear-gradient(135deg, #050A12 0%, #0B1220 100%)",
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1.5px solid #00C8FF",
        }}
      >
        <div
          style={{
            fontFamily: "sans-serif",
            fontSize: 18,
            fontWeight: 900,
            color: "#00C8FF",
            letterSpacing: -1,
          }}
        >
          C
        </div>
      </div>
    ),
    { ...size }
  );
}
