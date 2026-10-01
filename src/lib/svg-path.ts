/**
 * Shorter path data for the server-rendered maps.
 *
 * The map's paths arrive as absolute coordinates to one decimal place --
 * "C513.5 293.2 515.0 293.1 515.9 292.3" -- and the page carries every one
 * twice: once as HTML, once in React's payload for the same markup. Written
 * relative to the pen, the same curve is "c.5-.2 2-.3 2.9-1.1": small
 * deltas, no repeated command letters, no leading zeros. The drawing is
 * identical to the tenth -- the arithmetic is done in whole tenths, so no
 * rounding creeps in along a long road -- and so is every path's length,
 * which the draw-on animations measure.
 *
 * Server only: it runs as the page is built, never in the browser.
 */

const TOKEN = /[MLCZmlcz]|-?\d*\.?\d+/g;

/* A number of tenths, as short as SVG allows: 0.5 -> ".5", 2.0 -> "2". */
function num(tenths: number) {
  const sign = tenths < 0 ? "-" : "";
  const a = Math.abs(tenths);
  const whole = Math.floor(a / 10);
  const frac = a % 10;
  if (!frac) return sign + whole;
  return sign + (whole ? whole : "") + "." + frac;
}

/* Joins numbers with a separator only where the parser needs one: a
   minus sign starts a new number by itself, and so does a second decimal
   point ("1.5.5" is 1.5 then 0.5). */
function join(parts: string[]) {
  let out = "";
  let prev = "";
  for (const p of parts) {
    if (prev && !p.startsWith("-") && !(p.startsWith(".") && prev.includes("."))) out += " ";
    out += p;
    prev = p;
  }
  return out;
}

/* Length of a cubic Bezier, by 16-point Gauss-Legendre quadrature over
   its speed: exact to a hair's breadth for curves as gentle as a road's,
   at 16 evaluations each. */
const GL = [
  [0.0950125098, 0.1894506105], [0.2816035508, 0.1826034150],
  [0.4580167777, 0.1691565194], [0.6178762444, 0.1495959888],
  [0.7554044084, 0.1246289713], [0.8656312024, 0.0951585117],
  [0.9445750231, 0.0622535239], [0.9894009350, 0.0271524594],
];
function cubicLength(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) {
  let len = 0;
  for (const [a, w] of GL) {
    for (const t of [(1 - a) / 2, (1 + a) / 2]) {
      const u = 1 - t;
      const dx = 3 * (u * u * (x1 - x0) + 2 * u * t * (x2 - x1) + t * t * (x3 - x2));
      const dy = 3 * (u * u * (y1 - y0) + 2 * u * t * (y2 - y1) + t * t * (y3 - y2));
      len += (w / 2) * Math.hypot(dx, dy);
    }
  }
  return len;
}

/**
 * The drawn length of M/L/C/Z path data, absolute or relative -- what the
 * browser's getTotalLength() reports, worked out at build so the draw-on
 * animations never have to measure in the visitor's browser.
 */
export function pathLength(d: string): number {
  const tokens = d.match(/[MLCZmlcz]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g) ?? [];
  let i = 0;
  let cmd = "M";
  let x = 0;
  let y = 0;
  let sx = 0;
  let sy = 0;
  let len = 0;
  const num = () => Number(tokens[i++]);
  while (i < tokens.length) {
    if (/[a-z]/i.test(tokens[i])) {
      cmd = tokens[i++];
      if (cmd === "Z" || cmd === "z") {
        len += Math.hypot(sx - x, sy - y);
        x = sx;
        y = sy;
        continue;
      }
    }
    const rel = cmd === cmd.toLowerCase();
    const ox = rel ? x : 0;
    const oy = rel ? y : 0;
    if (cmd === "M" || cmd === "m") {
      x = ox + num();
      y = oy + num();
      sx = x;
      sy = y;
      /* Further pairs after a move are line-tos. */
      cmd = rel ? "l" : "L";
    } else if (cmd === "L" || cmd === "l") {
      const nx = ox + num();
      const ny = oy + num();
      len += Math.hypot(nx - x, ny - y);
      x = nx;
      y = ny;
    } else {
      const x1 = ox + num();
      const y1 = oy + num();
      const x2 = ox + num();
      const y2 = oy + num();
      const nx = ox + num();
      const ny = oy + num();
      len += cubicLength(x, y, x1, y1, x2, y2, nx, ny);
      x = nx;
      y = ny;
    }
  }
  return len;
}

/**
 * A stroke's dash length for drawing it on: the path's length rounded up,
 * so the dash always covers the whole stroke and no sliver shows while it
 * is hidden.
 */
export const dashLength = (d: string) => Math.ceil(pathLength(d)) + 1;

/**
 * SVG props that hide a stroke behind one dash its own length, offset
 * out of sight. It is drawn on by bringing the offset to 0; `reverse`
 * hides it the other way, so it draws from the far end.
 */
export const drawOn = (len: number, reverse = false) => ({
  strokeDasharray: len,
  strokeDashoffset: reverse ? -len : len,
});

/** Rewrites absolute M/L/C/Z path data as compact relative path data. */
export function compactPath(d: string): string {
  const tokens = d.match(TOKEN) ?? [];
  let out = "";
  let cmd = "";
  let last = "";
  let x = 0;
  let y = 0;
  let sx = 0;
  let sy = 0;
  let first = true;
  const nums: number[] = [];

  const flush = () => {
    if (!cmd) return;
    const size = cmd === "C" ? 6 : 2;
    for (let i = 0; i + size <= nums.length; i += size) {
      const pts = nums.slice(i, i + size);
      let letter: string;
      const parts: string[] = [];
      if (cmd === "M" && first) {
        /* The first move stays absolute: there is no pen to be relative to. */
        letter = "M";
        parts.push(num(pts[0]), num(pts[1]));
        x = pts[0];
        y = pts[1];
        first = false;
      } else {
        /* After a move, further pairs are line-tos, as SVG reads them. */
        letter = cmd === "M" && i > 0 ? "l" : cmd.toLowerCase();
        for (let j = 0; j < size; j += 2) parts.push(num(pts[j] - x), num(pts[j + 1] - y));
        x = pts[size - 2];
        y = pts[size - 1];
      }
      if (cmd === "M" && i === 0) {
        sx = x;
        sy = y;
      }
      /* Repeats of the same command drop the letter. */
      const same = letter === last && letter !== "m";
      out += (same ? (parts[0].startsWith("-") ? "" : " ") : letter) + join(parts);
      /* After an absolute M, bare pairs would read as absolute line-tos,
         so the next letter is always written; after an m they read as
         relative ones, which is what follows. */
      last = letter === "M" ? "" : letter === "m" ? "l" : letter;
    }
    nums.length = 0;
  };

  for (const t of tokens) {
    if (/[A-Za-z]/.test(t)) {
      flush();
      const c = t.toUpperCase();
      if (c === "Z") {
        out += "z";
        x = sx;
        y = sy;
        last = "z";
        cmd = "";
      } else cmd = c;
    } else nums.push(Math.round(Number(t) * 10));
  }
  flush();
  return out;
}
