"use client";

import { useRef } from "react";

import { gsap, markReady, MEDIA, ScrollTrigger, SplitText, useGSAP } from "../../_motion/gsap";

/* Ledger in Motion. Renders nothing; drives the page inside .ledger.
   - Load: the waybill rules draw, the headline is written in word by word
     out of masks, the seal turns in and lands.
   - Hero scroll: the seal keeps turning with the page, a quarter turn per
     screen, like a stamp being lined up.
   - The clauses (pinned, scrubbed): the five cargo clauses travel sideways
     while the paper darkens to ink; each clause number drifts against its
     panel; at the end the seal comes down on the last panel.
   Reduced motion: the clauses stack as a plain list, the seal sits still. */
export default function Stage() {
  const anchor = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const root = anchor.current?.closest<HTMLElement>(".ledger");
    if (!root) return;
    const q = gsap.utils.selector(root);
    const mm = gsap.matchMedia();

    mm.add(MEDIA.reduce, () => {
      root.dataset.motion = "reduce";
      markReady();
    });

    mm.add(MEDIA.full, () => {
      root.dataset.motion = "full";

      /* Load */
      const split = SplitText.create(q(".l-h1")[0], { type: "words", mask: "words" });
      gsap
        .timeline({ defaults: { ease: "power4.out" }, onComplete: markReady })
        .from(q(".l-cell"), { "--draw": 0, duration: 1.1, stagger: 0.08, ease: "power3.inOut" }, 0)
        .from(split.words, { yPercent: 110, duration: 1.05, stagger: 0.06 }, 0.2)
        .from(q(".l-seal--hero"), { rotation: -120, scale: 1.25, autoAlpha: 0, duration: 1.4, ease: "expo.out" }, 0.55)
        .from(q(".l-in"), { autoAlpha: 0, y: 16, duration: 0.8, stagger: 0.08, ease: "power3.out" }, 0.75);

      /* Hero scroll */
      gsap.to(q(".l-seal--hero"), {
        rotation: 90,
        ease: "none",
        scrollTrigger: { trigger: q(".l-hero")[0], start: "top top", end: "bottom top", scrub: 0.5 },
      });
      gsap.to(q(".l-h1"), {
        yPercent: -12,
        ease: "none",
        scrollTrigger: { trigger: q(".l-hero")[0], start: "top top", end: "bottom top", scrub: 0.5 },
      });

      /* The clauses */
      const track = q(".l-track")[0];
      const distance = () => track.scrollWidth - window.innerWidth;
      const slide = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: q(".l-clauses")[0],
          pin: q(".l-pin")[0],
          start: "top top",
          end: () => `+=${distance() * 1.15}`,
          scrub: 0.7,
          invalidateOnRefresh: true,
        },
      });
      slide
        .to(track, { x: () => -distance(), duration: 1 }, 0)
        /* The page turns to ink between clauses 3 and 4: a quick flip rather
           than a long fade, so text and ground never meet in the same grey. */
        .to(q(".l-clauses")[0], { "--bg": "#071544", "--fg": "#f5eedf", "--rule": "#3b4f94", duration: 0.05, ease: "power2.inOut" }, 0.5)
        .fromTo(
          q(".l-seal--stamp"),
          { scale: 2.6, rotation: -60, autoAlpha: 0 },
          { scale: 1, rotation: -10, autoAlpha: 1, duration: 0.07, ease: "power4.in" },
          0.9,
        )
        .fromTo(q(".l-stamp-ring"), { scale: 0.8, autoAlpha: 0 }, { scale: 1.5, autoAlpha: 0.6, duration: 0.03 }, 0.97)
        .to(q(".l-stamp-ring"), { autoAlpha: 0, duration: 0.03 }, 1);

      /* Each clause number drifts against its panel as it passes. */
      q(".l-ghost").forEach((ghost) => {
        gsap.fromTo(
          ghost,
          { xPercent: 35 },
          {
            xPercent: -35,
            ease: "none",
            scrollTrigger: {
              trigger: ghost.parentElement!,
              containerAnimation: slide.getChildren()[0] as gsap.core.Tween,
              start: "left right",
              end: "right left",
              scrub: true,
            },
          },
        );
      });

      /* The record */
      gsap.from(q(".l-fig dd"), {
        yPercent: 100,
        autoAlpha: 0,
        duration: 1,
        ease: "power4.out",
        stagger: 0.08,
        scrollTrigger: { trigger: q(".l-figs")[0], start: "top 80%" },
      });
      gsap.from(q(".l-fig"), {
        "--draw": 0,
        duration: 1.2,
        ease: "power3.inOut",
        stagger: 0.08,
        scrollTrigger: { trigger: q(".l-figs")[0], start: "top 85%" },
      });

      document.fonts?.ready.then(() => ScrollTrigger.refresh());
      return () => split.revert();
    });

    return () => mm.revert();
  });

  return <span ref={anchor} hidden />;
}
