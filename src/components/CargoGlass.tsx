"use client";

import { gsap } from "gsap";
import { useEffect, useRef } from "react";

import type { CargoKind } from "@/lib/cargo";
import { GLASS, prefersReducedMotion } from "@/lib/motion";

/**
 * The sight glass: the cargo itself, not the vehicle, drawn in the site's
 * hex dots and behaving by its own physics.
 *
 *   edible oil      a thin pour, then free sloshing waves (low viscosity)
 *   molasses        a thick rope that coils as it lands, a slow heavy heap
 *   chemicals       a lively liquid, bubbles rising and popping, placarded
 *   finished goods  cartons dropping onto a pallet and stacking square
 *   dry cargo       grain pouring into a cone at its angle of repose, 27°
 *
 * Every simulation writes into one grid of cells, 0 for empty glass and
 * 1-5 for shades of the cargo; the grid is drawn as dots, one path per
 * shade, so a frame is six fills however busy it is. When `active`
 * changes the glass dumps: what's in it drops out through the bottom,
 * and the next cargo pours into the empty glass.
 *
 * Runs on GSAP's ticker, only while on screen. Reduced motion: each
 * cargo is simulated to rest off screen and drawn once, settled.
 */

const COLS = 64;
const ROWS = 36;
const SIZE = COLS * ROWS;

/* The gauge up the glass's right side, in columns: its ticks start
   GAUGE_TICK past the last column, its figures GAUGE_TEXT past the
   ticks, set at GAUGE_TYPE columns (9px at the least). GAUGE_SPAN is the
   drawing from the first column's left edge to where the figures start;
   GAUGE_PAD, in px, keeps it all clear of the pane's rounded rim. */
const GAUGE_TICK = 1;
const GAUGE_TEXT = 2.2;
const GAUGE_TYPE = 1.25;
const GAUGE_SPAN = COLS + GAUGE_TICK + GAUGE_TEXT + 0.5;
const GAUGE_PAD = 12;
const typeSize = (dx: number) => Math.max(9, dx * GAUGE_TYPE);
const at = (x: number, y: number) => y * COLS + x; // y counts up from the bottom

/* Shades: 1 body, 2 highlight, 3 shadow/detail, 4 accent, 5 bubble. */
const PALETTE: Record<CargoKind, string[]> = {
  "edible-oil": ["", "#e8a33d", "#ffd08a", "#b97c25", "#e8a33d", "#ffe7bd"],
  molasses: ["", "#b0602a", "#d98b4c", "#6f3716", "#e8a33d", "#d98b4c"],
  chemicals: ["", "#a9c9ee", "#eef6ff", "#6f95c8", "#e8a33d", "#f8fbff"],
  "finished-goods": ["", "#f8f1e4", "#ffffff", "#bfae8f", "#7483bd", "#ffffff"],
  "dry-cargo": ["", "#e2c48c", "#f5e0b5", "#b58f55", "#e8a33d", "#f5e0b5"],
};
const GLASS_DOT = "rgba(94,115,180,0.17)";

interface Sim {
  step(t: number): void;
  paint(grid: Uint8Array, t: number): void;
}

/* A cheap hash, for speckle that stays put from frame to frame. */
const hash = (x: number, y: number) => {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
};

/* ---- Liquids: a height field with waves ----------------------------- */

type LiquidOpts = {
  stiffness: number; // how hard the surface pulls itself flat: wave speed
  damping: number; // how fast motion dies: viscosity
  level: number; // rows it fills to
  pourRate: number; // cells per step while pouring
  pourWidth: number;
  slosh: number; // the road rocking it, once full
  coil?: number; // columns the landing stream swings: rope coiling
  bubbles?: boolean;
  placard?: boolean;
};

function liquid(o: LiquidOpts): Sim {
  const h = new Float32Array(COLS);
  const v = new Float32Array(COLS);
  const cx = Math.floor(COLS * 0.42);
  let poured = 0;
  const total = o.level * COLS;
  const bubbles: { x: number; y: number; s: number }[] = [];
  let pourX = cx;

  return {
    step(t) {
      const pouring = poured < total;
      if (pouring) {
        pourX = cx + (o.coil ? Math.round(Math.sin(t * GLASS.coilRate) * o.coil) : 0);
        const w = o.pourWidth;
        for (let i = 0; i < w; i++) {
          const x = Math.min(COLS - 1, Math.max(0, pourX - (w >> 1) + i));
          h[x] += o.pourRate / w;
        }
        poured += o.pourRate;
      }
      /* The surface: each column pulled toward its neighbours' mean. */
      for (let x = 0; x < COLS; x++) {
        const l = h[x > 0 ? x - 1 : x];
        const r = h[x < COLS - 1 ? x + 1 : x];
        v[x] += ((l + r) / 2 - h[x]) * o.stiffness;
        /* Rocking: a tilt that comes and goes, as the road moves under it. */
        if (!pouring) v[x] += Math.sin(t * GLASS.sloshRate) * o.slosh * ((x - COLS / 2) / COLS);
        v[x] *= o.damping;
      }
      for (let x = 0; x < COLS; x++) h[x] = Math.max(0, h[x] + v[x]);

      if (o.bubbles && poured > total * 0.4) {
        if (Math.random() < GLASS.bubbleRate) bubbles.push({ x: 2 + Math.floor(Math.random() * (COLS - 4)), y: 0, s: 0.12 + Math.random() * 0.18 });
        for (let i = bubbles.length - 1; i >= 0; i--) {
          const b = bubbles[i];
          b.y += b.s;
          if (b.y >= h[b.x] - 1) {
            v[b.x] += 0.35; // the pop kicks the surface
            bubbles.splice(i, 1);
          }
        }
      }
    },
    paint(g, t) {
      for (let x = 0; x < COLS; x++) {
        const top = Math.min(ROWS, Math.round(h[x]));
        for (let y = 0; y < top; y++) g[at(x, y)] = y === top - 1 ? 2 : hash(x, y) < 0.08 ? 3 : 1;
      }
      for (const b of bubbles) {
        const y = Math.round(b.y);
        if (y < ROWS) g[at(b.x, y)] = 5;
      }
      /* The stream, from the top of the glass down to the surface. For a
         coiling rope it swings more the nearer it gets to landing. */
      if (poured < total) {
        for (let y = ROWS - 1; y >= 0; y--) {
          const fromTop = (ROWS - 1 - y) / ROWS;
          const swing = o.coil ? Math.round(Math.sin(t * GLASS.coilRate - y * 0.35) * o.coil * fromTop * fromTop) : 0;
          const x0 = cx + swing - (o.pourWidth >> 1);
          if (y < h[Math.min(COLS - 1, Math.max(0, cx + swing))]) break;
          for (let i = 0; i < o.pourWidth; i++) {
            const x = x0 + i;
            if (x >= 0 && x < COLS) g[at(x, y)] = i === 0 ? 2 : 1;
          }
        }
      }
      if (o.placard) placard(g);
    },
  };
}

/* A hazard diamond on the glass, top left. */
function placard(g: Uint8Array) {
  const cx = 7;
  const cy = ROWS - 8;
  const r = 5;
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      const d = Math.abs(x - cx) + Math.abs(y - cy);
      if (d === r || (d === 2 && y === cy)) g[at(x, y)] = 4;
    }
  }
}

/* ---- Cartons: dropped onto a pallet, stacked square ----------------- */

function cartons(): Sim {
  const W = 9;
  const H = 6;
  const across = 6;
  const tiers = 3;
  const base = 2; // the pallet
  const left = Math.floor((COLS - across * (W + 1) + 1) / 2);
  /* Placed bottom tier first, in a shuffled order within each tier. */
  const order: { col: number; tier: number }[] = [];
  for (let tier = 0; tier < tiers; tier++) {
    const row = Array.from({ length: across }, (_, col) => ({ col, tier }));
    row.sort(() => Math.random() - 0.5);
    order.push(...row);
  }
  const boxes: { col: number; tier: number; y: number; v: number; landed: boolean }[] = [];
  let next = 0;

  return {
    step() {
      const falling = boxes.findLast((b) => !b.landed);
      if (next < order.length && (!falling || falling.y < ROWS * 0.8)) {
        boxes.push({ ...order[next++], y: ROWS, v: 0, landed: false });
      }
      for (const b of boxes) {
        if (b.landed) continue;
        const rest = base + b.tier * (H + 1); // a row of air between tiers
        b.v += GLASS.gravity;
        b.y -= b.v;
        if (b.y <= rest) {
          b.y = rest;
          b.landed = true;
        }
      }
    },
    paint(g) {
      /* The pallet: slats along the bottom. */
      for (let x = left; x < left + across * (W + 1) - 1; x++) {
        g[at(x, 1)] = 4;
        if ((x - left) % 9 < 2) g[at(x, 0)] = 4;
      }
      for (const b of boxes) {
        const x0 = left + b.col * (W + 1);
        const y0 = Math.round(b.y);
        for (let y = y0; y < y0 + H; y++) {
          if (y < 0 || y >= ROWS) continue;
          for (let x = x0; x < x0 + W; x++) {
            const tape = x === x0 + (W >> 1) && y >= y0 + H - 2;
            g[at(x, y)] = tape ? 3 : y === y0 + H - 1 ? 2 : 1;
          }
        }
      }
    },
  };
}

/* ---- Grain: pours and piles at its angle of repose ------------------ */

/* A column may stand at most RISE cells above the one SPAN along from
   it: 3 in 5 across a hex grid (rows are 0.866 of a column apart) is a
   slope of 27.5°, wheat's angle of repose. */
const SPAN = 5;
const RISE = 3;
const REPOSE_DEG = Math.round((Math.atan((RISE / SPAN) * 0.866) * 180) / Math.PI);

function grain(): Sim {
  const h = new Int16Array(COLS);
  const cx = Math.floor(COLS / 2);
  const falling: { x: number; y: number; v: number }[] = [];
  let poured = 0;
  const total = GLASS.grainTotal;

  const relax = () => {
    for (let pass = 0; pass < 6; pass++) {
      let moved = false;
      for (let i = 0; i < COLS; i++) {
        const x = pass % 2 ? i : COLS - 1 - i;
        for (const d of [-1, 1]) {
          const far = x + d * SPAN;
          const near = x + d;
          if (near < 0 || near >= COLS) continue;
          const steep = far >= 0 && far < COLS && h[x] - h[far] > RISE;
          if ((steep || h[x] - h[near] > 1) && h[x] > h[near]) {
            h[x]--;
            h[near]++;
            moved = true;
          }
        }
      }
      if (!moved) break;
    }
  };

  return {
    step() {
      if (poured < total) {
        for (let i = 0; i < GLASS.grainRate; i++) {
          falling.push({ x: cx + Math.round((Math.random() - 0.5) * 2), y: ROWS - 1 - Math.random() * 3, v: 0 });
          poured++;
        }
      }
      for (let i = falling.length - 1; i >= 0; i--) {
        const p = falling[i];
        p.v += GLASS.gravity;
        p.y -= p.v;
        if (p.y <= h[p.x]) {
          h[p.x]++;
          falling.splice(i, 1);
        }
      }
      relax();
    },
    paint(g) {
      for (let x = 0; x < COLS; x++) {
        const top = Math.min(ROWS, h[x]);
        for (let y = 0; y < top; y++) {
          const r = hash(x, y);
          g[at(x, y)] = r < 0.18 ? 3 : r > 0.86 ? 2 : 1;
        }
      }
      for (const p of falling) {
        const y = Math.round(p.y);
        if (y >= 0 && y < ROWS) g[at(p.x, y)] = 2;
      }
    },
  };
}

const MAKE: Record<CargoKind, () => Sim> = {
  "edible-oil": () =>
    liquid({ stiffness: 0.32, damping: 0.99, level: 15, pourRate: 7, pourWidth: 1, slosh: 0.008 }),
  molasses: () =>
    liquid({ stiffness: 0.3, damping: 0.72, level: 13, pourRate: 5, pourWidth: 3, slosh: 0.001, coil: 4 }),
  chemicals: () =>
    liquid({ stiffness: 0.26, damping: 0.97, level: 14, pourRate: 7, pourWidth: 2, slosh: 0.004, bubbles: true, placard: true }),
  "finished-goods": cartons,
  "dry-cargo": grain,
};

export default function CargoGlass({ kind, className }: { kind: CargoKind; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const kindRef = useRef(kind);
  const api = useRef<{ swap: (k: CargoKind) => void } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const reduced = prefersReducedMotion();
    /* Canvas text can't read CSS variables; take the resolved face. */
    const font = getComputedStyle(canvas).fontFamily || "monospace";

    let current = kindRef.current;
    let sim = MAKE[current]();
    let simTime = 0;
    let acc = 0;
    let last = performance.now() / 1000;
    const grid = new Uint8Array(SIZE);
    /* The dump: the old contents, dropping out of the bottom. */
    let dump: { grid: Uint8Array; kind: CargoKind; t0: number } | null = null;

    const settle = (s: Sim) => {
      for (let i = 0; i < GLASS.settleSteps; i++) {
        simTime += GLASS.step;
        s.step(simTime);
      }
    };
    if (reduced) settle(sim);

    /* ---- Geometry ------------------------------------------------- */
    let cw = 0;
    let ch = 0;
    let dx = 0;
    let dy = 0;
    let ox = 0;
    let oy = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      /* Hidden, a canvas measures 0 x 0: leave /services and its page is
         kept but not shown. The sums below then go negative, and so does
         the dots' radius -- which arc() rejects with an error. Nothing can
         be seen, so nothing is drawn; the observer measures it again when
         it is shown. */
      if (w < 1 || h < 1) return;
      cw = w;
      ch = h;
      canvas.width = Math.round(cw * dpr);
      canvas.height = Math.round(ch * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      /* The glass and its gauge share the width. From the first column's
         left edge (half a column before its centre) to the widest figure's
         end, the drawing is GAUGE_SPAN columns plus that figure. The figure
         is set at a size that follows the columns but never drops below
         9px, so it is measured in the gauge's own face -- a wide one --
         rather than given a fixed allowance it can outgrow. */
      ctx.font = `100px ${font}`;
      const perPx = ctx.measureText("100").width / 100;
      const room = cw - GAUGE_PAD * 2;
      /* Whichever holds: the figure at its 9px floor, or following the
         columns. */
      const byWidth = Math.min(
        (room - 9 * perPx) / GAUGE_SPAN,
        room / (GAUGE_SPAN + GAUGE_TYPE * perPx)
      );
      dx = Math.min(byWidth, (ch - 16) / (ROWS * 0.866));
      dy = dx * 0.866;
      const span = dx * GAUGE_SPAN + typeSize(dx) * perPx;
      ox = (cw - span) / 2 + dx / 2;
      oy = (ch - dy * ROWS) / 2 + dy * (ROWS - 0.5); // the bottom row's centre
      /* The grain's angle label is set in the gauge's type. Resizing the
         canvas resets its context, so this is set again each time. */
      ctx.font = `${typeSize(dx)}px ${font}`;
      ctx.textBaseline = "middle";
      paintGlass(dpr);
      draw();
    };

    const px = (x: number, y: number) => ox + x * dx + (y % 2 ? dx / 2 : 0);
    const py = (y: number) => oy - y * dy;

    const drawGrid = (g: Uint8Array, palette: string[], drop = 0) => {
      const r = dx * 0.34;
      for (let shade = 1; shade <= 5; shade++) {
        ctx.beginPath();
        for (let y = 0; y < ROWS; y++) {
          for (let x = 0; x < COLS; x++) {
            if (g[at(x, y)] !== shade) continue;
            const yy = py(y) + drop;
            if (yy - r > oy + dy / 2) continue; // gone through the bottom
            ctx.moveTo(px(x, y) + r, yy);
            ctx.arc(px(x, y), yy, r, 0, Math.PI * 2);
          }
        }
        ctx.fillStyle = palette[shade];
        ctx.fill();
      }
    };

    /* The empty glass and its gauge never change between frames -- 2,304
       dots and five marks -- so they are drawn once per size, off screen,
       and each frame copies them in with one drawImage. */
    const bg = document.createElement("canvas");
    const paintGlass = (dpr: number) => {
      bg.width = canvas.width;
      bg.height = canvas.height;
      const b = bg.getContext("2d")!;
      b.setTransform(dpr, 0, 0, dpr, 0, 0);
      /* The empty glass. */
      const r = dx * 0.34;
      b.beginPath();
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          b.moveTo(px(x, y) + r * 0.7, py(y));
          b.arc(px(x, y), py(y), r * 0.7, 0, Math.PI * 2);
        }
      }
      b.fillStyle = GLASS_DOT;
      b.fill();

      /* Level marks up the right-hand side, as on a gauge glass. */
      b.fillStyle = "rgba(216,227,255,0.5)";
      b.font = `${typeSize(dx)}px ${font}`;
      b.textBaseline = "middle";
      const gx = ox + dx * (COLS + GAUGE_TICK);
      for (let i = 0; i <= 4; i++) {
        const y = py((ROWS - 1) * (i / 4));
        b.fillRect(gx, y - 0.5, i % 2 ? dx * 0.9 : dx * 1.6, 1);
        if (i % 2 === 0) b.fillText(String(i * 25), gx + dx * GAUGE_TEXT, y);
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(bg, 0, 0, cw, ch);

      if (dump) {
        const t = performance.now() / 1000 - dump.t0;
        drawGrid(dump.grid, PALETTE[dump.kind], 0.5 * GLASS.dumpFall * t * t * dy);
        if (reduced || t > GLASS.dump) dump = null;
        else return;
      }

      grid.fill(0);
      sim.paint(grid, simTime);
      drawGrid(grid, PALETTE[current]);

      /* The grain's angle, marked at the toe of its right flank. */
      if (current === "dry-cargo") {
        let toe = -1;
        for (let x = COLS - 1; x >= 0; x--) {
          if (grid[at(x, 0)] === 1 || grid[at(x, 0)] === 2 || grid[at(x, 0)] === 3) {
            toe = x;
            break;
          }
        }
        if (toe > COLS / 2 + 8) {
          const vx = px(toe, 0) + dx;
          const vy = py(0) + dy * 0.7;
          const len = dx * 10;
          const a = (REPOSE_DEG * Math.PI) / 180;
          ctx.strokeStyle = "rgba(232,163,61,0.95)";
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(vx, vy);
          ctx.lineTo(vx - len * 1.4, vy);
          ctx.moveTo(vx, vy);
          ctx.lineTo(vx - len * 1.4 * Math.cos(a), vy - len * 1.4 * Math.sin(a));
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.arc(vx, vy, len * 0.7, Math.PI, Math.PI + a);
          ctx.stroke();
          ctx.fillStyle = "#e8a33d";
          ctx.textAlign = "left";
          ctx.fillText(`${REPOSE_DEG}°`, vx + dx * 0.8, vy - dy * 2.4);
        }
      }
    };

    /* ---- The clock: fixed steps, so the physics is the same at any
       frame rate. -------------------------------------------------- */
    const tick = () => {
      const now = performance.now() / 1000;
      acc = Math.min(acc + (now - last), GLASS.step * 8);
      last = now;
      if (!dump) {
        while (acc >= GLASS.step) {
          simTime += GLASS.step;
          sim.step(simTime);
          acc -= GLASS.step;
        }
      } else acc = 0;
      draw();
    };

    api.current = {
      swap(k) {
        if (k === current) return;
        grid.fill(0);
        sim.paint(grid, simTime);
        dump = { grid: grid.slice(), kind: current, t0: performance.now() / 1000 };
        current = k;
        sim = MAKE[k]();
        simTime = 0;
        if (reduced) {
          settle(sim);
          dump = null;
        }
        draw();
      },
    };

    let running = false;
    const io = new IntersectionObserver(([e]) => {
      if (reduced) return;
      if (e.isIntersecting && !running) {
        last = performance.now() / 1000;
        gsap.ticker.add(tick);
        running = true;
      } else if (!e.isIntersecting && running) {
        gsap.ticker.remove(tick);
        running = false;
      }
    });
    io.observe(canvas);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    /* The gauge is measured and drawn in the page's face; if that is
       still loading now, both happen again once it has. */
    let live = true;
    document.fonts?.ready.then(() => live && resize());

    return () => {
      live = false;
      io.disconnect();
      ro.disconnect();
      gsap.ticker.remove(tick);
      api.current = null;
    };
  }, []);

  useEffect(() => {
    kindRef.current = kind;
    api.current?.swap(kind);
  }, [kind]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
