/* GSAP for the lab, registered once. Client-only: imported by "use client"
   files, so nothing here runs during the server render. */
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, DrawSVGPlugin, MotionPathPlugin);
}

export { DrawSVGPlugin, gsap, MotionPathPlugin, ScrollTrigger, SplitText, useGSAP };

/* Media conditions every direction branches on. "reduce" gets the finished
   page: no pins, no scrubs, every moment at its end state. */
export const MEDIA = {
  full: "(prefers-reduced-motion: no-preference)",
  reduce: "(prefers-reduced-motion: reduce)",
} as const;

/* Tells the screenshot script the page has settled. */
export const markReady = () => {
  document.documentElement.dataset.ready = "1";
};
