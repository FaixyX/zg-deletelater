"use client";

import { useRef } from "react";

import { gsap, markReady, MEDIA, ScrollTrigger, useGSAP } from "../../_motion/gsap";

const LEGS = [
  { road: "M-9", span: "Port Qasim → Hyderabad" },
  { road: "N-5", span: "Hyderabad → Sukkur" },
  { road: "M-5", span: "Sukkur → Multan" },
  { road: "M-4", span: "Multan → Faisalabad" },
  { road: "M-3", span: "Faisalabad → Lahore" },
];

/* The Run's motion. Renders nothing; drives the server-rendered page by
   class name inside its own .run root.
   - Load: the two headline lines rise out of their masks, the tanker rolls
     in and settles.
   - Hero exit (scrubbed): the headline lifts away, the tanker pulls off.
   - The run (pinned, scrubbed over five screens): the road and roadside
     stream past the tanker, gantry signs pass overhead at each leg, the
     mini-map draws the real route and a marker follows it, the HUD reads
     the current leg.
   Reduced motion: none of that; the finished map and a plain leg list. */
export default function Stage({ stations }: { stations: number[] }) {
  const anchor = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const root = anchor.current?.closest<HTMLElement>(".run");
    if (!root) return;
    const q = gsap.utils.selector(root);
    const mm = gsap.matchMedia();

    mm.add(MEDIA.reduce, () => {
      root.dataset.motion = "reduce";
      const route = root.querySelector<SVGPathElement>("#r-route");
      const end = route?.getPointAtLength(route.getTotalLength());
      if (end) gsap.set(q(".r-mini-dot"), { attr: { transform: `translate(${end.x} ${end.y})` } });
      markReady();
    });

    mm.add(MEDIA.full, () => {
      root.dataset.motion = "full";

      /* Load */
      const intro = gsap.timeline({ defaults: { ease: "power4.out" }, onComplete: markReady });
      intro
        .from(q(".r-hero .r-line > span"), { yPercent: 112, duration: 1.15, stagger: 0.12 }, 0.15)
        .from(q(".r-hero .r-in"), { autoAlpha: 0, y: 18, duration: 0.8, stagger: 0.08, ease: "power3.out" }, 0.55)
        .from(q(".r-tanker--hero"), { xPercent: -160, duration: 1.7, ease: "power3.out" }, 0.2)
        .from(q(".r-tanker--hero .tk-wheel"), { rotation: -900, transformOrigin: "50% 50%", duration: 1.7, ease: "power3.out" }, 0.2)
        .from(q(".r-scrollcue"), { autoAlpha: 0, duration: 0.6 }, 1.4);

      /* Hero exit */
      gsap
        .timeline({ scrollTrigger: { trigger: q(".r-hero")[0], start: "top top", end: "bottom top", scrub: 0.6 } })
        .to(q(".r-h1"), { yPercent: -18, autoAlpha: 0.15, ease: "none" }, 0)
        .to(q(".r-tanker--hero"), { xPercent: 120, ease: "none" }, 0)
        .to(q(".r-tanker--hero .tk-wheel"), { rotation: 720, transformOrigin: "50% 50%", ease: "none" }, 0)
        .to(q(".r-dashes"), { xPercent: -30, ease: "none" }, 0);

      /* The run */
      const D = 10;
      const legLabel = q("[data-hud=leg]")[0];
      const roadLabel = q("[data-hud=road]")[0];
      const spanLabel = q("[data-hud=span]")[0];
      let current = -1;
      const setLeg = (i: number) => {
        if (i === current) return;
        current = i;
        legLabel.textContent = String(i + 1).padStart(2, "0");
        roadLabel.textContent = LEGS[i].road;
        spanLabel.textContent = LEGS[i].span;
        gsap.fromTo(roadLabel, { yPercent: 40, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.45, ease: "power3.out" });
      };
      setLeg(0);

      const run = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: q(".r-run")[0],
          start: "top top",
          end: "+=520%",
          pin: q(".r-stage")[0],
          scrub: 0.8,
          onUpdate: (self) => {
            const p = self.progress;
            let i = 0;
            for (let k = 0; k < 5; k++) if (p >= stations[k] - 0.001) i = k;
            setLeg(Math.min(i, 4));
          },
        },
      });

      run
        .fromTo(q("#r-route"), { drawSVG: "0%" }, { drawSVG: "100%", duration: D }, 0)
        .to(q(".r-mini-dot"), { motionPath: { path: "#r-route", align: "#r-route", alignOrigin: [0.5, 0.5] }, duration: D }, 0)
        .to(q(".r-lane"), { xPercent: -80, duration: D }, 0)
        .to(q(".r-poles"), { xPercent: -60, duration: D }, 0)
        .to(q(".r-tanker--run .tk-wheel"), { rotation: 360 * 48, transformOrigin: "50% 50%", duration: D }, 0)
        .to(q(".r-tanker--run"), { y: -1.5, duration: 0.25, repeat: Math.round(D / 0.25) - 1, yoyo: true, ease: "sine.inOut" }, 0);

      q(".r-legs b").forEach((bar, i) => {
        run.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: (stations[i + 1] - stations[i]) * D }, stations[i] * D);
      });

      /* A gantry passes overhead as each leg begins. */
      q(".r-sign").forEach((sign, i) => {
        const t = Math.max(0, stations[i] * D - 0.3);
        run.fromTo(sign, { xPercent: 0, x: () => window.innerWidth * 1.05 }, { x: () => -window.innerWidth * 0.75, duration: 2.1 }, t);
      });

      /* The city behind the truck changes at each station. */
      const cities = q(".r-city");
      gsap.set(cities, { autoAlpha: 0, yPercent: 30 });
      gsap.set(cities[0], { autoAlpha: 1, yPercent: 0 });
      cities.forEach((city, k) => {
        if (k === 0) return;
        const t = stations[k] * D;
        run
          .to(cities[k - 1], { autoAlpha: 0, yPercent: -30, duration: 0.45, ease: "power2.in" }, t - 0.5)
          .to(city, { autoAlpha: 1, yPercent: 0, duration: 0.55, ease: "power3.out" }, t - 0.1);
      });

      /* Arrival */
      gsap.from(q(".r-close .r-line > span"), {
        yPercent: 112,
        duration: 1.1,
        ease: "power4.out",
        stagger: 0.1,
        scrollTrigger: { trigger: q(".r-close")[0], start: "top 70%" },
      });
      gsap.from(q(".r-fig"), {
        autoAlpha: 0,
        y: 24,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: { trigger: q(".r-figs")[0], start: "top 85%" },
      });
      gsap.from(q(".r-fig dd"), {
        "--rule": 0,
        duration: 1.1,
        ease: "power3.inOut",
        stagger: 0.08,
        scrollTrigger: { trigger: q(".r-figs")[0], start: "top 85%" },
      });

      document.fonts?.ready.then(() => ScrollTrigger.refresh());
    });

    return () => mm.revert();
  });

  return <span ref={anchor} hidden />;
}
