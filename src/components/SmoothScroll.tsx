"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useEffect } from "react";

import { SMOOTH, prefersReducedMotion, scrollToY, setLenis } from "@/lib/motion";

/**
 * Smooth scrolling for the whole site (see section 15 of lib/motion.ts).
 * Lenis runs off GSAP's ticker rather than its own loop, and tells
 * ScrollTrigger about every step, so the scrubbed sections and the
 * smoothed scroll move in the same frame.
 *
 * It also takes over links to a place on the page they are on -- "#faq",
 * or "/#faq" from the home page -- and links to the page itself (the
 * footer's "Home" at the bottom of the home page), so they glide there
 * like any other scroll instead of jumping. Links to another page are left
 * to the router, and a link marked data-own-scroll (the nav's) moves the
 * page itself.
 */
export default function SmoothScroll() {
  useEffect(() => {
    /* In the capture phase, ahead of <Link>'s own handler, which would
       otherwise take the click and jump. */
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]");
      if (!(a instanceof HTMLAnchorElement) || a.target || a.hasAttribute("download") || "ownScroll" in a.dataset) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname !== window.location.pathname) return;
      if (!url.hash) {
        /* A link to the page you are on -- the footer's "Home" from the
           bottom of the home page: the router would put the page back at
           its top in one jump. It glides instead, as the footer's
           "Return trip" does. A different query is a different page. */
        if (url.search !== window.location.search) return;
        e.preventDefault();
        scrollToY(0);
        if (window.location.hash) {
          const oldURL = window.location.href;
          history.pushState(null, "", url.pathname + url.search);
          window.dispatchEvent(new HashChangeEvent("hashchange", { oldURL, newURL: window.location.href }));
        }
        return;
      }
      const el = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!el) return;
      e.preventDefault();
      /* Where the browser itself would put it: its top, less any
         scroll-margin the stylesheet gives it to clear the header. */
      const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
      scrollToY(el.getBoundingClientRect().top + window.scrollY - margin);
      if (url.hash !== window.location.hash) {
        const oldURL = window.location.href;
        history.pushState(null, "", url.hash);
        /* pushState is silent; anything listening for the hash (the FAQ
           opens the answer it names) still hears it. */
        window.dispatchEvent(new HashChangeEvent("hashchange", { oldURL, newURL: window.location.href }));
      }
    };
    window.addEventListener("click", onClick, { capture: true });
    const stopClicks = () => window.removeEventListener("click", onClick, { capture: true });

    if (prefersReducedMotion()) return stopClicks;
    const lenis = new Lenis({ lerp: SMOOTH.lerp, wheelMultiplier: SMOOTH.wheelMultiplier });
    setLenis(lenis);
    lenis.on("scroll", ScrollTrigger.update);
    /* A preloader may already be holding the page. */
    if (document.documentElement.classList.contains("scroll-lock")) lenis.stop();
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    /* Lag smoothing would hold the scroll back after a slow frame, and
       the page would visibly catch up. */
    gsap.ticker.lagSmoothing(0);
    return () => {
      stopClicks();
      gsap.ticker.remove(raf);
      lenis.destroy();
      setLenis(null);
    };
  }, []);
  return null;
}
