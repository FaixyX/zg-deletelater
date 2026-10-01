"use client";

import { gsap } from "gsap";

import { NIGHT, prefersReducedMotion, useIdleGSAP } from "@/lib/motion";

/* 0 before a, 1 after b, eased in between. */
const smooth = (a: number, b: number, p: number) => {
  const t = Math.min(1, Math.max(0, (p - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * Drives the night run (NightRun.tsx) from the scroll. Every frame it is
 * given a progress through the scene and places the lot from it: how far
 * down the road the camera is, which lamps and route numbers that puts
 * where, the gantry, the tanker pulling away, the lines and the dawn.
 * Only transforms and opacity are written, so the browser composites the
 * scene without painting it again.
 *
 * The road itself only ever shifts by less than one lamp gap -- its
 * pattern repeats on exactly that -- and the lamps are handed on one
 * place each time it wraps, so the drive never runs out of road.
 *
 * Reduced motion gets one still frame and no hold (see .nr).
 */
export default function NightRunMotion() {
  useIdleGSAP(() => {
    const root = document.getElementById("night-run");
    const view = root?.querySelector<HTMLElement>(".nr-view");
    if (!root || !view) return;
    const $ = <T extends Element = HTMLElement>(s: string) => Array.from(root.querySelectorAll<T & HTMLElement>(s));
    const road = $(".nr-road")[0];
    const gantry = $(".nr-gantry")[0];
    const tanker = $(".nr-tanker")[0];
    const lamps = $(".nr-lamp");
    const paints = $(".nr-paint");
    const night = $(".nr-line--night .nr-w");
    const nightLine = $(".nr-line--night")[0];
    const dawnWords = $(".nr-line--dawn .nr-w");
    const dawn = $(".nr-dawn")[0];
    const dest = $(".nr-dest")[0];

    /* Sizes, read once and on resize: the view's height (V), the road's
       width, and the things placed by their middle. */
    let V = 0;
    let W = 0;
    let lampW = 0;
    let gantryW = 0;
    let tank = { w: 0, h: 0 };
    let paintW: number[] = [];
    const measure = () => {
      V = view.clientHeight;
      W = road.offsetWidth;
      lampW = lamps[0]?.offsetWidth ?? 0;
      gantryW = gantry.offsetWidth;
      tank = { w: tanker.offsetWidth, h: tanker.offsetHeight };
      paintW = paints.map((p) => p.offsetWidth);
    };

    /* Words come in one after another across [a, b]. */
    const reveal = (els: HTMLElement[], a: number, b: number, p: number, out = 1) => {
      const t = Math.min(1, Math.max(0, (p - a) / (b - a))) * els.length;
      els.forEach((el, i) => {
        const k = Math.min(1, Math.max(0, t - i));
        el.style.opacity = String(k * out);
        el.style.transform = `translateY(${((1 - k) * 0.35).toFixed(3)}em)`;
      });
    };

    const render = (p: number) => {
      if (!V) return;
      const G = NIGHT.ground * V;
      const S = NIGHT.lampGap * V;
      const d = p * NIGHT.drive * V;
      const shift = d % S;
      const pass = NIGHT.pass * V;

      road.style.transform = `translateZ(${shift.toFixed(1)}px) rotateX(-90deg)`;

      /* Lamps, in pairs: post i stands in the middle of the road's i-th
         repeat, so the pools of light on the road stay under them. */
      const [fadeFrom, fadeTo] = NIGHT.lampFade;
      lamps.forEach((el, k) => {
        const i = k >> 1;
        const side = k % 2 ? 1 : -1;
        const z = -(i * S + S / 2) + shift;
        const ahead = -z / V;
        const o = z > pass ? 0 : 1 - smooth(fadeFrom, fadeTo, ahead);
        el.style.opacity = o.toFixed(3);
        el.style.transform = `translate3d(${(side * NIGHT.lampX * W - lampW / 2).toFixed(1)}px, ${(-NIGHT.lampTop * V).toFixed(1)}px, ${z.toFixed(1)}px)`;
      });

      /* Route numbers, painted a hair above the road so the two never
         fight over the same depth. */
      paints.forEach((el, i) => {
        const z = -NIGHT.paintAt[i] * V + d;
        const o = z > pass ? 0 : 1 - smooth(4, 6, -z / V);
        el.style.opacity = o.toFixed(3);
        el.style.transform = `translate3d(${(NIGHT.paintX * W - paintW[i] / 2).toFixed(1)}px, ${(G - 1).toFixed(1)}px, ${z.toFixed(1)}px) rotateX(90deg) scaleY(2.4)`;
      });

      const zg = -NIGHT.gantryAt * V + d;
      gantry.style.opacity = zg > pass ? "0" : (1 - smooth(4, 6, -zg / V)).toFixed(3);
      gantry.style.transform = `translate3d(${(-gantryW / 2).toFixed(1)}px, ${(-NIGHT.gantryTop * V).toFixed(1)}px, ${zg.toFixed(1)}px)`;

      /* The tanker pulls away down the lane to the horizon. */
      const T = NIGHT.tanker;
      const zt = -(T.from + (T.to - T.from) * smooth(T.go[0], T.go[1], p)) * V;
      tanker.style.transform = `translate3d(${(T.x * W - tank.w / 2).toFixed(1)}px, ${(G - tank.h).toFixed(1)}px, ${zt.toFixed(1)}px)`;

      const out = 1 - smooth(NIGHT.line1.out[0], NIGHT.line1.out[1], p);
      reveal(night, NIGHT.line1.in[0], NIGHT.line1.in[1], p, out);
      nightLine.style.visibility = out > 0 ? "" : "hidden";
      reveal(dawnWords, NIGHT.line2.in[0], NIGHT.line2.in[1], p);

      const light = smooth(NIGHT.dawn[0], NIGHT.dawn[1], p);
      dawn.style.opacity = light.toFixed(3);
      dest.style.setProperty("--dawn", light.toFixed(3));
    };

    measure();

    if (prefersReducedMotion()) {
      render(NIGHT.still);
      /* Both lines, whole. */
      [...night, ...dawnWords].forEach((el) => {
        el.style.opacity = "1";
        el.style.transform = "";
      });
      nightLine.style.visibility = "";
      const onResize = () => {
        measure();
        render(NIGHT.still);
      };
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }

    const state = { p: 0 };
    render(0);
    gsap.to(state, {
      p: 1,
      ease: "none",
      onUpdate: () => render(state.p),
      scrollTrigger: {
        trigger: root,
        start: "top bottom",
        end: "bottom top",
        scrub: NIGHT.scrub,
        invalidateOnRefresh: true,
        onRefresh: () => {
          measure();
          render(state.p);
        },
      },
    });
  });

  return null;
}
