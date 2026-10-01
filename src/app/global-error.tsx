"use client";

import { useEffect } from "react";

import { isStaleScript, reloadOnce } from "@/lib/stale";

/**
 * The last resort: what shows if the root layout itself cannot render.
 * It replaces the whole document, so it carries its own <html>, <body> and
 * styles -- the site's stylesheet is not loaded here. A plain page with one
 * button, in the site's colours. See app/error.tsx for the usual one.
 */
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
    if (isStaleScript(error)) reloadOnce();
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100svh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
          padding: 24,
          textAlign: "center",
          background: "#011f7b",
          color: "#f8f1e4",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "clamp(28px, 7vw, 48px)", lineHeight: 1.1 }}>Zia Goods</h1>
        <p style={{ margin: 0, maxWidth: "36ch", opacity: 0.85, lineHeight: 1.6 }}>The page didn{"’"}t load. Try again in a moment.</p>
        <button
          type="button"
          onClick={() => retry()}
          style={{ padding: "12px 24px", border: 0, borderRadius: 999, background: "#e8a33d", color: "#0b1433", font: "inherit", fontWeight: 700, cursor: "pointer" }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
