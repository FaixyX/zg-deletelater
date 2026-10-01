"use client";

import { gsap } from "gsap";
import { useEffect, useId, useRef } from "react";

import { scrollMotion, watchScroll } from "@/lib/liquid";
import { LIP, prefersReducedMotion } from "@/lib/motion";

/**
 * Where the tank ends: its navy runs on over the top of the cream FAQ
 * as a lip, slow-waving and sloshed by the scroll like everything else
 * that holds liquid on the page, with drips that stretch, let go of a
 * drop and draw back.
 *
 * Drawn through a goo filter -- blur, then the alpha pulled back to a
 * hard edge -- so a drip and its drop are one body of liquid while they
 * are close and part cleanly as the drop falls away. Runs only while on
 * screen. Reduced motion: the lip and its drips, still, and no drops.
 */

type Drip = { x: number; w: number; max: number; len: number; speed: number };
type Drop = { on: boolean; x: number; y: number; vy: number; r: number };

const EDGE_POINTS = 40;

export default function FaqLip() {
  const ref = useRef<SVGSVGElement>(null);
  const uid = useId().replace(/[^\w-]/g, "");

  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    const edge = svg.querySelector<SVGPathElement>(".faq-lip-edge")!;
    const dripEls = Array.from(svg.querySelectorAll<SVGRectElement>(".faq-lip-drip"));
    const dropEls = Array.from(svg.querySelectorAll<SVGCircleElement>(".faq-lip-drop"));
    const glintEls = Array.from(svg.querySelectorAll<SVGCircleElement>(".faq-lip-glint"));
    const reduced = prefersReducedMotion();

    let W = 1;
    let drips: Drip[] = [];
    const drops: Drop[] = dropEls.map(() => ({ on: false, x: 0, y: 0, vy: 0, r: 0 }));
    let slosh = 0;
    let time = 0;

    /* Drips spread across the width, kept off the far left where the
       FAQ's eyebrow and title start. */
    const lay = () => {
      W = svg.clientWidth || 1;
      svg.setAttribute("viewBox", `0 0 ${W} ${LIP.height}`);
      const n = dripEls.length;
      drips = dripEls.map((_, i) => {
        const r = (k: number) => {
          const s = Math.sin((i + 1) * 12.9898 + k * 78.233) * 43758.5453;
          return s - Math.floor(s);
        };
        return {
          x: W * (0.36 + (0.6 * (i + 0.2 + r(1) * 0.6)) / n),
          w: 11 + r(2) * 12,
          max: LIP.dripMin + r(3) * (LIP.dripMax - LIP.dripMin),
          len: r(4) * LIP.dripMin,
          speed: LIP.growMin + r(5) * (LIP.growMax - LIP.growMin),
        };
      });
      draw();
    };

    const edgeY = (x: number) => {
      const u = (x / W) * Math.PI * 2;
      return (
        LIP.level +
        LIP.wave * Math.sin(u * 2.5 + time * 0.7) +
        LIP.wave * 0.6 * Math.sin(u * 6.3 - time * 1.1) +
        slosh * Math.sin(u * 1.5 + time * 2.2)
      );
    };

    const draw = () => {
      let d = `M-20 -20 L${W + 20} -20`;
      for (let i = EDGE_POINTS; i >= 0; i--) {
        const x = (W * i) / EDGE_POINTS;
        d += ` L${x.toFixed(1)} ${edgeY(x).toFixed(1)}`;
      }
      edge.setAttribute("d", `${d} L-20 ${edgeY(0).toFixed(1)}Z`);
      drips.forEach((dr, i) => {
        const el = dripEls[i];
        const top = edgeY(dr.x) - 14;
        el.setAttribute("x", (dr.x - dr.w / 2).toFixed(1));
        el.setAttribute("y", top.toFixed(1));
        el.setAttribute("width", dr.w.toFixed(1));
        el.setAttribute("height", (dr.len + 14).toFixed(1));
        el.setAttribute("rx", (dr.w / 2).toFixed(1));
      });
      drops.forEach((dp, i) => {
        const el = dropEls[i];
        const g = glintEls[i];
        const fade = dp.on ? Math.max(0, 1 - (dp.y - LIP.level) / LIP.fall) : 0;
        el.setAttribute("cx", dp.x.toFixed(1));
        el.setAttribute("cy", dp.y.toFixed(1));
        el.setAttribute("r", (dp.r * (0.55 + 0.45 * fade)).toFixed(2));
        el.style.opacity = String(fade);
        g.setAttribute("cx", (dp.x - dp.r * 0.3).toFixed(1));
        g.setAttribute("cy", (dp.y - dp.r * 0.35).toFixed(1));
        g.style.opacity = String(fade * 0.9);
      });
    };

    const step = (dt: number) => {
      time += dt;
      /* The scroll's push, decaying: the lip swings with the tank. */
      slosh = Math.min(
        LIP.sloshMax,
        slosh * Math.exp(-dt / LIP.sloshDecay) + Math.abs(scrollMotion().a) * LIP.sloshGain * dt
      );
      drips.forEach((dr, i) => {
        dr.len += dr.speed * dt;
        if (dr.len < dr.max) return;
        /* It lets go: a drop falls, and the drip draws back. */
        const dp = drops[i];
        if (!dp.on) {
          dp.on = true;
          dp.x = dr.x;
          dp.y = edgeY(dr.x) + dr.len - dr.w * 0.2;
          dp.vy = 0;
          dp.r = dr.w * 0.62;
        }
        dr.len = dr.max * LIP.recoil;
      });
      drops.forEach((dp) => {
        if (!dp.on) return;
        dp.vy += LIP.gravity * dt;
        dp.y += dp.vy * dt;
        if (dp.y - LIP.level > LIP.fall) dp.on = false;
      });
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
      step(dt);
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
    <svg className="faq-lip" ref={ref} aria-hidden="true" preserveAspectRatio="none">
      <defs>
        <filter id={`${uid}-goo`} x="-10%" y="-40%" width="120%" height="180%" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation="7" />
          <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -10" />
        </filter>
      </defs>
      <g filter={`url(#${uid}-goo)`} className="faq-lip-body">
        <path className="faq-lip-edge" />
        {Array.from({ length: LIP.drips }, (_, i) => (
          <rect key={i} className="faq-lip-drip" />
        ))}
        {Array.from({ length: LIP.drips }, (_, i) => (
          <circle key={i} className="faq-lip-drop" style={{ opacity: 0 }} />
        ))}
      </g>
      {/* A catch of light on each falling drop. */}
      {Array.from({ length: LIP.drips }, (_, i) => (
        <circle key={i} className="faq-lip-glint" r="1.6" style={{ opacity: 0 }} />
      ))}
    </svg>
  );
}
