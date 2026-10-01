"use client";

import { gsap } from "gsap";
import { useRef } from "react";

import { DUR, EASE, LIFT_Y, STAGGER, START, useIdleGSAP, withMotion } from "@/lib/motion";

import CargoCoverflow from "./CargoCoverflow";
import Pour from "./Pour";
import { Safe } from "./Safe";
import ServicesIntro from "./ServicesIntro";

/**
 * Services ahead, then contract carriage -- one tank.
 *
 * The deck is layout: a sticky stage that holds for the whole deck, a
 * spacer that gives the pour its length of scroll, and the contract
 * carriage section after it. The stage is the tank (Pour): it fills as
 * the page holds, deepening to navy, and stays pinned behind everything
 * that follows, so the section has no ground of its own -- it rises
 * through the liquid, with the bubbles still climbing behind the cards.
 *
 *   deck ── stage (sticky, 100svh): the pour
 *        ├─ spacer: the pour's stretch of scroll
 *        └─ #contract-carriage: transparent, over the deep
 *             ├─ intro
 *             └─ #services: the cargo cover flow (CargoCoverflow)
 */
export default function Services() {
  const deck = useRef<HTMLDivElement>(null);

  useIdleGSAP(
    () => {
      const root = deck.current;
      if (!root) return;
      const card = root.querySelector<HTMLElement>(".svc-card");
      const intro = gsap.utils.toArray<HTMLElement>(root.querySelectorAll(".svc-rise"));

      withMotion(
        () =>
          gsap.from(intro, {
            opacity: 0,
            y: LIFT_Y,
            duration: DUR.settle,
            ease: EASE.lift,
            stagger: STAGGER,
            scrollTrigger: { trigger: card, start: START },
          }),
        /* Reduced motion: the stylesheet lays the deck out flat -- no
           hold, the tank a still picture above the section. */
        () => {}
      );
    },
    deck
  );

  return (
    <div className="svc-deck" ref={deck} id="services-ahead">
      <div className="svc-stage">
        <Safe name="pour">
          <Pour />
        </Safe>
      </div>

      <div className="svc-spacer" aria-hidden="true" />

      <section className="svc-card" id="contract-carriage" data-ground="dark" aria-labelledby="cc-title">
        <ServicesIntro />

        <div className="svc-flow" id="services">
          <Safe name="cargo cover flow">
            <CargoCoverflow />
          </Safe>
        </div>
      </section>
    </div>
  );
}
