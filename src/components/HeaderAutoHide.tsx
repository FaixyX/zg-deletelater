"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { AUTOHIDE } from "@/lib/motion";

/**
 * The nav and the logo step out of the way while the page is being read
 * down, and come back the moment the reader heads up. Renders nothing;
 * it sets data-chrome="hidden" on <html>, and the stylesheet slides both
 * away (see "Header auto-hide" in globals.css). Away from the top it also
 * sets data-docked, and the logo docks into the nav pill so it never sits
 * bare over the content (see "The docked logo").
 *
 * The polish is in when it doesn't fire:
 *  - near the top of the page they always show;
 *  - small movements are ignored: it takes a run of scroll in one
 *    direction to hide them, and less of one to bring them back, so a
 *    trackpad's jitter or a finger resting on the glass never flickers
 *    them;
 *  - while the menu is open, or holds keyboard focus, they stay;
 *  - a mouse moving up to the top edge of the window brings them back,
 *    for anyone reaching for the menu without scrolling;
 *  - every page arrives with them showing.
 *
 * It lives in the root layout, so every page -- and any page added
 * later -- has it without asking.
 */
export default function HeaderAutoHide() {
  const pathname = usePathname();
  const arrive = useRef<() => void>(() => {});

  /* A new page starts with the header in view. */
  useEffect(() => arrive.current(), [pathname]);

  useEffect(() => {
    const root = document.documentElement;
    const nav = document.querySelector<HTMLElement>(".site-nav");
    const header = document.getElementById("site-header");
    let lastY = window.scrollY;
    let run = 0; // px scrolled in the current direction
    let hidden = false;
    let docked = false;
    let frame = 0;

    /* Docked exactly where the auto-hide starts to act, so the logo is
       only ever in its corner at the top of the page, where the header
       has the page's own opening to sit over. */
    const dock = (y: number) => {
      const on = y > AUTOHIDE.top;
      if (on === docked) return;
      docked = on;
      if (on) root.dataset.docked = "";
      else delete root.dataset.docked;
    };

    const set = (hide: boolean) => {
      if (hide === hidden) return;
      hidden = hide;
      if (hide) root.dataset.chrome = "hidden";
      else delete root.dataset.chrome;
    };
    /* Open, or holding keyboard focus -- the menu or the logo's home
       link. Keyboard focus only: a link clicked with the mouse keeps
       focus afterwards, and counting that would leave the header pinned
       for good after the first trip through the menu, on every page. */
    const typing = (box: Element | null) => {
      const a = document.activeElement;
      return !!box && !!a && box.contains(a) && a.matches(":focus-visible");
    };
    const busy = () => (!!nav && "open" in nav.dataset) || typing(nav) || typing(header);

    const measure = () => {
      frame = 0;
      const y = window.scrollY;
      const dy = y - lastY;
      lastY = y;
      dock(y);
      if (y <= AUTOHIDE.top || busy()) {
        run = 0;
        set(false);
        return;
      }
      /* A change of direction starts the run again. */
      run = Math.sign(dy) === Math.sign(run) ? run + dy : dy;
      if (run > AUTOHIDE.hideAfter) set(true);
      else if (run < -AUTOHIDE.showAfter) set(false);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    const onPointer = (e: PointerEvent) => {
      if (hidden && e.pointerType === "mouse" && e.clientY <= AUTOHIDE.reach) {
        run = 0;
        set(false);
      }
    };
    /* Opened or focused while hidden (a keyboard user tabbing in): back. */
    const onFocus = () => {
      if (busy()) set(false);
    };

    arrive.current = () => {
      lastY = window.scrollY;
      run = 0;
      set(false);
      dock(lastY);
    };
    /* A reload can land halfway down the page. */
    dock(lastY);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.addEventListener("focusin", onFocus);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("focusin", onFocus);
      cancelAnimationFrame(frame);
      arrive.current = () => {};
      delete root.dataset.chrome;
      delete root.dataset.docked;
    };
  }, []);

  return null;
}
