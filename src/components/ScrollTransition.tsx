"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { EASE, LIFT_Y, TRANSITION, setHeroFlag, withMotion } from "@/lib/motion";

/**
 * Renders nothing. The handoff itself is layout: the hero is sticky in a
 * track, and the flood is ordinary content in that track that the browser
 * scrolls up over it (see .hero-track in globals.css). Nothing here moves
 * the flood or holds the hero, so nothing here can make either of them
 * arrive a frame late.
 *
 * What is left is what layout can't do: fading the hero's own contents
 * out at two rates as the flood rises, and keeping the header and the
 * cover state in step with what is actually on screen.
 */
export default function ScrollTransition() {
  useGSAP(() => {
    const track = document.getElementById("hero-track");
    const hero = document.getElementById("hero");
    const flood = document.getElementById("hero-flood");
    const ramp = document.getElementById("hero-flood-ramp");
    const copy = document.getElementById("hero-copy");
    const header = document.getElementById("site-header");
    const map = document.querySelector<HTMLElement>(".map-layer");
    if (!track || !hero || !flood || !ramp || !copy || !map) return;

    /* The header follows the colour actually underneath it, read off the
       flood's live position, not a point in the scroll: right at any
       scroll speed, after the hold as well as during it, and on a reload
       halfway down the page. */
    const darkGrounds = gsap.utils.toArray<HTMLElement>('[data-ground="dark"]');
    const inkLogo = header?.querySelector<HTMLElement>(".logo-ink") ?? null;
    let lastClip = "";
    const syncHeader = () => {
      if (!header) return;
      /* Where the ground under a line across the screen is light: past
         the ink line on the flood's ramp, and not inside any section
         marked data-ground="dark". */
      const r = ramp.getBoundingClientRect();
      const inkLine = r.top + r.height * TRANSITION.inkFrom;
      const darks = darkGrounds.map((el) => el.getBoundingClientRect());
      const inkAt = (y: number) => y >= inkLine && !darks.some((r) => r.top <= y && r.bottom >= y);

      const bar = header.getBoundingClientRect();
      header.classList.toggle("header--ink", inkAt(bar.top + bar.height / 2));

      /* The logo is split along whichever of those edges crosses it: the
         ink copy is clipped to the part over light ground, so the logo is
         cream over the dark and ink over the light, line for line. */
      if (!inkLogo) return;
      const rect = inkLogo.getBoundingClientRect();
      if (!rect.height) return;
      /* Where the logo rests, not where it is: the header may be sliding
         in or out (HeaderAutoHide), and it sits at the top of the window,
         so its offset from there is exactly the slide. */
      const box = { top: rect.top - bar.top, bottom: rect.bottom - bar.top, height: rect.height };
      const topInk = inkAt(box.top + 0.5);
      const edges = [inkLine, ...darks.flatMap((r) => [r.top, r.bottom])]
        .filter((e) => e > box.top && e < box.bottom)
        .sort((a, b) => a - b);
      const split = edges.find((e) => inkAt(e + 0.5) !== topInk);
      let clip: string;
      if (split === undefined) clip = topInk ? "inset(0)" : "inset(0 0 100% 0)";
      else {
        const pct = ((split - box.top) / box.height) * 100;
        clip = topInk
          ? `inset(0 0 ${(100 - pct).toFixed(2)}% 0)`
          : `inset(${pct.toFixed(2)}% 0 0 0)`;
      }
      if (clip !== lastClip) {
        inkLogo.style.clipPath = clip;
        lastClip = clip;
      }
    };

    /* And whether the flood now hides the hero entirely: once its first
       opaque stop is above the top of the screen, nothing behind it can
       be seen, so the shader and the map loops can stop. */
    const syncCover = (panel: DOMRect) =>
      setHeroFlag(hero, "covered", panel.top + panel.height * TRANSITION.floodSolidFrom <= 0);

    /* The copy fades block by block, never as one wrapper: see #hero-copy
       in globals.css for what a wrapper's opacity does to the glass CTAs.
       The wrapper still carries the movement, and goes visibility: hidden
       once everything in it has faded, so the CTAs can't take focus while
       invisible. */
    const copyBlocks = gsap.utils.toArray<HTMLElement>(
      copy.querySelectorAll(":scope > :not(.actions), .actions > *")
    );

    /* Read where the browser has just scrolled the flood: it is plain
       page content, so there is no script-driven position to lag behind. */
    const syncFromPanel = () => {
      syncHeader();
      syncCover(flood.getBoundingClientRect());
    };

    withMotion(
      () => {
        /* Scrubbed across the flood's rise: from rest to the moment its
           top reaches the top of the screen and the hero is covered. So
           these fractions are positions on that rise, however long the
           flood that follows is. */
        const tl = gsap.timeline({
          defaults: { ease: EASE.hold },
          scrollTrigger: {
            trigger: track,
            start: "top top",
            end: () => `+=${flood.offsetTop}`,
            scrub: TRANSITION.scrub,
            invalidateOnRefresh: true,
            id: "hero-transition",
            /* Any scroll into the hold and the hero is leaving: the map's
               pulses freeze (see HeroMotion) until it is back at rest. */
            onUpdate: (self) => setHeroFlag(hero, "leaving", self.progress > 0),
            onRefresh: (self) => setHeroFlag(hero, "leaving", self.progress > 0),
          },
        });

        tl.to(copy, { y: -LIFT_Y, duration: TRANSITION.contentOut }, 0)
          .to(copyBlocks, { "--out": 0, duration: TRANSITION.contentOut }, 0)
          .set(copy, { visibility: "hidden" }, TRANSITION.contentOut)
          /* Opacity, not autoAlpha. autoAlpha's visibility: hidden at 0
             tore the map's compositor layer down, and scrolling back up
             rebuilt it -- all 4,388 dots re-rasterised in a single frame,
             the hitch you could see as the map came back. The map is
             aria-hidden and takes no pointer events, so hiding it buys
             nothing. */
          /* A fade and nothing else. The map used to drift upward as it
             faded, but anything script moves in step with the scroll lands
             a frame or more behind the browser's own scrolling, which on a
             phone runs on a thread of its own -- so the drift juddered
             against the rising flood however it was tuned. An opacity that
             arrives a frame late doesn't show. */
          .to(map, { opacity: 0, duration: TRANSITION.mapOut }, 0)
          /* Holds the timeline at a length of exactly 1, so each duration
             above reads directly as the fraction of the hold it spans. */
          .set({}, {}, 1);

        return tl;
      },
      /* Reduced motion: the stylesheet drops the hold and parks the flood
         over the hero where the full version leaves it at release. It
         cross-fades in as the hero scrolls away, so the colour change is
         kept and only the movement goes. The copy fades with it rather
         than sitting under an opaque panel, where its CTAs would still
         take focus while invisible. */
      () => {
        gsap.set(flood, { autoAlpha: 0 });

        const fade = gsap.timeline({
          defaults: { ease: EASE.hold },
          scrollTrigger: {
            trigger: hero,
            start: "top top",
            end: `+=${TRANSITION.reducedFade}`,
            scrub: TRANSITION.scrub,
            invalidateOnRefresh: true,
            id: "hero-transition-reduced",
          },
        });

        fade
          .to(flood, { autoAlpha: 1, duration: 1 }, 0)
          .to(copyBlocks, { "--out": 0, duration: 1 }, 0)
          .set(copy, { visibility: "hidden" }, 1);
      }
    );

    /* Page-length, so the header and the cover state keep tracking after
       the hold ends. */
    ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: syncFromPanel,
      onRefresh: syncFromPanel,
    });

    /* The header outlives this page when the visitor moves to another in
       the browser, so it gives back the ink it may have taken. */
    return () => {
      header?.classList.remove("header--ink");
      inkLogo?.style.removeProperty("clip-path");
    };
  }, []);

  return null;
}
