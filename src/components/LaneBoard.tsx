"use client";

import { useEffect, useRef, useState } from "react";

import { LANES } from "@/lib/faq";

import SplitFlap from "./SplitFlap";

const MAX_KM = Math.max(...LANES.map((l) => l.km));
const START_AT = LANES.findIndex((l) => l.city === "Lahore");

/**
 * A departure board for the most asked question: how far, and how long.
 * Pick a city and the tiles flip to its distance and road time from Port
 * Qasim, the route under it lights up, and the run line fills to scale.
 * Gwadar lies west along the coast, not on the trunk north, so the run
 * line only marks the stops on the chosen city's own way.
 *
 * The tiles hold still until the board is on screen, so the first flip is
 * one the reader sees.
 */
export default function LaneBoard() {
  const [at, setAt] = useState(START_AT);
  const [seen, setSeen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const lane = LANES[at];

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const hours = `${lane.hours[0]}-${lane.hours[1]}`;

  return (
    <div className="lb" ref={root}>
      <div className="lb-head">
        <span>
          <i className="dsp-led" aria-hidden="true" />
          Lane board
        </span>
        <span className="lb-from">From Port Qasim</span>
      </div>

      <div className="lb-rows" aria-live="polite">
        <div className="lb-cell lb-cell--dest">
          <span className="lb-label">Destination</span>
          <SplitFlap text={lane.board} width={10} play={seen} label={lane.city} />
        </div>
        <div className="lb-cell">
          <span className="lb-label">Km</span>
          <SplitFlap
            text={lane.km.toLocaleString("en-US")}
            width={5}
            play={seen}
            accentFrom={0}
            label={`${lane.km.toLocaleString("en-US")} kilometres`}
          />
        </div>
        <div className="lb-cell">
          <span className="lb-label">Hours</span>
          <SplitFlap
            text={hours}
            width={5}
            play={seen}
            accentFrom={0}
            label={`${lane.hours[0]} to ${lane.hours[1]} hours on the road`}
          />
        </div>
      </div>

      {/* The run to scale: Port Qasim on the left, Peshawar at the far
          end, the chosen city where its distance puts it, and the other
          stops on its way. */}
      <div className="lb-run" aria-hidden="true">
        <span className="lb-run-end">PQ</span>
        <span className="lb-run-track">
          <span className="lb-run-fill" style={{ width: `${(lane.km / MAX_KM) * 100}%` }}>
            <b />
          </span>
          {LANES.filter((l) => l.way === lane.way).map((l) => (
            <i key={l.city} style={{ left: `${(l.km / MAX_KM) * 100}%` }} data-on={l.km <= lane.km ? "" : undefined} />
          ))}
        </span>
      </div>

      <ol className="lb-roads" aria-label="Route">
        {lane.roads.map((road) => (
          <li key={road}>{road}</li>
        ))}
      </ol>

      <div className="lb-picks" role="group" aria-label="Choose a destination">
        {LANES.map((l, i) => (
          <button
            key={l.city}
            type="button"
            aria-pressed={i === at}
            onClick={() => {
              setSeen(true);
              setAt(i);
            }}
          >
            {l.city}
          </button>
        ))}
      </div>

      <p className="lb-note">
        Planning figures for a loaded tanker, road time only. Your lane is surveyed and confirmed in
        writing.
      </p>
    </div>
  );
}
