import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found — Zia Goods",
  robots: { index: false },
};

/**
 * A link that goes nowhere. In the site's own layout, so the nav and the
 * footer are there, with a way back to the pages that exist.
 */
export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100svh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        padding: "96px 24px 48px",
        textAlign: "center",
        background: "var(--color-navy)",
        color: "var(--color-cream)",
      }}
    >
      <p style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-amber)" }}>
        404 · Wrong turn
      </p>
      <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "clamp(32px, 7vw, 56px)", lineHeight: 1.05, fontWeight: 700 }}>
        That road doesn{"’"}t go anywhere.
      </h1>
      <p style={{ margin: 0, maxWidth: "36ch", opacity: 0.8, lineHeight: 1.6 }}>
        The page you asked for isn{"’"}t here. These are.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
        <Link
          href="/"
          style={{ padding: "12px 24px", borderRadius: 999, background: "var(--color-amber)", color: "var(--color-navy-deep)", fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 700, textDecoration: "none" }}
        >
          Front page
        </Link>
        <Link
          href="/services"
          style={{ padding: "12px 24px", border: "1px solid rgba(216, 227, 255, 0.35)", borderRadius: 999, color: "var(--color-cream)", fontFamily: "var(--font-mono)", fontSize: 14, textDecoration: "none" }}
        >
          Services
        </Link>
        <Link
          href="/contact"
          style={{ padding: "12px 24px", border: "1px solid rgba(216, 227, 255, 0.35)", borderRadius: 999, color: "var(--color-cream)", fontFamily: "var(--font-mono)", fontSize: 14, textDecoration: "none" }}
        >
          Request capacity
        </Link>
      </div>
    </main>
  );
}
