"use client";

import { gsap } from "gsap";
import { useEffect, useRef } from "react";

import { CTA_OIL, prefersReducedMotion } from "@/lib/motion";

/**
 * The oil inside the hero's primary button. CSS raises it on hover (see
 * .cta-oil); this shapes its surface, which leans and swells toward the
 * pointer as if drawn to it, with a small ripple running across. The
 * pointer's position is eased, so the surface follows the hand rather
 * than snapping to it. Runs only while the button is hovered or the oil
 * is still settling.
 */

const W = 240; // the wave's own units across
const H = 14;
const REST = 9; // the surface's height from the top, at rest
const POINTS = 40;

export default function CtaOil() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = ref.current;
    const button = root?.closest<HTMLElement>("a, button");
    const path = root?.querySelector("path");
    if (!root || !button || !path) return;

    let target = 0.5; // pointer across the button, 0-1
    let x = 0.5;
    let pull = 0; // how hard the surface reaches for it
    let pullTarget = 0;
    let time = 0;

    const draw = () => {
      let d = "";
      for (let i = 0; i <= POINTS; i++) {
        const u = i / POINTS;
        const g = (u - x) / CTA_OIL.reach;
        const y =
          REST -
          pull * CTA_OIL.swell * Math.exp(-g * g) -
          pull * CTA_OIL.lean * (0.5 - Math.abs(u - x)) +
          CTA_OIL.ripple * Math.sin(u * Math.PI * 2 * 3 - time * CTA_OIL.rippleSpeed);
        d += `${i ? "L" : "M"}${(u * W).toFixed(1)} ${y.toFixed(2)} `;
      }
      path.setAttribute("d", `${d}L${W} ${H} L0 ${H}Z`);
    };
    draw();
    if (prefersReducedMotion()) return;

    let last = -1;
    const tick = (t: number) => {
      const dt = last < 0 ? 1 / 60 : Math.min(0.05, t - last);
      last = t;
      time += dt;
      const k = 1 - Math.exp(-dt * CTA_OIL.follow);
      x += (target - x) * k;
      pull += (pullTarget - pull) * k;
      draw();
      /* Settled and let go: stop until the next hover. */
      if (pullTarget === 0 && pull < 0.01) {
        gsap.ticker.remove(tick);
        last = -1;
      }
    };

    const onMove = (e: PointerEvent) => {
      const r = button.getBoundingClientRect();
      target = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    };
    const onEnter = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      onMove(e);
      pullTarget = 1;
      gsap.ticker.remove(tick);
      gsap.ticker.add(tick);
    };
    const onLeave = () => {
      pullTarget = 0;
    };
    button.addEventListener("pointerenter", onEnter);
    button.addEventListener("pointermove", onMove);
    button.addEventListener("pointerleave", onLeave);
    return () => {
      button.removeEventListener("pointerenter", onEnter);
      button.removeEventListener("pointermove", onMove);
      button.removeEventListener("pointerleave", onLeave);
      gsap.ticker.remove(tick);
    };
  }, []);

  return (
    <span className="cta-oil" aria-hidden="true" ref={ref}>
      <span className="cta-oil-body">
        <svg className="cta-oil-wave" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          <path />
        </svg>
      </span>
    </span>
  );
}
