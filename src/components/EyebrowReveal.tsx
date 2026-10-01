"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { onRevealed, prefersReducedMotion } from "@/lib/motion";

/* ms after the preloader hands off before the hero's label draws in:
   with the headline, not before it. */
const HERO_LABEL_WAIT = 450;
/* How far down the screen a label's top must come before it draws: the
   same line the site's entrances fire on (START, "top 80%"), so a label
   that rises in with its section draws as it arrives, not before. */
const REVEAL_LINE = 0.8;

/**
 * The section labels as route markers (see [data-eyebrow] in
 * globals.css): each carries its section's number on a small plate, a
 * dashed route that draws in, and an amber dot that runs along it to the
 * words. This only says when: it marks each label data-in the first time
 * it is well on screen, and the stylesheet plays the rest. Renders
 * nothing. Reduced motion: every label is marked at once and drawn still.
 */
export default function EyebrowReveal() {
  const pathname = usePathname();

  useEffect(() => {
    const labels = Array.from(document.querySelectorAll<HTMLElement>("[data-eyebrow]:not([data-in])"));
    if (prefersReducedMotion()) {
      labels.forEach((l) => (l.dataset.in = ""));
      return;
    }
    /* The hero's label is on screen from the first frame but hidden
       under the preloader, so it waits for the hand-off and the headline
       beginning to rise. */
    const hero = document.getElementById("hero");
    const timers: number[] = [];
    const stops: (() => void)[] = [];
    const mark = (el: HTMLElement) => {
      if (hero && hero.contains(el))
        stops.push(
          onRevealed(hero, () => {
            timers.push(window.setTimeout(() => (el.dataset.in = ""), HERO_LABEL_WAIT));
          })
        );
      else el.dataset.in = "";
    };
    /* A label is drawn once its top has come up past the fold's last
       fifth -- on screen, or already scrolled past. Checked on scroll
       rather than by an observer: an observer reports crossings, and a
       fast fling can carry a label clean past the screen between two
       frames without one. Six elements, measured once a frame. */
    let pending = labels;
    let frame = 0;
    const check = () => {
      frame = 0;
      const line = window.innerHeight * REVEAL_LINE;
      pending = pending.filter((l) => {
        if (l.getBoundingClientRect().top > line) return true;
        mark(l);
        return false;
      });
      if (!pending.length) window.removeEventListener("scroll", onScroll);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    check();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
      stops.forEach((s) => s());
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [pathname]);

  return null;
}
