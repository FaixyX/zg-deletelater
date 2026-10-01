import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

/**
 * The preview card a shared link shows -- WhatsApp, LinkedIn, Slack,
 * email. Drawn at build from the hero's own parts: the navy ground, the
 * cream logo, the amber eyebrow and the headline in Space Mono (vendored
 * in app/_og under its OFL licence, since the image renderer can't read
 * next/font's files).
 */

export const alt = "Zia Goods — Never run dry. Never run late. Edible oil tanker transport across Pakistan.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const [bold, regular, logo] = await Promise.all([
    readFile(join(process.cwd(), "src/app/_og/space-mono-700.woff")),
    readFile(join(process.cwd(), "src/app/_og/space-mono-400.woff")),
    readFile(join(process.cwd(), "public/zia-goods-logo.svg"), "utf8"),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          color: "#f8f1e4",
          fontFamily: "Space Mono",
          background:
            "radial-gradient(circle at 78% 40%, #0a3bb8 0%, #011f7b 45%, #0b1433 100%)",
        }}
      >
        <img
          src={`data:image/svg+xml;base64,${Buffer.from(logo).toString("base64")}`}
          width={137}
          height={100}
          alt=""
        />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", fontSize: 24, letterSpacing: 3, color: "#e8a33d" }}>
            <div style={{ width: 48, height: 2, background: "#e8a33d", marginRight: 18, opacity: 0.7 }} />
            Edible oil transport
          </div>
          <div style={{ fontSize: 84, fontWeight: 700, lineHeight: 1, letterSpacing: -3, marginTop: 28 }}>
            Never run dry.
          </div>
          <div style={{ fontSize: 84, fontWeight: 700, lineHeight: 1, letterSpacing: -3 }}>Never run late.</div>
          <div style={{ fontSize: 24, color: "#d8e3ff", marginTop: 30 }}>
            Food-grade oil tankers, Port Qasim to every refinery in Pakistan.
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Space Mono", data: bold, weight: 700, style: "normal" },
        { name: "Space Mono", data: regular, weight: 400, style: "normal" },
      ],
    }
  );
}
