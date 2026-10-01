"use client";

import { useEffect } from "react";

import { BOOTS_KEY, SETTLED_AFTER } from "@/lib/lite";
import { clearReloadFlag } from "@/lib/stale";

/**
 * Says the page's script is running: it marks the document once the app
 * has hydrated. The watchdog in app/layout.tsx waits for this mark, and
 * if it has not come within a few seconds -- a script chunk lost on a bad
 * connection, a browser that will not run it -- lifts the preloaders and
 * shows the page as the server sent it (see lib/rescue.ts).
 *
 * If the script was only slow and arrives after the watchdog has fired,
 * this takes that rescue back off and the page carries on as designed.
 *
 * And once the page has stayed up for a while it is not crashing: the
 * count of starts the watchdog keeps is cleared (see lib/lite.ts), and the
 * one-reload allowance for a stale script is given back (lib/stale.ts).
 */
export default function Alive() {
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-alive", "");
    /* Only the watchdog's own rescue: one set by a component that threw
       stands. */
    if (root.getAttribute("data-rescue") === "timeout") root.removeAttribute("data-rescue");

    const settled = window.setTimeout(() => {
      try {
        window.localStorage.removeItem(BOOTS_KEY);
      } catch {
        /* Storage blocked: there was no count to clear. */
      }
      clearReloadFlag();
    }, SETTLED_AFTER);
    return () => window.clearTimeout(settled);
  }, []);
  return null;
}
