import Link from "next/link";

import CtaOil from "./CtaOil";
import DevDials from "./DevDials";
import FloodEdge from "./FloodEdge";
import GradientShader from "./GradientShader";
import HeroMotion from "./HeroMotion";
import NightRun from "./NightRun";
import PakistanMap from "./PakistanMap";
import Preloader from "./Preloader";
import { Safe, SafeGate } from "./Safe";

const STATS = [
  { to: 22, label: ["Food-grade", "oil tankers"] },
  { to: 20, label: ["Years hauling", "edible oil"] },
  { to: 14, label: ["Motorways &", "highways"] },
  { to: 8, label: ["Freight", "corridors"] },
];

export default function Hero() {
  return (
    <>
      <Preloader />

      {/* The handoff is layout, not script. The hero sticks while its track
          scrolls past, and the flood -- ordinary content in the track --
          rises over it at exactly scroll speed, moved by the browser's own
          scrolling rather than by a per-frame transform. See .hero-track in
          globals.css. */}
      <div className="hero-track" id="hero-track">
        {/* Three stacked layers, back to front: the gradient field, the map,
            then the scrim that buys the type its contrast back. Content sits
            above all three. `overflow-hidden` matters now that the map is
            oversized -- it bleeds past the viewport rather than scrolling it.
            The solid navy behind them is for iOS Safari 26, which tints its
            top bar from a pinned element's background colour and skips a
            transparent one: without it, it picks the cream services stage. */}
        <div
          className="hero sticky top-0 isolate flex bg-navy min-h-screen flex-col items-start justify-center overflow-hidden px-[var(--page-pad)] pt-[calc(128*var(--u))] pb-[calc(56*var(--u))] opacity-0 max-[900px]:pt-[104px] max-[900px]:pb-[40px]"
          id="hero"
          style={{ minHeight: "100svh" }}
        >
          <Safe name="gradient shader">
            <GradientShader />
          </Safe>
          <PakistanMap />
          <div className="hero-scrim pointer-events-none absolute inset-0 z-[1]" aria-hidden="true" />

          <div className="relative z-[2] w-full max-w-[calc(620*var(--u))] text-left" id="hero-copy">
            <p
              className="eyebrow mb-[calc(24*var(--u))] flex items-center gap-[calc(14*var(--u))] font-mono text-[length:calc(15*var(--u))] tracking-[0.11em] text-amber max-[900px]:text-[13.5px]"
              data-eyebrow="01"
            >
              <i className="h-px w-[calc(34*var(--u))] shrink-0 bg-amber opacity-70" />
              Edible oil transport
            </p>

            {/* Space Mono Bold, tracked in: a monospace face gives every
                glyph the same width, which reads gappy at display size.

                The headline is the buyer's two fears turned into a promise:
                the refinery's tanks never empty, the tanker is never late.
                "Run" is the trucker's word for a trip, too.

                It is a wide face, so the size is capped by the longer line
                as well as by the viewport. Tracked this way "Never run late."
                is 8.66em across, so each line keeps to itself: 70px at most
                in the 620px copy column, and on a phone the screen's width
                less its two 22px gutters, divided by 8.66 with a little to
                spare.

                Each line rises out of its own clipping box (.ln). Space
                Mono's descenders reach 0.2em below the baseline, past the
                bottom of a 0.99 line, so the box extends 0.15em further down
                -- clear of the y -- and gives the same back as a negative
                margin, leaving the line spacing as it was. It stops there
                because the reveal starts the text 110% of a line below, and
                any lower the tops of the letters would show before they
                rise. flow-root keeps the last line's negative margin inside
                the h1 rather than eating the gap beneath it. */}
            <h1 className="mb-[calc(26*var(--u))] flow-root font-display text-[length:min(clamp(40*var(--u),5.6vw,70*var(--u)),calc(11.4vw_-_5px))] leading-[0.99] font-bold tracking-[-0.035em]">
              <span className="ln -mb-[0.15em] block overflow-hidden pb-[0.15em]">
                <span className="block">Never run dry.</span>
              </span>{" "}
              <span className="ln -mb-[0.15em] block overflow-hidden pb-[0.15em]">
                <span className="block">Never run late.</span>
              </span>
            </h1>

            <p className="sub mb-[calc(34*var(--u))] max-w-[50ch] text-[length:calc(17*var(--u))] leading-[1.6] text-mist">
              Food-grade oil tankers from Port Qasim to refineries and ghee mills across
              Pakistan. Our own fleet and drivers, twenty years on the road.
            </p>

            <div className="actions mb-[calc(48*var(--u))] flex flex-wrap gap-[calc(13*var(--u))]">
              <Link
                className="glass glass--cta glass--primary text-[length:calc(14.5*var(--u))] font-medium max-[900px]:text-[13px] text-navy no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber focus-visible:outline-offset-[4px]"
                href="/contact"
              >
                {/* Oil that rises inside the button on hover, its surface
                    reaching for the pointer. See .cta-oil in globals.css. */}
                <Safe name="CTA oil">
                  <CtaOil />
                </Safe>
                Get a quote
              </Link>
              {/* To the corridor map under the flood: the network, drawn.
                  SmoothScroll glides it there. */}
              <a
                className="glass glass--cta text-[length:calc(14.5*var(--u))] font-medium max-[900px]:text-[13px] text-cream no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber focus-visible:outline-offset-[4px]"
                href="#approach"
              >
                See our routes
              </a>
            </div>

            <dl className="stats grid max-w-[calc(620*var(--u))] grid-cols-4 gap-[calc(26*var(--u))] border-t border-rule pt-[calc(22*var(--u))] max-[900px]:grid-cols-2 max-[900px]:gap-[22px]">
              {STATS.map((s) => (
                <div key={s.label.join(" ")}>
                  <dd
                    className="num mb-[calc(6*var(--u))] font-display text-[length:calc(29*var(--u))] font-bold tracking-[-0.02em]"
                    data-to={s.to}
                  >
                    0
                  </dd>
                  <dt className="font-mono text-[length:calc(10.5*var(--u))] leading-[1.4] text-mist opacity-70">
                    {s.label[0]}
                    <br />
                    {s.label[1]}
                  </dt>
                </div>
              ))}
            </dl>
          </div>

        </div>

        {/* The flood panel. After the hero in the track and in its flow, so
            it scrolls up over all of it -- map, scrim and copy -- and the
            track is exactly as long as the flood. It opens onto the night
            run (NightRun), then a short ramp to the light section's cream.
            Server-rendered like the rest of the hero; ScrollTransition
            reads it and its ramp by id. */}
        <div className="hero-flood" id="hero-flood">
          {/* Its leading edge: a liquid surface, lit amber. */}
          <FloodEdge />
          <NightRun />
          <div className="hero-flood-ramp" id="hero-flood-ramp" aria-hidden="true" />
        </div>
      </div>

      <SafeGate name="hero intro">
        <HeroMotion />
      </SafeGate>
      <Safe name="dev dials">
        <DevDials />
      </Safe>
    </>
  );
}
