"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { CORRIDOR, DUR, EASE, useIdleGSAP, withMotion } from "@/lib/motion";

/**
 * Renders nothing. Draws the corridor map in as it scrolls into view, then
 * runs a single pulse from Karachi to Multan along the three legs in turn
 * -- only while the map is on screen.
 */
export default function CorridorMapMotion() {
  useIdleGSAP(() => {
    const card = document.getElementById("corridor-map");
    if (!card) return;
    const q = <T extends Element>(sel: string) => gsap.utils.toArray<T>(card.querySelectorAll(sel));

    const rows = q<SVGGElement>("#cm-dots .dot-row");
    const outline = q<SVGPathElement>("#cm-outline path");
    const ctx = q<SVGPathElement>("#cm-ctx path");
    const legLayers = ["#cm-bloom", "#cm-halo", "#cm-cor"].map((sel) => q<SVGPathElement>(`${sel} path`));
    const pulses = q<SVGPathElement>("#cm-pulse path");
    const nodes = q<SVGGElement>("#cm-nodes > g");
    const rings = q<SVGCircleElement>("#cm-nodes .map-ring");
    const legs = card.querySelectorAll<HTMLElement>(".corridor-legs li");

    /* Every stroke arrives hidden behind its own dash, measured at build
       (CorridorMap); the pulses only need theirs cut short. */
    pulses.forEach((p) => {
      p.style.strokeDasharray = `${CORRIDOR.pulseDash} ${p.dataset.len}`;
    });

    const applyFinalState = () => {
      gsap.set([rows, outline, nodes], { opacity: 1 });
      gsap.set([...ctx, ...legLayers.flat()], { strokeDashoffset: 0 });
      gsap.set(legs, { opacity: 1 });
    };

    withMotion(() => {
      gsap.set([rows, outline, nodes, legs], { opacity: 0 });

      /* The pulse: one dash, Karachi to Multan, leg after leg. Each leg's
         share of the loop is its share of the route's length, so the dash
         keeps one speed the whole way. */
      const lens = pulses.map((p) => Number(p.dataset.len));
      const total = lens.reduce((a, b) => a + b, 0);
      const pulse = gsap.timeline({ repeat: -1, paused: true });
      pulses.forEach((p, i) => {
        const len = lens[i];
        const dur = (CORRIDOR.pulseDuration * len) / total;
        /* One dash per period of dash + path length, so exactly one is ever
           in play. Offset `dash` parks it just before the start, `-len`
           just past the end. The legs drawn southward walk it end to
           start instead. */
        const [a, b] = "reverse" in p.dataset ? [-len, CORRIDOR.pulseDash] : [CORRIDOR.pulseDash, -len];
        pulse
          .set(p, { opacity: 0.9, strokeDashoffset: a })
          .to(p, { strokeDashoffset: b, duration: dur, ease: EASE.hold })
          .set(p, { opacity: 0 });
      });
      const ringLoops = rings.map((ring, i) =>
        gsap.to(ring, {
          attr: { r: 14 },
          opacity: 0,
          duration: CORRIDOR.pulseDuration / 2,
          ease: EASE.flow,
          repeat: -1,
          delay: i * 0.8,
          paused: true,
        })
      );
      const loops = [pulse, ...ringLoops];

      let onScreen = false;
      const tl = gsap.timeline({
        paused: true,
        onComplete: () => onScreen && loops.forEach((l) => l.play()),
      });
      tl.to(rows, {
        opacity: 1,
        duration: DUR.lift,
        ease: EASE.lift,
        stagger: (_: number, row: SVGGElement) => Number(row.dataset.i) * CORRIDOR.dotStagger,
      })
        .to(outline, { opacity: 1, duration: CORRIDOR.outlineDuration, ease: EASE.settle }, "-=0.6")
        .to(ctx, { strokeDashoffset: 0, duration: CORRIDOR.contextDuration, ease: EASE.carry }, "-=0.6");
      /* The route, leg by leg from Karachi, all three strokes of a leg
         together. */
      [0, 1, 2].forEach((leg, i) => {
        const strokes = legLayers.map((layer) => layer[leg]);
        tl.to(
          strokes,
          { strokeDashoffset: 0, duration: CORRIDOR.legDuration, ease: i === 2 ? EASE.settle : EASE.hold },
          i === 0 ? "-=0.8" : ">"
        ).to(legs[leg], { opacity: 1, duration: DUR.snap, ease: EASE.settle }, "<");
      });
      tl.to(nodes, { opacity: 1, duration: DUR.settle, ease: EASE.settle, stagger: CORRIDOR.nodeStagger }, "-=1.6");

      ScrollTrigger.create({
        trigger: card,
        start: CORRIDOR.start,
        once: true,
        onEnter: () => tl.play(),
      });
      /* The loops only run while the card is on screen. */
      ScrollTrigger.create({
        trigger: card,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => {
          onScreen = self.isActive;
          if (tl.progress() < 1) return;
          loops.forEach((l) => (onScreen ? l.play() : l.pause()));
        },
      });

      return tl;
    }, applyFinalState);
  });

  return null;
}
