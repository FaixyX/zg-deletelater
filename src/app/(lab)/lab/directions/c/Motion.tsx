"use client";

import { useEffect } from "react";

/* Direction C's one moment: the corridor inks itself north from Port Qasim.
   The drawing is CSS (stroke-dashoffset on each leg, staggered, then each
   station label printing as the line reaches it), switched on by
   html[data-c-go]. Reduced motion never sets it, so the finished map shows. */
export default function Motion() {
  useEffect(() => {
    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      root.dataset.ready = "1";
      return;
    }
    root.dataset.cGo = "1";
    const t = window.setTimeout(() => (root.dataset.ready = "1"), 4200);
    return () => {
      window.clearTimeout(t);
      delete root.dataset.cGo;
      delete root.dataset.ready;
    };
  }, []);
  return null;
}
