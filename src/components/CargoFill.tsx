"use client";

import type { SpringValue } from "@react-spring/web";
import { gsap } from "gsap";
import { useEffect, useId, useRef } from "react";

import type { CargoKind } from "@/lib/cargo";
import { scrollMotion, watchScroll } from "@/lib/liquid";
import { TANK, prefersReducedMotion } from "@/lib/motion";

/**
 * The cargo in a cover flow card, filling its foot.
 *
 *   edible oil      lively, quick to slosh and slow to settle
 *   molasses        heavy: waves crawl and die almost at once
 *   chemicals       lively, with bubbles that kick the surface as they pop
 *   finished goods  cartons, dropped onto a pallet when the card comes up
 *   dry cargo       a heap of grain that pours up when the card comes up
 *
 * The liquids are the sight glass's physics (CargoGlass) in miniature: a
 * height field of a few dozen columns, each pulled toward its
 * neighbours. What rocks them is shared: the cover flow's own motion --
 * flick the row and every card's load piles up against the far wall --
 * the page's scroll (lib/liquid.ts), and a pointer drawn through the
 * surface. One ticker steps every card (useTankSlosh), only while the
 * cover flow is on screen.
 */

type Liquid = { stiffness: number; damping: number; bubbles?: boolean };
const LIQUID: Partial<Record<CargoKind, Liquid>> = {
  "edible-oil": { stiffness: 0.3, damping: 0.985 },
  molasses: { stiffness: 0.12, damping: 0.95 },
  chemicals: { stiffness: 0.28, damping: 0.975, bubbles: true },
};

/* body top, body foot, surface, dot */
const COLOURS: Record<CargoKind, [string, string, string, string]> = {
  "edible-oil": ["#f0b04e", "#cf8527", "#ffe7bd", "rgba(140, 80, 16, 0.3)"],
  molasses: ["#b0602a", "#5e2c12", "#e0995a", "rgba(30, 10, 2, 0.32)"],
  chemicals: ["#2e5fff", "#0b2a93", "#b9d4ff", "rgba(216, 227, 255, 0.22)"],
  "finished-goods": ["#cda872", "#a6834c", "#e6cf9f", "rgba(90, 60, 20, 0.3)"],
  "dry-cargo": ["#e6c890", "#bb925a", "#f5e0b5", "rgba(110, 76, 34, 0.38)"],
};

const PITCH = 7; // the dot texture, CSS px

type Tank = {
  kind: CargoKind;
  el: HTMLDivElement;
  resize(): void;
  push(carousel: number, scroll: number): void;
  step(t: number): void;
  draw(): void;
  splash(): void;
  poke(x: number, y: number, dy: number): void;
};

const tanks = new Set<Tank>();

function makeTank(kind: CargoKind, el: HTMLDivElement): Tank {
  const svg = el.querySelector("svg")!;
  const body = el.querySelectorAll<SVGPathElement>(".cargo-fill-body");
  const lip = el.querySelector<SVGPathElement>(".cargo-fill-lip");
  const bubbleEls = Array.from(el.querySelectorAll<SVGCircleElement>(".cargo-fill-bubble"));
  const heap = el.querySelectorAll<SVGPathElement>(".cargo-fill-heap-shape");
  const opts = LIQUID[kind];
  const N = TANK.columns;
  const h = new Float32Array(N);
  const v = new Float32Array(N);
  const bubbles = bubbleEls.map(() => ({ on: false, x: 0, y: 0, s: 0 }));
  let w = 1;
  let H = 1;
  let base = 0;

  const side = (i: number) => (i / (N - 1)) * 2 - 1;
  const colAt = (x: number) => Math.max(0, Math.min(N - 1, Math.round((x / w) * (N - 1))));

  const tank: Tank = {
    kind,
    el,
    resize() {
      w = el.clientWidth || 1;
      H = el.clientHeight || 1;
      base = H * TANK.level;
      svg.setAttribute("viewBox", `0 0 ${w} ${H}`);
      /* The heap in the box's own pixels, so its grain stays round. */
      if (heap.length) {
        const pk = H * 0.16;
        const d = `M${w * 0.03} ${H} C${w * 0.2} ${H} ${w * 0.33} ${pk + H * 0.05} ${w * 0.5} ${pk} C${w * 0.67} ${pk + H * 0.05} ${w * 0.8} ${H} ${w * 0.97} ${H}Z`;
        heap.forEach((p) => p.setAttribute("d", d));
      }
      tank.draw();
    },
    push(carousel, scroll) {
      if (!opts) return;
      for (let i = 0; i < N; i++) v[i] += side(i) * (carousel * TANK.carouselGain + scroll * TANK.scrollGain);
    },
    step(t) {
      if (!opts) return;
      const rock = Math.sin(t * 1.6) * TANK.idle;
      for (let i = 0; i < N; i++) {
        const l = h[i > 0 ? i - 1 : i];
        const r = h[i < N - 1 ? i + 1 : i];
        v[i] += ((l + r) / 2 - h[i]) * opts.stiffness + rock * side(i) - h[i] * TANK.restore;
        v[i] *= opts.damping;
      }
      for (let i = 0; i < N; i++) h[i] = Math.max(-base * 0.9, Math.min(H - base - 2, h[i] + v[i]));

      if (opts.bubbles) {
        const free = bubbles.find((b) => !b.on);
        if (free && Math.random() < TANK.bubbleRate) {
          free.on = true;
          free.x = w * (0.08 + Math.random() * 0.84);
          free.y = H + 4;
          free.s = TANK.bubbleRise[0] + Math.random() * (TANK.bubbleRise[1] - TANK.bubbleRise[0]);
        }
        for (const b of bubbles) {
          if (!b.on) continue;
          b.y -= b.s;
          const i = colAt(b.x);
          if (b.y <= base + h[i] + 2) {
            b.on = false;
            v[i] += 0.9; // the pop kicks the surface
          }
        }
      }
    },
    draw() {
      if (!opts) return;
      /* A smooth curve through the columns: quadratic segments between
         their midpoints. */
      const x = (i: number) => (i / (N - 1)) * w;
      const y = (i: number) => base + h[i];
      let d = `M0 ${y(0).toFixed(1)}`;
      for (let i = 1; i < N - 1; i++) {
        const mx = (x(i) + x(i + 1)) / 2;
        const my = (y(i) + y(i + 1)) / 2;
        d += ` Q${x(i).toFixed(1)} ${y(i).toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
      }
      d += ` L${w} ${y(N - 1).toFixed(1)}`;
      const fill = `${d} L${w} ${H} L0 ${H}Z`;
      body.forEach((p) => p.setAttribute("d", fill));
      lip?.setAttribute("d", d);
      bubbles.forEach((b, i) => {
        const c = bubbleEls[i];
        c.setAttribute("cx", b.x.toFixed(1));
        c.setAttribute("cy", b.y.toFixed(1));
        c.style.opacity = b.on ? "1" : "0";
      });
    },
    splash() {
      if (!opts) return;
      const mid = N >> 1;
      for (let i = mid - 2; i <= mid + 2; i++) v[i] += TANK.splash;
    },
    poke(px, py, dy) {
      if (!opts) return;
      const i = colAt(px);
      if (Math.abs(py - (base + h[i])) > 28) return;
      for (let k = -1; k <= 1; k++) {
        const j = i + k;
        if (j >= 0 && j < N) v[j] += dy * TANK.poke * (k === 0 ? 1 : 0.5);
      }
    },
  };
  return tank;
}

/**
 * One ticker for every card's load, rocked by the cover flow's position
 * spring. Runs only while `root` is on screen.
 */
export function useTankSlosh(pos: SpringValue<number>, root: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      tanks.forEach((t) => t.draw());
      return;
    }
    const stopWatch = watchScroll();
    let lastPos = pos.get();
    let lastVel = 0;
    let acc = 0;
    let last = -1;
    let time = 0;
    const tick = (t: number) => {
      const dt = last < 0 ? TANK.step : Math.min(0.1, t - last);
      last = t;
      /* The row's acceleration, in cards per frame². */
      const p = pos.get();
      const vel = p - lastPos;
      const carousel = vel - lastVel;
      lastPos = p;
      lastVel = vel;
      const scroll = scrollMotion().a;
      tanks.forEach((k) => k.push(carousel, scroll * dt));
      acc += dt;
      while (acc >= TANK.step) {
        time += TANK.step;
        tanks.forEach((k) => k.step(time));
        acc -= TANK.step;
      }
      tanks.forEach((k) => k.draw());
    };
    let running = false;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !running) {
        last = -1;
        lastPos = pos.get();
        lastVel = 0;
        gsap.ticker.add(tick);
        running = true;
      } else if (!e.isIntersecting && running) {
        gsap.ticker.remove(tick);
        running = false;
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      gsap.ticker.remove(tick);
      stopWatch();
    };
  }, [pos, root]);
}

/* Cartons in two courses, brick-laid: [x, y, w, h] as fractions of the
   fill's box, bottom course first. */
const CARTONS: [number, number, number, number][] = [
  [0.06, 0.66, 0.21, 0.27],
  [0.285, 0.66, 0.21, 0.27],
  [0.51, 0.66, 0.21, 0.27],
  [0.735, 0.66, 0.21, 0.27],
  [0.17, 0.375, 0.21, 0.27],
  [0.395, 0.375, 0.21, 0.27],
  [0.62, 0.375, 0.21, 0.27],
];

export default function CargoFill({ kind, active }: { kind: CargoKind; active: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const tank = useRef<Tank | null>(null);
  const uid = useId().replace(/[^\w-]/g, "");
  const [top, foot, surface, speck] = COLOURS[kind];
  const liquid = !!LIQUID[kind];

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const t = makeTank(kind, el);
    tank.current = t;
    tanks.add(t);
    const ro = new ResizeObserver(() => t.resize());
    ro.observe(el);
    t.resize();
    return () => {
      ro.disconnect();
      tanks.delete(t);
      tank.current = null;
    };
  }, [kind]);

  /* Brought forward: a splash, as if it had just been poured. */
  const wasActive = useRef(active);
  useEffect(() => {
    if (active && !wasActive.current) tank.current?.splash();
    wasActive.current = active;
  }, [active]);

  /* A finger or a pointer drawn through the surface pushes it. */
  const lastY = useRef<number | null>(null);
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || !liquid) return;
    const r = el.getBoundingClientRect();
    const y = e.clientY - r.top;
    const dy = lastY.current === null ? 0 : y - lastY.current;
    lastY.current = y;
    tank.current?.poke(((e.clientX - r.left) / r.width) * el.clientWidth, (y / r.height) * el.clientHeight, dy);
  };

  return (
    <div
      className="cargo-fill"
      data-kind={kind}
      data-active={active ? "" : undefined}
      ref={ref}
      aria-hidden="true"
      onPointerMove={onPointerMove}
      onPointerLeave={() => (lastY.current = null)}
    >
      <svg preserveAspectRatio="none">
        <defs>
          <linearGradient id={`${uid}-g`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={top} />
            <stop offset="1" stopColor={foot} />
          </linearGradient>
          {/* The map's hex grid, at card scale. */}
          <pattern id={`${uid}-d`} width={PITCH} height={PITCH * 1.732} patternUnits="userSpaceOnUse">
            <circle cx={PITCH / 2} cy={PITCH * 0.433} r={PITCH * 0.3} fill={speck} />
            <circle cx={0} cy={PITCH * 1.299} r={PITCH * 0.3} fill={speck} />
            <circle cx={PITCH} cy={PITCH * 1.299} r={PITCH * 0.3} fill={speck} />
          </pattern>
        </defs>

        {liquid && (
          <>
            <path className="cargo-fill-body" fill={`url(#${uid}-g)`} />
            <path className="cargo-fill-body" fill={`url(#${uid}-d)`} />
            {LIQUID[kind]?.bubbles &&
              Array.from({ length: 7 }, (_, i) => (
                <circle key={i} className="cargo-fill-bubble" r="2.6" fill={surface} style={{ opacity: 0 }} />
              ))}
            <path className="cargo-fill-lip" fill="none" stroke={surface} />
          </>
        )}

        {kind === "finished-goods" && (
          <g className="cargo-fill-stack">
            <rect className="cargo-fill-pallet" x="3%" y="93%" width="94%" height="7%" />
            {CARTONS.map(([x, y, w, h], i) => (
              <g key={i} className="cargo-fill-carton" style={{ "--i": i } as React.CSSProperties}>
                <rect x={`${x * 100}%`} y={`${y * 100}%`} width={`${w * 100}%`} height={`${h * 100}%`} rx="2" fill={`url(#${uid}-g)`} />
                <rect x={`${x * 100}%`} y={`${y * 100}%`} width={`${w * 100}%`} height={`${h * 100}%`} rx="2" fill={`url(#${uid}-d)`} />
                <rect x={`${(x + w / 2 - 0.012) * 100}%`} y={`${y * 100}%`} width="2.4%" height={`${h * 100}%`} fill={surface} />
              </g>
            ))}
          </g>
        )}

        {kind === "dry-cargo" && (
          <g className="cargo-fill-heap">
            <path className="cargo-fill-heap-shape" fill={`url(#${uid}-g)`} />
            <path className="cargo-fill-heap-shape" fill={`url(#${uid}-d)`} />
          </g>
        )}
      </svg>
    </div>
  );
}
