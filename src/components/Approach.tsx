"use client";

import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { type ReactNode, useRef } from "react";

import {
  CHAIN,
  DUR,
  EASE,
  FILL,
  LIFT_Y,
  STAGGER,
  TRANSITION,
  reachableScrollEnd,
  useIdleGSAP,
  withMotion,
} from "@/lib/motion";

import ShipToShelf from "./ShipToShelf";

/**
 * The light section the hero's flood hands off to. Its background is the
 * cream the gradient ramp ends on, so the seam where the pin releases
 * isn't one.
 *
 * A client component rather than the server-markup-plus-motion-shim pair
 * the hero uses: that split exists to keep the map's ~160KB of path data
 * out of the client bundle. The corridor map in the figure does carry
 * that data, so it arrives already rendered, as the `map` prop, from the
 * server.
 */
export default function Approach({ map }: { map: ReactNode }) {
  /* A ref, not a "#approach" string: useGSAP resolves a selector scope
     eagerly, which on the server means calling querySelectorAll on a
     document that isn't there and failing the prerender. */
  const root = useRef<HTMLElement>(null);
  const statement = useRef<HTMLParagraphElement>(null);

  useIdleGSAP(
    () => {
      const section = root.current;
      const text = statement.current;
      if (!section || !text) return;

      withMotion(
        () => {
          const tl = gsap.timeline({
            scrollTrigger: { trigger: section, start: TRANSITION.sectionStart },
          });

          tl.from(".ap-rise", {
            opacity: 0,
            y: LIFT_Y,
            duration: DUR.settle,
            ease: EASE.lift,
            stagger: STAGGER,
          });

          /* The statement fills with ink as it is read -- see FILL. Split
             into words only, as plain inline spans: nothing in them moves,
             so they need no box of their own, and the lines break exactly
             where they did. aria: "none" leaves the sentence in the
             accessibility tree as written. The default would label the
             paragraph and hide its words, and a paragraph's label is one a
             screen reader is free to skip -- leaving nothing to read. */
          const { words } = SplitText.create(text, {
            type: "words",
            tag: "span",
            aria: "none",
          });

          /* Unread words are a colour rather than an opacity, so each is
             drawn opaque the whole way and its anti-aliasing doesn't change
             in the moment it finishes. */
          const rest = gsap.utils.interpolate(
            getComputedStyle(section).backgroundColor,
            getComputedStyle(text).color,
            FILL.rest
          );

          gsap.from(words, {
            color: rest,
            ease: EASE.hold,
            /* A word's fill lasts `front` steps of the stagger, so that
               many are part-filled at once. */
            duration: FILL.front,
            stagger: 1,
            scrollTrigger: {
              trigger: text,
              start: FILL.start,
              end: () =>
                Math.min(
                  text.getBoundingClientRect().bottom +
                    window.scrollY -
                    FILL.endAt * window.innerHeight,
                  reachableScrollEnd()
                ),
              scrub: FILL.scrub,
            },
          });

          /* The drop runs the chain as it is read: --p along the line,
             and each station lit as the drop reaches it. */
          const chain = section.querySelector<HTMLElement>(".sts-chain");
          const stations = gsap.utils.toArray<HTMLElement>(".sts-station", section);
          if (chain) {
            const at = (p: number) => {
              chain.style.setProperty("--p", p.toFixed(4));
              stations.forEach((el, i) =>
                el.toggleAttribute("data-lit", p >= i / (stations.length - 1) - CHAIN.lead)
              );
            };
            const run = { p: 0 };
            chain.setAttribute("data-run", "");
            at(0);
            gsap.to(
              run,
              {
                p: 1,
                ease: "none",
                onUpdate: () => at(run.p),
                scrollTrigger: {
                  trigger: chain,
                  start: CHAIN.start,
                  end: () =>
                    Math.min(
                      chain.getBoundingClientRect().bottom + window.scrollY - CHAIN.endAt * window.innerHeight,
                      reachableScrollEnd()
                    ),
                  scrub: CHAIN.scrub,
                },
              }
            );
          }

          return tl;
        },
        /* Nothing to undo: the section is authored in its final state and
           the entrance only ever animates from something to it. Left
           unsplit, the statement is already in its ink, and the chain is
           run and lit (see .sts in globals.css). */
        () => {}
      );
    },
    root
  );

  return (
    <section
      className="section-light relative z-[2] px-[var(--page-pad)] pt-[10vh] pb-[14vh]"
      id="approach"
      ref={root}
    >
      <div className="ap mx-auto max-w-[calc(1400*var(--u))]">
        <p
          className="ap-rise mb-[calc(30*var(--u))] flex items-center gap-[calc(14*var(--u))] font-mono text-[length:calc(13*var(--u))] tracking-[0.11em] text-navy"
          data-eyebrow="02"
        >
          <i className="h-px w-[calc(34*var(--u))] shrink-0 bg-navy opacity-40" />
          Ship to shelf
        </p>

        {/* Set in the hero headline's face so the two statements read as
            one voice across the colour change, and across the section:
            it is the section's headline now, not a column beside a map.
            The last two words wrap as one, so the statement never ends on
            a word by itself: a wrapper rather than a non-breaking space,
            which SplitText turns back into an ordinary one. */}
        <p
          className="ap-rise max-w-[30ch] font-display text-[length:clamp(30*var(--u),4.2vw,62*var(--u))] leading-[1.1] font-bold tracking-[-0.03em] text-navy-deep"
          ref={statement}
        >
          Most of Pakistan&apos;s cooking oil lands by sea and travels inland by road.
          Between ship and shelf, we are the link that can&apos;t break:
          <span className="text-navy">
            {" "}
            our own tankers and drivers, berth to{" "}
            <span className="whitespace-nowrap">refinery gate.</span>
          </span>
        </p>

        {/* The chain itself, station by station, our link in amber. */}
        <div className="ap-rise">
          <ShipToShelf />
        </div>

        <div className="ap-foot">
          <figure className="ap-rise m-0">
            {map}
            <figcaption className="mt-[calc(14*var(--u))] font-mono text-[length:calc(10.5*var(--u))] tracking-[0.06em] text-navy opacity-55">
              The Karachi–Multan corridor: M-9, N-5 and M-5
            </figcaption>
          </figure>

          {/* What the statement stands on, in plain type: why the road is
              the link a supply chain can least afford to lose. */}
          <p className="ap-rise ap-body">
            Road freight carries the vast majority of Pakistan&apos;s goods, so when a tanker is
            late, a refinery idles, a ghee mill stops its line and shelves run short from
            Multan to Peshawar. That is why we run our own fleet instead of hiring trucks off
            the open market: food-grade tankers kept for oil alone, company drivers who know
            your gate, and capacity planned before the Ramadan peak and the crushing season,
            not during them.
          </p>
        </div>
      </div>
    </section>
  );
}
