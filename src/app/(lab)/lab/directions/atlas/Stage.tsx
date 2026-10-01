"use client";

import { useRef } from "react";

import { gsap, markReady, MEDIA, ScrollTrigger, SplitText, useGSAP } from "../../_motion/gsap";

type Station = { at: number; x: number; y: number };

const VB = { w: 900, h: 950 };

/* Cobalt Atlas. Renders nothing; drives the page inside .atlas.
   One map, one camera. The hero map is the object that moves:
   - Load: the country's outline draws, the road network fades in, the
     corridors draw, the headline lines rise.
   - Scroll (pinned, ~7 screens, scrubbed): the copy steps aside and the
     camera dives to Port Qasim, follows the real route north to Lahore
     while the line inks in behind it and a chapter card names each stop,
     then pulls back to the whole country for "Nationwide."
   The camera is a transform on one SVG group; strokes are non-scaling so
   the lines stay hairline at any zoom, and the labels are counter-scaled.
   Reduced motion: the finished map, the stops as a list. */
export default function Stage({ stations }: { stations: Station[] }) {
  const anchor = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const root = anchor.current?.closest<HTMLElement>(".atlas");
    if (!root) return;
    const q = gsap.utils.selector(root);
    const mm = gsap.matchMedia();

    mm.add(MEDIA.reduce, () => {
      root.dataset.motion = "reduce";
      markReady();
    });

    mm.add(MEDIA.full, () => {
      root.dataset.motion = "full";
      const svg = q(".n-map")[0] as unknown as SVGSVGElement;
      const camEl = q(".n-cam")[0] as unknown as SVGGElement;
      const route = q(".n-route")[0] as unknown as SVGPathElement;
      const labels = q(".n-st") as unknown as SVGGElement[];
      const readout = q("[data-readout]")[0];
      const len = route.getTotalLength();
      const narrow = () => window.innerWidth < 820;

      /* The visible extent of the viewBox: with "meet" the svg shows more
         than 900x950 on the long axis of the screen. */
      const visible = () => {
        const r = svg.getBoundingClientRect();
        const k = Math.min(r.width / VB.w, r.height / VB.h);
        return { w: r.width / k, h: r.height / k };
      };

      /* Camera state: mix 0 frames the country, mix 1 follows the route at
         progress p. ox/oy shift the framing by a share of the visible area,
         so the subject can sit beside the copy. */
      const cam = { p: 0, mix: 0, s: 0.92, ox: 0.2, oy: 0.02 };
      const centre = { x: 470, y: 520 };
      const apply = () => {
        const pt = route.getPointAtLength(cam.p * len);
        const x = centre.x + (pt.x - centre.x) * cam.mix;
        const y = centre.y + (pt.y - centre.y) * cam.mix;
        const v = visible();
        const tx = VB.w / 2 + cam.ox * v.w - cam.s * x;
        const ty = VB.h / 2 + cam.oy * v.h - cam.s * y;
        camEl.setAttribute("transform", `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${cam.s.toFixed(4)})`);
        /* labels keep their size on screen */
        const inv = 1 / cam.s;
        labels.forEach((g) => {
          const lx = Number(g.dataset.x);
          const ly = Number(g.dataset.y);
          g.setAttribute("transform", `translate(${lx} ${ly}) scale(${inv}) translate(${-lx} ${-ly})`);
        });
      };

      const setHero = () => {
        if (narrow()) Object.assign(cam, { s: 0.98, ox: 0, oy: 0.2 });
        else Object.assign(cam, { s: 0.92, ox: 0.2, oy: 0.02 });
      };
      setHero();
      apply();

      /* Load */
      const split = SplitText.create(q(".n-h1")[0], { type: "lines", mask: "lines" });
      gsap
        .timeline({ defaults: { ease: "power3.out" }, onComplete: markReady })
        .fromTo(q(".n-land"), { drawSVG: "0%" }, { drawSVG: "100%", duration: 2.2, ease: "power2.inOut" }, 0)
        .from(q(".n-ctx path"), { autoAlpha: 0, duration: 1.2, stagger: { each: 0.03, from: "random" } }, 0.6)
        .fromTo(q(".n-cor path"), { drawSVG: "0%" }, { drawSVG: "100%", duration: 1.4, stagger: 0.08, ease: "power2.inOut" }, 1.0)
        .from(split.lines, { yPercent: 105, duration: 1.2, stagger: 0.1, ease: "power4.out" }, 0.35)
        .from(q(".n-copy .n-k, .n-sub, .n-ctas, .n-frame, .n-head"), { autoAlpha: 0, y: 14, duration: 0.9, stagger: 0.06 }, 0.8)
        .from(q(".n-st"), { autoAlpha: 0, duration: 0.6, stagger: 0.08 }, 1.8);

      /* The flight */
      const cards = q(".n-card");
      gsap.set(cards, { autoAlpha: 0, y: 30 });
      gsap.set(q(".n-final"), { autoAlpha: 0 });
      gsap.set(route, { drawSVG: "0%" });

      const FLY = 6;
      const GO = 2.0; // the flight starts after a beat at Port Qasim
      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        onUpdate: apply,
        scrollTrigger: {
          trigger: q(".n-scene")[0],
          start: "top top",
          end: "+=720%",
          pin: q(".n-stage")[0],
          scrub: 1,
          invalidateOnRefresh: true,
          onRefresh: apply,
        },
      });

      tl.to(q(".n-copy"), { autoAlpha: 0, x: -60, duration: 0.6, ease: "power2.in" }, 0)
        .to(cam, { mix: 1, s: () => (narrow() ? 3.4 : 4.2), ox: () => (narrow() ? 0 : 0.16), oy: () => (narrow() ? 0.16 : 0), duration: 1.2 }, 0.2)
        .to(q(".n-ctx"), { opacity: 0.55, duration: 1 }, 0.2)
        .to(cam, { p: 1, s: () => (narrow() ? 2.8 : 3.3), duration: FLY, ease: "none" }, GO)
        .fromTo(route, { drawSVG: "0%" }, { drawSVG: "100%", duration: FLY, ease: "none" }, GO);

      stations.forEach((s, i) => {
        const t = GO + s.at * FLY;
        tl.to(cards[i], { autoAlpha: 1, y: 0, duration: 0.35, ease: "power3.out" }, i === 0 ? 1.1 : t - 0.35);
        tl.call(() => {
          readout.textContent = cards[i].querySelector(".n-card-k")!.textContent!.split("· ")[1] ?? "";
        }, undefined, i === 0 ? 1.2 : t - 0.2);
        if (i < stations.length - 1) {
          const next = GO + stations[i + 1].at * FLY;
          tl.to(cards[i], { autoAlpha: 0, y: -24, duration: 0.3, ease: "power2.in" }, next - 0.6);
        }
      });

      tl.to(cards[cards.length - 1], { autoAlpha: 0, y: -24, duration: 0.3, ease: "power2.in" }, GO + FLY + 0.2)
        .to(cam, { mix: 0, s: () => (narrow() ? 0.92 : 0.95), ox: () => (narrow() ? 0 : 0.16), oy: () => (narrow() ? -0.1 : 0), duration: 1.6 }, GO + FLY + 0.2)
        .to(q(".n-cor path"), { attr: { class: "is-lit" }, duration: 0.01 }, GO + FLY + 0.8)
        .to(q(".n-final"), { autoAlpha: 1, duration: 0.6, ease: "power2.out" }, GO + FLY + 1.2)
        .from(q(".n-final-h, .n-figs > div"), { y: 40, duration: 0.8, stagger: 0.08, ease: "power3.out" }, GO + FLY + 1.2)
        .to({}, { duration: 0.8 });

      const onResize = () => apply();
      window.addEventListener("resize", onResize);
      document.fonts?.ready.then(() => ScrollTrigger.refresh());
      return () => {
        window.removeEventListener("resize", onResize);
        split.revert();
        camEl.removeAttribute("transform");
        labels.forEach((g) => g.removeAttribute("transform"));
      };
    });

    return () => mm.revert();
  });

  return <span ref={anchor} hidden />;
}
