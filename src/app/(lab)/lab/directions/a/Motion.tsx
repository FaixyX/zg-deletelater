"use client";

import { useEffect } from "react";

/* Direction A's one moment: the seal presses onto the slip, the ledger rules
   draw. It is all CSS keyframes keyed off html[data-a-go]; this only flips
   that switch once the page has painted, and tells the screenshot script
   when everything has settled. */
export default function Motion() {
  useEffect(() => {
    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      root.dataset.ready = "1";
      return;
    }
    root.dataset.aGo = "1";
    const t = window.setTimeout(() => (root.dataset.ready = "1"), 1600);
    return () => {
      window.clearTimeout(t);
      delete root.dataset.aGo;
      delete root.dataset.ready;
    };
  }, []);
  return null;
}
