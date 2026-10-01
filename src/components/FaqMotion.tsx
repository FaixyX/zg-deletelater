"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { DUR, EASE, LIFT_Y, STAGGER, START, useIdleGSAP, withMotion } from "@/lib/motion";

/**
 * The FAQ's entrance: the head rises in, then the side panel and the
 * rows one after another. Renders nothing; the section is authored in
 * its final state and only ever animates from something to it.
 */
export default function FaqMotion() {
  useIdleGSAP(() => {
    const section = document.getElementById("faq");
    if (!section) return;

    withMotion(() => {
      const head = gsap.from(section.querySelectorAll(".faq-rise"), {
        opacity: 0,
        y: LIFT_Y,
        duration: DUR.settle,
        ease: EASE.lift,
        stagger: STAGGER,
        clearProps: "opacity,transform",
        scrollTrigger: { trigger: section, start: START },
      });

      /* The side panel and rows rise as each comes into view, a few at a
         time, rather than all at once off screen on a long phone page. */
      gsap.set(section.querySelectorAll(".faq-side, .faq-row"), { opacity: 0, y: LIFT_Y });
      const rows = ScrollTrigger.batch(section.querySelectorAll(".faq-side, .faq-row"), {
        start: START,
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            duration: DUR.settle,
            ease: EASE.lift,
            stagger: STAGGER / 2,
            clearProps: "opacity,transform",
          }),
      });

      return [head, ...rows];
    });
  });

  return null;
}
