"use client";

import { useEffect } from "react";

/* Direction B's one moment: the drive. Scroll position slides the dashed
   lane line along the floor of the page (--drive), and each sign panel
   comes in from the top edge as it is passed under. Reduced motion shows
   everything in place and leaves the lane line still. */
export default function Motion() {
  useEffect(() => {
    const root = document.documentElement;
    const panels = Array.from(document.querySelectorAll<HTMLElement>(".b-panel"));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      panels.forEach((p) => p.classList.add("b-in"));
      root.dataset.ready = "1";
      return;
    }
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => root.style.setProperty("--drive", `${window.scrollY}`));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("b-in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.15 },
    );
    panels.forEach((p) => io.observe(p));
    const t = window.setTimeout(() => (root.dataset.ready = "1"), 1400);
    return () => {
      window.clearTimeout(t);
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
      root.style.removeProperty("--drive");
      delete root.dataset.ready;
    };
  }, []);
  return null;
}
