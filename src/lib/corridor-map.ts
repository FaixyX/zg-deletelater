import mapData from "@/data/pakistan-map.json";

import { encodeDots } from "./dot-grid";
import { compactPath, dashLength } from "./svg-path";

/**
 * The Karachi-Multan corridor, cut out of the hero map's data.
 *
 * Server components only, for the same reason as map-dots.ts: this module
 * imports the 160KB map JSON. What leaves it is a few kilobytes -- the
 * dots inside the window, packed, and the handful of paths that cross it.
 *
 * The route is three roads end to end, which is what the drive actually
 * is: M-9 from Karachi to Hyderabad, N-5 up the Indus to Sukkur, then the
 * M-5 motorway from Sukkur to Multan. The M-5 on its own is only the last
 * leg. N-5 in the data runs on to Peshawar, so it is cut at Sukkur.
 */

type Road = { id: string; label: string; path: string; type: string };
type Node = { label: string; x: number; y: number; major?: number };
type Dot = [number, number, number?];

const data = mapData as unknown as {
  outline: string[];
  roads: Road[];
  nodes: Node[];
  dots: Dot[];
};

/* The window onto the full map's 900x950 drawing: Sindh and southern
   Punjab, Port Qasim at the bottom, Multan at the top, with enough land
   either side that the route sits in a country rather than on a strip. */
export const CORRIDOR_VIEW = { x: 236, y: 452, w: 348, h: 372 } as const;
const inView = (x: number, y: number, pad = 12) =>
  x >= CORRIDOR_VIEW.x - pad &&
  x <= CORRIDOR_VIEW.x + CORRIDOR_VIEW.w + pad &&
  y >= CORRIDOR_VIEW.y - pad &&
  y <= CORRIDOR_VIEW.y + CORRIDOR_VIEW.h + pad;

const numbers = (d: string) => (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
const points = (d: string) => {
  const n = numbers(d);
  const out: [number, number][] = [];
  for (let i = 0; i + 1 < n.length; i += 2) out.push([n[i], n[i + 1]]);
  return out;
};

const node = (label: string) => {
  const n = data.nodes.find((v) => v.label === label);
  if (!n) throw new Error(`No map node ${label}`);
  return n;
};

/* The generator writes every road as "M x y" then cubic segments
   "C x1 y1 x2 y2 x y". Cut after the segment that ends nearest `stop`. */
function cutAt(d: string, stop: { x: number; y: number }) {
  const segs = d.split(/(?=C)/);
  let best = 1;
  let bestDist = Infinity;
  segs.forEach((seg, i) => {
    if (i === 0) return;
    const n = numbers(seg);
    const dist = Math.hypot(n[4] - stop.x, n[5] - stop.y);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  });
  return segs.slice(0, best + 1).join("").trim();
}

const road = (id: string) => {
  const r = data.roads.find((v) => v.id === id);
  if (!r) throw new Error(`No map road ${id}`);
  return r;
};

const hyderabad = node("Hyderabad");
const sukkur = node("Sukkur");

/* Legs in driving order, Karachi to Multan. `reverse` marks the ones
   whose path data runs the other way (M-9 is drawn from Hyderabad down to
   the coast, M-5 from Multan down to Sukkur), so the draw-on can run
   backwards along them and the route still unrolls northward. */
const leg = (id: string, d: string, reverse: boolean) => ({
  id,
  label: id,
  path: compactPath(d),
  len: dashLength(d),
  reverse,
});
export const CORRIDOR_LEGS = [
  leg("M-9", road("M-9").path, true),
  leg("N-5", cutAt(road("N-5").path, sukkur), false),
  leg("M-5", road("M-5").path, true),
];

/* Every other road that crosses the window, drawn faint for context.
   Like the legs, measured here for the draw-on (see dashLength). */
export const CORRIDOR_CONTEXT = data.roads
  .filter((r) => !["M-9", "M-5"].includes(r.id))
  .filter((r) => points(r.path).some(([x, y]) => inView(x, y)))
  .map((r) => ({ id: r.id, path: compactPath(r.path), len: dashLength(r.path) }));

export const CORRIDOR_OUTLINE = data.outline.map(compactPath);

/* Port Qasim stands in for Karachi, as it does on the hero map. */
export const CORRIDOR_NODES = [
  { label: "Karachi", ...pick(node("Port Qasim")), major: true, side: "right" as const },
  { label: "Hyderabad", ...pick(hyderabad), major: false, side: "right" as const },
  { label: "Sukkur", ...pick(sukkur), major: false, side: "left" as const },
  { label: "Multan", ...pick(node("Multan")), major: true, side: "right" as const },
];
function pick(n: Node) {
  return { x: n.x, y: n.y };
}

export const CORRIDOR_DOT_CODE = encodeDots(data.dots.filter(([x, y]) => inView(x, y, 6)));
