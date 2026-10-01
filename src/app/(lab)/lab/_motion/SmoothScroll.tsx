"use client";

import Lenis from "lenis";
import { useRef } from "react";

import { gsap, MEDIA, ScrollTrigger, useGSAP } from "./gsap";

/* Lenis driven by the GSAP ticker so smooth scroll and every ScrollTrigger
   advance in the same frame (pattern from the GSAP MCP server). Reduced
   motion keeps native scrolling. */
export default function SmoothScroll({ lerp = 0.1 }: { lerp?: number }) {
  const root = useRef<HTMLSpanElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MEDIA.full, () => {
        const lenis = new Lenis({ lerp, wheelMultiplier: 1 });
        lenis.on("scroll", ScrollTrigger.update);
        const raf = (time: number) => lenis.raf(time * 1000);
        gsap.ticker.add(raf);
        gsap.ticker.lagSmoothing(0);
        (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
        return () => {
          gsap.ticker.remove(raf);
          lenis.destroy();
          gsap.ticker.lagSmoothing(500, 33);
          delete (window as unknown as { __lenis?: Lenis }).__lenis;
        };
      });
      return () => mm.revert();
    },
    { scope: root },
  );
  return <span ref={root} hidden />;
}
