import { ImageResponse } from "next/og";

export const alt = "AstraMitra — Vedic AI Astrology";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a1a",
          backgroundImage:
            "radial-gradient(ellipse at 50% 50%, rgba(139,92,246,0.15) 0%, transparent 70%)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 32,
          }}
        >
          <span
            style={{
              fontSize: 64,
              fontWeight: 800,
              color: "#ffffff",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            ✦ AstraMitra
          </span>
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#c4b5fd",
            fontFamily: "system-ui, sans-serif",
            textAlign: "center",
            maxWidth: 800,
          }}
        >
          Bridging ancient Vedic wisdom with modern AI precision
        </div>
      </div>
    ),
    { ...size }
  );
}
