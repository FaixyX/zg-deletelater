"use client";

import Link from "next/link";
import { useEffect } from "react";

import { isStaleScript, reloadOnce } from "@/lib/stale";

/**
 * What a visitor sees if a page on the site throws while rendering (the
 * animated parts of the site are fenced off individually and never get
 * here: see components/Safe.tsx). It is the site's own, in its own colours,
 * with a way forward: try again, or go home.
 *
 * The one failure that is not a bug in the page: a script file the page
 * asks for that no longer exists, because a new version was deployed while
 * the tab was open. Loading the page afresh fixes it, so that is done
 * once, automatically, before anyone sees this (lib/stale.ts).
 */
export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const stale = isStaleScript(error);

  useEffect(() => {
    console.error(error);
    if (stale) reloadOnce();
  }, [error, stale]);

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
        {stale ? "A new version is ready" : "Something broke down"}
      </p>
      <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "clamp(32px, 7vw, 56px)", lineHeight: 1.05, fontWeight: 700 }}>
        {stale ? "Reloading the page." : "This page didn’t load."}
      </h1>
      <p style={{ margin: 0, maxWidth: "36ch", opacity: 0.8, lineHeight: 1.6 }}>
        {stale
          ? "We’ve just updated the site. One moment."
          : "Try again, or start from the front of the site. If it keeps happening, tell us and we’ll look into it."}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
        <button
          type="button"
          onClick={() => retry()}
          style={{ padding: "12px 24px", border: 0, borderRadius: 999, background: "var(--color-amber)", color: "var(--color-navy-deep)", fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
        >
          Try again
        </button>
        <Link
          href="/"
          style={{ padding: "12px 24px", border: "1px solid rgba(216, 227, 255, 0.35)", borderRadius: 999, color: "var(--color-cream)", fontFamily: "var(--font-mono)", fontSize: 14, textDecoration: "none" }}
        >
          Go to the front page
        </Link>
      </div>
    </main>
  );
}
