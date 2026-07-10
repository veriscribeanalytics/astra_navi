import { ImageResponse } from "next/og";

// Apple touch icon (180x180) generated at the edge so we don't need a static
// PNG in /public. Next.js auto-detects this file convention and injects the
// <link rel="apple-touch-icon"> tag.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a1a",
          backgroundImage:
            "radial-gradient(ellipse at 50% 30%, rgba(139,92,246,0.25) 0%, transparent 70%)",
          borderRadius: 40,
        }}
      >
        <span
          style={{
            fontSize: 120,
            fontWeight: 800,
            color: "#c4b5fd",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          ✦
        </span>
      </div>
    ),
    { ...size }
  );
}
