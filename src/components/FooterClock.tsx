"use client";

import { useEffect, useRef, useState } from "react";

import SplitFlap from "./SplitFlap";

/**
 * Karachi's time on a split-flap board: the hours and minutes flip over
 * as they change, and a hairline under them fills across each minute.
 * Beside it, today's sun over Karachi: its height through the day,
 * worked out from the city's position, with a dot where it is now and
 * the times it rises and sets. The board spins up the first time it
 * comes into view. Rendered blank on the server (the time there is not
 * the visitor's time) and set on the first frame in the browser.
 */

const ZONE = "Asia/Karachi";
const LAT = 24.86;
const LON = 67.01;
const UTC_OFFSET = 5; // Pakistan keeps no summer time

/* ---- The sun --------------------------------------------------------- */

const RAD = Math.PI / 180;
/* The sun's height above the horizon at Karachi, in degrees, at a moment
   in time: the low-precision solar position (good to a fraction of a
   degree, far finer than the chart can show). */
function sunHeight(ms: number) {
  const n = ms / 86400000 + 2440587.5 - 2451545;
  const L = 280.46 + 0.9856474 * n;
  const g = (357.528 + 0.9856003 * n) * RAD;
  const lambda = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * RAD;
  const eps = (23.439 - 0.0000004 * n) * RAD;
  const ra = Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda));
  const dec = Math.asin(Math.sin(eps) * Math.sin(lambda));
  const gmst = 18.697374558 + 24.06570982441908 * n;
  const ha = ((gmst * 15 + LON) * RAD - ra);
  const lat = LAT * RAD;
  return Math.asin(Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(ha)) / RAD;
}

/* The chart's own units. */
const SUN_W = 240;
const SUN_H = 48;
const HORIZON = SUN_H * 0.58;
const PER_DEG = (SUN_H * 0.5) / 90;
/* The sun counts as up once its upper edge clears the horizon, with the
   air's bending of the light: -0.833 degrees. */
const RISEN = -0.833;

type Sun = { path: string; now: { x: number; y: number; up: boolean }; rise: string; set: string };

const hhmm = (h: number) => {
  const m = Math.round(h * 60);
  return `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};

function sunToday(): Sun {
  const now = Date.now();
  /* Karachi's midnight today, as a moment. */
  const local = new Date(now + UTC_OFFSET * 3600000);
  const midnight = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - UTC_OFFSET * 3600000;
  const STEPS = 96;
  const heights = Array.from({ length: STEPS + 1 }, (_, i) => sunHeight(midnight + (i / STEPS) * 86400000));
  const at = (i: number) => ({ x: (i / STEPS) * SUN_W, y: HORIZON - heights[i] * PER_DEG });
  const path = heights.map((_, i) => `${i ? "L" : "M"}${at(i).x.toFixed(1)} ${at(i).y.toFixed(1)}`).join("");
  let rise = "";
  let set = "";
  for (let i = 0; i < STEPS; i++) {
    const a = heights[i] - RISEN;
    const b = heights[i + 1] - RISEN;
    if (a < 0 && b >= 0) rise = hhmm(((i + a / (a - b)) / STEPS) * 24);
    if (a >= 0 && b < 0) set = hhmm(((i + a / (a - b)) / STEPS) * 24);
  }
  const t = (now - midnight) / 86400000;
  const h = sunHeight(now);
  return { path, now: { x: t * SUN_W, y: HORIZON - h * PER_DEG, up: h > RISEN }, rise, set };
}

const read = () => {
  const now = new Date();
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: ZONE,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      weekday: "short",
      day: "2-digit",
      month: "short",
      hourCycle: "h23",
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value])
  );
  return {
    hm: `${parts.hour}:${parts.minute}`,
    s: Number(parts.second),
    day: `${parts.weekday} ${parts.day} ${parts.month}`.toUpperCase(),
  };
};

/* `bar` is the second the current minute was first seen at, which is where
   its hairline starts filling from. */
type Clock = { time: ReturnType<typeof read>; sun: Sun; bar: number };

export default function FooterClock() {
  const ref = useRef<HTMLDivElement>(null);
  const [clock, setClock] = useState<Clock | null>(null);
  const [seen, setSeen] = useState(false);
  const time = clock?.time;
  const sun = clock?.sun;

  /* Ticks on the second, so the minute turns over when it does -- and
     only while the clock is on screen: every tick is a render, and nobody
     reads a clock at the bottom of the page from the top of it. It reads
     the time afresh each time it comes back into view (the board flips
     over to it), and the sun moves on with the minute. */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let timer = 0;
    const tick = () => {
      const now = read();
      setClock((prev) =>
        prev && prev.time.hm === now.hm
          ? { time: now, sun: prev.sun, bar: prev.bar }
          : { time: now, sun: sunToday(), bar: now.s }
      );
      timer = window.setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
    };
    const io = new IntersectionObserver(([e]) => {
      window.clearTimeout(timer);
      if (!e.isIntersecting) return;
      tick();
      setSeen(true);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div className="zf-clock" ref={ref}>
      <p className="zf-clock-head">
        <span>Local time</span>
        <span>Karachi · PKT</span>
      </p>
      <div className="zf-clock-row">
        <SplitFlap
          text={time?.hm ?? "--:--"}
          width={5}
          play={seen && !!time}
          className="zf-clock-flaps"
          label={time ? `${time.hm} in Karachi` : "Karachi time"}
        />
        <figure
          className="zf-sun"
          aria-label={sun ? `The sun over Karachi today: up at ${sun.rise}, down at ${sun.set}` : undefined}
        >
          <svg viewBox={`0 0 ${SUN_W} ${SUN_H}`} aria-hidden="true">
            <defs>
              <clipPath id="zf-sky">
                <rect x="0" y="-20" width={SUN_W} height={HORIZON + 20} />
              </clipPath>
            </defs>
            {sun && (
              <>
                <path className="zf-sun-night" d={sun.path} />
                <path className="zf-sun-day" d={sun.path} clipPath="url(#zf-sky)" />
                <circle className={`zf-sun-dot ${sun.now.up ? "" : "zf-sun-dot--down"}`} cx={sun.now.x} cy={sun.now.y} r="4" />
              </>
            )}
            <path className="zf-sun-horizon" d={`M0 ${HORIZON} H${SUN_W}`} />
          </svg>
          <figcaption>
            <span>Sunrise {sun?.rise ?? "--:--"}</span>
            <span>Sunset {sun?.set ?? "--:--"}</span>
          </figcaption>
        </figure>
      </div>
      <span
        className="zf-clock-minute"
        aria-hidden="true"
        /* One animation a minute, started part-way in if the minute was
           already under way, and remounted as the minute turns: not a
           transition restarted every second, which costs a new layer and a
           commit each time for a two-pixel line. */
        key={time?.hm}
        style={{ "--from": clock?.bar ?? 0 } as React.CSSProperties}
      />
      <p className="zf-clock-foot">
        <span className="zf-clock-sec">:{String(time?.s ?? 0).padStart(2, "0")}</span>
        <span>{time?.day ?? " "}</span>
        <span>24.86° N · 67.01° E</span>
      </p>
    </div>
  );
}
