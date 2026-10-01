"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";

import {
  DUR,
  EASE,
  HERO,
  LIFT_Y,
  STAGGER,
  markRevealed,
  onHeroFlag,
  refreshOnLayoutShift,
  withMotion,
} from "@/lib/motion";

const INTRO_SEEN = "zg:intro-seen";

/**
 * Renders nothing. It drives the load sequence for the markup that
 * Preloader, PakistanMap and Hero render on the server, selecting by id
 * so the ~160KB of map data stays out of the client bundle.
 */
export default function HeroMotion() {
  useGSAP(() => {
    const pre = document.getElementById("pre");
    const hero = document.getElementById("hero");
    if (!pre || !hero) return;

    const q = <T extends Element>(sel: string) => gsap.utils.toArray<T>(sel);

    /* The dot fields fade by grid row rather than by dot -- see
       lib/dot-grid.ts for why. `byFirstDot` starts each row at the moment
       its first dot started when they faded one by one, so the sweep keeps
       its timing to within the 0.04s a row used to spread across. */
    const preRows = q<SVGGElement>("#pre-dots .pre-row");
    const mapRows = q<SVGGElement>("#m-dots .dot-row");
    const byFirstDot = (step: number) => (_: number, row: SVGGElement) =>
      Number(row.dataset.i) * step;
    const outlines = q<SVGPathElement>("#m-outline path");
    /* Every road arrives hidden behind its own dash, measured at build
       (PakistanMap), so nothing here has to measure a path. */
    const ctxRoads = q<SVGPathElement>("#m-ctx path");
    const corRoads = q<SVGPathElement>("#m-cor path");
    const haloRoads = q<SVGPathElement>("#m-halo path");
    const bloomRoads = q<SVGPathElement>("#m-bloom path");
    const pulses = q<SVGPathElement>("#m-pulse path");
    const nodeGs = q<SVGGElement>("#m-nodes > g");
    const rings = q<SVGCircleElement>("#m-nodes .map-ring");
    const headlineSpans = q<HTMLElement>("h1 .ln span");
    const numEls = q<HTMLElement>(".num");
    /* The copy's soft entrance, in two parts. Movement goes on the blocks
       as laid out -- the CTAs rise together as one row -- but opacity goes
       on the leaves, through --in (see #hero-copy in globals.css). An
       opacity on .actions would make it the CTAs' backdrop root and strip
       their glass until the fade finished, then snap it back. */
    const softMove = [".sub", ".actions", ".stats"];
    const softFade = [".sub", ".actions > *", ".stats"];

    const countTo = (el: HTMLElement, duration: number) => {
      const proxy = { v: 0 };
      gsap.to(proxy, {
        v: Number(el.dataset.to),
        duration,
        ease: EASE.carry,
        onUpdate: () => {
          el.textContent = String(Math.round(proxy.v));
        },
      });
    };

    /* The corridor and ring pulses repeat forever. They freeze the moment
       the hero starts to leave -- each frame they move, the browser
       repaints their layer (.map-live), which it cannot spare while it is
       also scrolling and fading the map -- and pick up where they were
       when the hero comes back to rest. */
    const loops: gsap.core.Tween[] = [];
    let heroLeaving = false;
    const stopLeaving = onHeroFlag(hero, "leaving", (leaving) => {
      heroLeaving = leaving;
      loops.forEach((t) => (leaving ? t.pause() : t.resume()));
    });

    const pulseFlow = () => {
      pulses.forEach((p, i) => {
        const len = Number(p.dataset.len);
        gsap.set(p, { opacity: 0.9 });
        loops.push(gsap.fromTo(
          p,
          { strokeDashoffset: len },
          {
            strokeDashoffset: 0,
            duration: HERO.pulseDuration,
            ease: EASE.hold,
            repeat: -1,
            delay: i * HERO.pulseStaggerStep,
          }
        ));
      });
      rings.forEach((ring, i) => {
        loops.push(gsap.to(ring, {
          attr: { r: 17 },
          opacity: 0,
          duration: HERO.ringPulseDuration,
          ease: EASE.flow,
          repeat: -1,
          delay: i * HERO.ringPulseStaggerStep,
        }));
      });
      if (heroLeaving) loops.forEach((t) => t.pause());
    };

    const applyFinalState = () => {
      markRevealed(hero);
      pre.style.display = "none";
      gsap.set(hero, { opacity: 1 });
      gsap.set([mapRows, outlines, nodeGs], { opacity: 1 });
      [corRoads, haloRoads, bloomRoads, ctxRoads].forEach((set) =>
        gsap.set(set, { strokeDashoffset: 0 })
      );
      gsap.set(headlineSpans, { yPercent: 0 });
      gsap.set(softMove, { y: 0 });
      gsap.set(softFade, { "--in": 1 });
      numEls.forEach((el) => {
        el.textContent = el.dataset.to ?? "0";
      });
    };

    const reveal = () => {
      /* First, before any tween: the moment the preloader starts to fade
         is the moment anything behind it can be seen. */
      markRevealed(hero);
      gsap
        .timeline()
        .to(pre, {
          opacity: 0,
          duration: HERO.preloaderFadeDuration,
          ease: EASE.veil,
          onComplete: () => {
            pre.style.display = "none";
          },
        })
        .to(hero, { opacity: 1, duration: DUR.lift, ease: EASE.lift }, "-=0.4")
        /* Two tracks from here, side by side. The map draws itself in
           behind; the copy doesn't wait for it. Chained after the map,
           the headline landed some five seconds after the preloader had
           gone -- a visitor reading an empty page -- so the copy now
           starts a beat after the hero appears, while the map is still
           coming up under it. */
        .addLabel("copy", `<${HERO.copyDelay}`)
        .to(
          mapRows,
          {
            opacity: 1,
            duration: DUR.lift,
            ease: EASE.lift,
            stagger: byFirstDot(HERO.mapDotStagger),
          },
          "-=0.3"
        )
        .to(outlines, { opacity: 1, duration: HERO.outlineDuration, ease: EASE.settle }, "-=0.4")
        .to(
          ctxRoads,
          {
            strokeDashoffset: 0,
            duration: HERO.contextRoadDuration,
            ease: EASE.carry,
            stagger: HERO.contextRoadStagger,
          },
          "-=0.5"
        )
        .to(
          [bloomRoads, haloRoads, corRoads],
          {
            strokeDashoffset: 0,
            duration: HERO.corridorRoadDuration,
            ease: EASE.carry,
            stagger: HERO.corridorRoadStagger,
          },
          "-=1.2"
        )
        .to(
          nodeGs,
          { opacity: 1, duration: DUR.settle, ease: EASE.settle, stagger: HERO.nodeStagger },
          "-=1.1"
        )
        /* The pulses start as the last cities light. */
        .add(pulseFlow, "-=0.3")
        /* The copy, on its own clock from the "copy" label. Offsets are
           the same gaps the lines had when they were chained. */
        .to(
          headlineSpans,
          { yPercent: 0, duration: HERO.headlineDuration, ease: EASE.lift, stagger: STAGGER },
          "copy"
        )
        .to(".sub", { "--in": 1, y: 0, duration: DUR.lift, ease: EASE.lift }, "copy+=0.38")
        .to(".actions", { y: 0, duration: DUR.lift, ease: EASE.lift }, "copy+=0.53")
        .to(".actions > *", { "--in": 1, duration: DUR.lift, ease: EASE.lift }, "<")
        .to(".stats", { "--in": 1, y: 0, duration: DUR.lift, ease: EASE.lift }, "copy+=0.68")
        .add(() => numEls.forEach((el) => countTo(el, HERO.statCountDuration)), "copy+=0.98");
    };

    withMotion(() => {
      gsap.set(mapRows, { opacity: 0 });
      gsap.set(outlines, { opacity: 0 });
      gsap.set(nodeGs, { opacity: 0 });
      gsap.set(headlineSpans, { yPercent: 110 });
      gsap.set(softMove, { y: LIFT_Y });
      gsap.set(softFade, { "--in": 0 });

      /* The full count plays once per visit. Back on the home page in the
         same session the visitor has seen it, so it runs short: the map
         still lights up and hands off, without the wait. */
      let repeat = false;
      try {
        repeat = sessionStorage.getItem(INTRO_SEEN) === "1";
        sessionStorage.setItem(INTRO_SEEN, "1");
      } catch {
        /* Storage blocked: every visit is a first visit. */
      }

      /* To 1, not to the dots' 0.9: that lives in their fill (see
         .pre-dot), so no row is left resting below full opacity. */
      gsap.to(preRows, {
        opacity: 1,
        duration: DUR.lift,
        ease: EASE.lift,
        stagger: byFirstDot(repeat ? HERO.preloaderRepeatDotStagger : HERO.preloaderDotStagger),
      });

      const numEl = document.getElementById("pre-num");
      const fill = document.getElementById("pre-fill");
      const prog = { v: 0 };
      gsap.to(prog, {
        v: 100,
        duration: repeat ? HERO.preloaderRepeatDuration : HERO.preloaderCountDuration,
        ease: EASE.carry,
        onUpdate: () => {
          if (numEl) numEl.textContent = String(Math.round(prog.v)).padStart(2, "0");
          if (fill) fill.style.right = `${100 - prog.v}%`;
        },
        onComplete: reveal,
      });

      return null;
    }, applyFinalState);

    const stopRefresh = refreshOnLayoutShift();
    return () => {
      stopRefresh();
      stopLeaving();
      delete hero.dataset.revealed;
    };
  }, []);

  return null;
}
