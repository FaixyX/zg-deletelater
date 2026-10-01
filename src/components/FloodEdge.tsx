"use client";

import { gsap } from "gsap";
import { useEffect, useId, useRef } from "react";

import { scrollMotion, watchScroll } from "@/lib/liquid";
import { EDGE, prefersReducedMotion } from "@/lib/motion";

/**
 * The flood's leading edge as a liquid surface: the panel that rises
 * over the hero (see .hero-flood) no longer starts with a straight line
 * but with a swell, lit amber along its crest and softly underneath, like
 * the surface of the tank further down the page.
 *
 * Sits on top of the flood, so the browser still moves it with the
 * scroll -- nothing here positions it. Script only shapes the swell:
 * three slow travelling waves, and a slosh pumped by the scroll's
 * acceleration (lib/liquid.ts), the same push that rocks the tank, the
 * cards and the FAQ's lip. Runs only while on screen; reduced motion
 * draws it once, still.
 */

const POINTS = 96;

export default function FloodEdge() {
  const ref = useRef<SVGSVGElement>(null);
  const uid = useId().replace(/[^\w-]/g, "");

  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    const body = svg.querySelector<SVGPathElement>(".flood-edge-body")!;
    const lip = svg.querySelectorAll<SVGPathElement>(".flood-edge-lip");
    const reduced = prefersReducedMotion();

    let W = 1;
    let time = 0;
    let slosh = 0;
    let phase = 0;

    /* Crest height above the flood's top edge, 0 at the bottom of the
       drawing. */
    const crest = (x: number) => {
      const u = (x / W) * Math.PI * 2;
      /* The same swell squeezed into a phone's width reads as choppy, so
         the waves come down with the screen. */
      const k = Math.max(EDGE.narrowScale, Math.min(1, W / EDGE.fullWidth));
      return (
        EDGE.rest +
        k *
          (EDGE.swell * Math.sin(u * 1.3 + time * 0.55 + 0.8) +
            EDGE.swell * 0.45 * Math.sin(u * 3.7 - time * 0.9 - 1.1) +
            EDGE.swell * 0.2 * Math.sin(u * 8.2 + time * 1.6) +
            slosh * Math.sin(u * 1.1 + phase))
      );
    };

    const draw = () => {
      const top = EDGE.height - EDGE.below;
      let d = "";
      for (let i = 0; i <= POINTS; i++) {
        const x = (W * i) / POINTS;
        d += `${i ? "L" : "M"}${x.toFixed(1)} ${(top - crest(x)).toFixed(1)} `;
      }
      body.setAttribute("d", `${d}L${W} ${EDGE.height} L0 ${EDGE.height}Z`);
      lip.forEach((p) => p.setAttribute("d", d));
    };

    const lay = () => {
      W = svg.clientWidth || 1;
      svg.setAttribute("viewBox", `0 0 ${W} ${EDGE.height}`);
      draw();
    };
    const ro = new ResizeObserver(lay);
    ro.observe(svg);
    lay();
    if (reduced) return () => ro.disconnect();

    const stopWatch = watchScroll();
    let last = -1;
    const tick = (t: number) => {
      const dt = last < 0 ? 1 / 60 : Math.min(0.05, t - last);
      last = t;
      time += dt;
      /* The push swings the surface; the swing travels and dies away. */
      slosh = Math.min(
        EDGE.sloshMax,
        slosh * Math.exp(-dt / EDGE.sloshDecay) + Math.abs(scrollMotion().a) * EDGE.sloshGain * dt
      );
      phase += EDGE.sloshSpeed * dt;
      draw();
    };
    let running = false;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !running) {
        last = -1;
        gsap.ticker.add(tick);
        running = true;
      } else if (!e.isIntersecting && running) {
        gsap.ticker.remove(tick);
        running = false;
      }
    });
    io.observe(svg);
    return () => {
      io.disconnect();
      ro.disconnect();
      stopWatch();
      gsap.ticker.remove(tick);
    };
  }, []);

  return (
    <svg className="flood-edge" ref={ref} aria-hidden="true" preserveAspectRatio="none">
      <defs>
        {/* Light just under the surface, fading into the flood's navy. */}
        <linearGradient
          id={`${uid}-under`}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1={EDGE.height - EDGE.below - EDGE.rest - EDGE.swell}
          x2="0"
          y2={EDGE.height}
        >
          <stop offset="0" stopColor="#ffe7bd" stopOpacity="0.55" />
          <stop offset="0.35" stopColor="#2457ff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#011f7b" />
        </linearGradient>
        <filter id={`${uid}-glow`} x="-5%" y="-100%" width="110%" height="300%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>
      <path className="flood-edge-body" fill={`url(#${uid}-under)`} />
      <path className="flood-edge-lip flood-edge-lip--glow" filter={`url(#${uid}-glow)`} />
      <path className="flood-edge-lip" />
    </svg>
  );
}
