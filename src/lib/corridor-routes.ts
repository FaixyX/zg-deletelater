/**
 * The hero map's corridor, rebuilt as one clean line per leg, city to
 * city.
 *
 * The source roads are traced from map data: they come in several
 * pieces, some run out and back over themselves, and their ends stop
 * short of (or past) the cities the corridor is about. Drawn as they are,
 * the route showed doubled strands and loose ends that met no city.
 *
 * So each leg is rebuilt from its road's own geometry: every point of
 * that road lying along the leg is gathered, ordered by how far along
 * the leg it falls, and reduced to one waypoint per stretch (the median,
 * so a strand drawn twice counts once). The line then runs through those
 * waypoints, smoothed, from exactly one city's marker to exactly the
 * other's. It keeps the road's real shape and meets the network at its
 * nodes, so every leg is joined to the next.
 *
 * Runs at build time only: PakistanMap is a server component.
 */

type Pt = [number, number];
type Road = { id: string; path: string };
type Node = { label: string; x: number; y: number };

/* Each leg: the two places it joins, and the road whose trace it
   follows. The N-10 runs west from Karachi along the Makran coast; the
   leg starts at Port Qasim, as the others do, and crosses the city to it. A place is a city, or "join:<leg>" -- the point on an earlier
   leg nearest where this road ends, for a motorway that runs into
   another rather than into a city. The M-3 from Lahore meets the M-4 at
   Abdul Hakeem, short of Multan; drawn on to Multan it crossed the M-4
   and doubled back. */
const LEGS: [from: string, to: string, road: string][] = [
  ["Port Qasim", "Hyderabad", "M-9"],
  ["Hyderabad", "Sukkur", "N-5"],
  ["Sukkur", "Multan", "M-5"],
  ["Multan", "Faisalabad", "M-4"],
  ["Lahore", "join:Multan-Faisalabad", "M-3"],
  ["Lahore", "Islamabad", "M-2"],
  ["Islamabad", "Peshawar", "N-5"],
  ["Sukkur", "Quetta", "N-65"],
  ["Port Qasim", "Gwadar", "N-10"],
];

/* How far off the straight line between two cities a road point may be
   and still belong to the leg, in map units; and how many stretches a
   leg is cut into for its waypoints. */
const REACH = 0.28; // as a share of the leg's length
const MIN_REACH = 18;
const STRETCHES = 14;

/* Absolute M/L/C path data to points: every curve sampled along its
   length, so the trace's shape survives. */
function trace(path: string): Pt[] {
  const toks = path.match(/[MLC]|-?\d*\.?\d+(?:e-?\d+)?/gi) ?? [];
  const out: Pt[] = [];
  let i = 0;
  let cmd = "M";
  let cur: Pt = [0, 0];
  const num = () => parseFloat(toks[i++]);
  while (i < toks.length) {
    if (/[MLC]/i.test(toks[i])) cmd = toks[i++].toUpperCase();
    if (cmd === "M" || cmd === "L") {
      cur = [num(), num()];
      out.push(cur);
    } else if (cmd === "C") {
      const c1: Pt = [num(), num()];
      const c2: Pt = [num(), num()];
      const end: Pt = [num(), num()];
      for (let k = 1; k <= 6; k++) {
        const t = k / 6;
        const u = 1 - t;
        out.push([
          u * u * u * cur[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * end[0],
          u * u * u * cur[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * end[1],
        ]);
      }
      cur = end;
    } else i++;
  }
  return out;
}

/* A smooth path through the points: Catmull-Rom, written as cubics. */
function smooth(p: Pt[]): string {
  const f = (n: number) => n.toFixed(1);
  let d = `M${f(p[0][0])} ${f(p[0][1])}`;
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[Math.max(0, i - 1)];
    const b = p[i];
    const c = p[i + 1];
    const e = p[Math.min(p.length - 1, i + 2)];
    const c1: Pt = [b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6];
    const c2: Pt = [c[0] - (e[0] - b[0]) / 6, c[1] - (e[1] - b[1]) / 6];
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(c[0])} ${f(c[1])}`;
  }
  return d;
}

export function corridorLegs(roads: Road[], nodes: Node[]): { id: string; path: string }[] {
  const at = new Map(nodes.map((n) => [n.label, [n.x, n.y] as Pt]));
  const traces = new Map(roads.map((r) => [r.id, trace(r.path)]));
  /* Each built leg's line, as points, for later legs to join onto. */
  const built = new Map<string, Pt[]>();

  const place = (name: string, from: Pt | undefined, road: Pt[] | undefined): Pt | undefined => {
    if (!name.startsWith("join:")) return at.get(name);
    const line = built.get(name.slice(5));
    if (!line || !from || !road?.length) return undefined;
    /* Where the road ends: its point farthest from where the leg starts.
       Then the point on the other leg's line nearest to that. */
    const end = road.reduce((far, p) =>
      Math.hypot(p[0] - from[0], p[1] - from[1]) > Math.hypot(far[0] - from[0], far[1] - from[1]) ? p : far
    );
    return line.reduce((near, p) =>
      Math.hypot(p[0] - end[0], p[1] - end[1]) < Math.hypot(near[0] - end[0], near[1] - end[1]) ? p : near
    );
  };

  return LEGS.flatMap(([from, to, road]) => {
    const pts = traces.get(road);
    const A = place(from, undefined, pts);
    const B = place(to, A, pts);
    if (!A || !B || !pts) return [];
    const dx = B[0] - A[0];
    const dy = B[1] - A[1];
    const len = Math.hypot(dx, dy);
    const reach = Math.max(MIN_REACH, len * REACH);

    /* The road's points along this leg, by how far along it they fall. */
    const bins: Pt[][] = Array.from({ length: STRETCHES }, () => []);
    for (const p of pts) {
      const t = ((p[0] - A[0]) * dx + (p[1] - A[1]) * dy) / (len * len);
      /* Not too near either end: a waypoint crowding a city's marker
         bends the line into a hook as it arrives. */
      if (t <= 0.06 || t >= 0.94) continue;
      const off = Math.abs((p[0] - A[0]) * dy - (p[1] - A[1]) * dx) / len;
      if (off > reach) continue;
      bins[Math.min(STRETCHES - 1, Math.floor(t * STRETCHES))].push(p);
    }

    /* One waypoint per stretch: the median, so a strand traced twice
       counts once and a stray point can't pull the line off the road. */
    const median = (v: number[]) => v.sort((a, b) => a - b)[v.length >> 1];
    const way = bins
      .filter((b) => b.length)
      .map((b) => [median(b.map((p) => p[0])), median(b.map((p) => p[1]))] as Pt);

    /* Kept, densely sampled, for a later leg to join onto. */
    const line = [A, ...way, B];
    const dense: Pt[] = [];
    for (let i = 0; i < line.length - 1; i++)
      for (let k = 0; k < 8; k++)
        dense.push([
          line[i][0] + ((line[i + 1][0] - line[i][0]) * k) / 8,
          line[i][1] + ((line[i + 1][1] - line[i][1]) * k) / 8,
        ]);
    dense.push(B);
    built.set(`${from}-${to}`, dense);

    return [{ id: `${from}-${to}`, path: smooth(line) }];
  });
}
