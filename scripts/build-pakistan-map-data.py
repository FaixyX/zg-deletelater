#!/usr/bin/env python3
"""
build-pakistan-map-data.py

Rebuilds the `roads` array from the Overpass export in
data-raw/osm-roads.json.

Provenance of each piece, since three implementations exist and none
of them was right on every count:

  projection        02-build-roads.py  (Web Mercator -- reproduces
                    every node in .cursor/reference-map-data.json to
                    0.05px; the equirectangular projection in
                    build-pakistan-map-data.ORIGINAL.py lands ~230px
                    away, and a straight-line fit to latitude drifts
                    up to 8.9px at Peshawar)
  chain stitching   this script (shared OSM node ids)
  carriageway dedup this script
  RDP tolerance     02-build-roads.py  (per-length)
  smoothing         02-build-roads.py  (Catmull-Rom -> cubic beziers)
  subpath emission  build-pakistan-map-data.ORIGINAL.py (every chain
                    gets its own M command)
  labels            02-build-roads.py  (matches the reference output)

Ways are joined on shared OSM node ids rather than coordinate
proximity. A motorway is mapped as two parallel one-way carriageways
that both carry the same ref and whose endpoints sit metres apart, so
proximity-joining hops from one carriageway onto the other and walks
back where it came from. Carriageways share no nodes, so id-matching
keeps them apart -- and `drop_coincident_chains` then discards the
duplicate, because at this scale the two run less than a pixel apart
and would otherwise double both the vertex count and the path length
the draw/pulse animations traverse.

Everything but the viewBox is rewritten. dots and outline are built
straight from the GADM boundary -- they used to be passed through from
an intermediate this repo never had, which meant a bug in the boundary
could not be fixed by re-running anything. Nodes stay hand-placed, but
they carry lon/lat and are re-projected on each run, so a change to the
fit moves them with the map instead of stranding them.

Usage:
    python3 scripts/build-pakistan-map-data.py
"""

import json
import math
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW_PATH = ROOT / "data-raw" / "osm-roads.json"
BOUNDARY_PATH = ROOT / "data-raw" / "gadm41_PAK_0.json"
POV_PATH = ROOT / "data-raw" / "ne_pak_pov.json"
MAP_PATH = ROOT / "src" / "data" / "pakistan-map.json"
JS_PATH = ROOT / "data" / "pakistan-map-data.js"

PAD = 26.0            # 02-build-roads.py
DEDUPE_PX = 0.5       # 02-build-roads.py
MIN_CHAIN_PX = 5.0    # 02-build-roads.py
RDP_MIN, RDP_MAX, RDP_DIVISOR = 0.35, 1.2, 300.0  # 02-build-roads.py
COINCIDENT_PX = 1.0   # carriageway dedup: how close counts as "the same line"
COINCIDENT_FRAC = 0.9  # ...and how much of the chain has to be that close


# ---- projection (02-build-roads.py) ------------------------------------

def mercator(lon, lat):
    return math.radians(lon), math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))


def load_boundary_polys():
    """The national silhouette, as lists of rings per polygon.

    Two sources, unioned, because neither alone is right:

      - GADM 4.1 PAK carries the detailed coastline and the delta and
        Makran islands, but its extent stops at 77.8E. Its two features
        are PAK proper and Z06, which is the Kashmir region GADM itself
        files under COUNTRY "Pakistan".
      - Natural Earth 10m admin_0, Pakistan point of view, carries the
        territory as Pakistan draws it -- out to 79.6E, so Jammu and
        Kashmir is whole -- but at a coarser coastline and without the
        islands.

    Unioning takes the territory from one and the detail from the other
    with no seam down the overlap. Point-of-view boundary sets are what
    Natural Earth publishes them for; this is not a line drawn by hand.

    Each polygon keeps its rings in order -- exterior first, then holes
    -- because the even-odd test in build_dots relies on it.
    """
    from shapely.geometry import MultiPolygon, shape
    from shapely.ops import unary_union

    parts = []
    for feat in json.loads(BOUNDARY_PATH.read_text())["features"]:
        parts.append(shape(feat["geometry"]).buffer(0))
    for feat in json.loads(POV_PATH.read_text())["features"]:
        parts.append(shape(feat["geometry"]).buffer(0))

    merged = unary_union(parts)
    geoms = list(merged.geoms) if isinstance(merged, MultiPolygon) else [merged]

    polys = []
    for geom in geoms:
        rings = [list(geom.exterior.coords)]
        rings += [list(i.coords) for i in geom.interiors]
        rings = [[(x, y) for x, y in r] for r in rings if len(r) >= 8]
        if rings:
            polys.append(rings)
    return polys


def build_projection(view_w, view_h):
    """Web Mercator, fit to the viewBox with PAD on every side.

    Fits on whichever axis binds and centres on the other. Adding Kashmir
    widens the country's bounding box by about 15%, so the fit is width-
    bound now where it used to have room to spare.
    """
    polys = load_boundary_polys()
    lons = [c[0] for rs in polys for r in rs for c in r]
    lats = [c[1] for rs in polys for r in rs for c in r]
    mx0, my0 = mercator(min(lons), min(lats))
    mx1, my1 = mercator(max(lons), max(lats))
    span_x, span_y = mx1 - mx0, my1 - my0
    scale = min((view_w - 2 * PAD) / span_x, (view_h - 2 * PAD) / span_y)
    off_x = (view_w - span_x * scale) / 2
    off_y = (view_h - span_y * scale) / 2

    def project(lon, lat):
        mx, my = mercator(lon, lat)
        return (off_x + (mx - mx0) * scale, off_y + (my1 - my) * scale)

    return project


# ---- boundary + dot field ----------------------------------------------

DOT_DX, DOT_DY = 7.6, 6.6   # hex grid: odd rows offset by half a step
OUTLINE_EPS = 0.35          # px, same tolerance the roads simplify to
OUTLINE_MIN_PX = 4.0        # drop islands smaller than this across


def build_outline(project):
    """One path per ring, simplified. Islands below OUTLINE_MIN_PX go: at
    this scale they are a single grey pixel and there are dozens."""
    paths = []
    for rings in load_boundary_polys():
        for ring in rings:
            pts = [project(lon, lat) for lon, lat in ring]
            xs = [p[0] for p in pts]
            ys = [p[1] for p in pts]
            if math.hypot(max(xs) - min(xs), max(ys) - min(ys)) < OUTLINE_MIN_PX:
                continue
            simp = rdp_iter(pts, OUTLINE_EPS)
            if len(simp) < 3:
                continue
            head = f"M{simp[0][0]:.1f} {simp[0][1]:.1f}"
            rest = "".join(f" L{x:.1f} {y:.1f}" for x, y in simp[1:])
            paths.append(head + rest + " Z")
    return paths


def build_dots(project, view_w, view_h):
    """Hex grid clipped to the land. Even-odd across all of a polygon's
    rings, so lakes and enclaves punch through."""
    polys = []
    for rings in load_boundary_polys():
        pr = [[project(lon, lat) for lon, lat in r] for r in rings]
        xs = [p[0] for r in pr for p in r]
        ys = [p[1] for r in pr for p in r]
        polys.append((pr, (min(xs), min(ys), max(xs), max(ys))))

    def on_land(x, y):
        for rings, (x0, y0, x1, y1) in polys:
            if x < x0 or x > x1 or y < y0 or y > y1:
                continue
            crossings = False
            for ring in rings:
                n = len(ring)
                for i in range(n):
                    xa, ya = ring[i]
                    xb, yb = ring[(i + 1) % n]
                    if (ya > y) != (yb > y):
                        if x < (xb - xa) * (y - ya) / (yb - ya) + xa:
                            crossings = not crossings
            if crossings:
                return True
        return False

    dots = []
    row = 0
    y = PAD
    while y <= view_h - PAD:
        x = PAD + (DOT_DX / 2 if row % 2 else 0.0)
        while x <= view_w - PAD:
            if on_land(x, y):
                dots.append([round(x, 1), round(y, 1)])
            x += DOT_DX
        y += DOT_DY
        row += 1
    return dots


# ---- road classification ----------------------------------------------

# Labels match .cursor/reference-map-data.json exactly (02-build-roads.py).
CORRIDOR_ROADS = {
    "M-9": "M-9 · Karachi – Hyderabad",
    "N-5": "N-5 · Grand Trunk Road",
    "M-5": "M-5 · Multan – Sukkur",
    "M-4": "M-4 · Pindi Bhattian – Multan",
    "M-3": "M-3 · Lahore – Abdul Hakeem",
    "M-2": "M-2 · Lahore – Islamabad",
    "N-65": "N-65 · Sukkur – Quetta",
    "N-10": "N-10 · Karachi – Gwadar",
}

CONTEXT_ROADS = {
    "M-1", "M-8", "M-10", "M-11", "M-14", "M-15",
    "N-15", "N-25", "N-35", "N-40", "N-45", "N-50",
    "N-55", "N-70", "N-75", "N-80", "N-85", "N-95", "N-110",
}

ALLOWED_ROADS = set(CORRIDOR_ROADS) | CONTEXT_ROADS


def normalize_ref(ref):
    if not ref:
        return None
    ref = ref.split(";")[0].strip().upper()
    ref = re.sub(r"\s*\(.*\)$", "", ref)             # "M-2 (L)" -> "M-2"
    ref = re.sub(r"^([MN])-?(\d+)$", r"\1-\2", ref)  # "N5" -> "N-5"
    return ref if ref in ALLOWED_ROADS else None


# ---- geometry ----------------------------------------------------------

def dist(a, b):
    return math.hypot(a[0] - b[0], a[1] - b[1])


def chain_length(chain):
    return sum(dist(chain[i - 1], chain[i]) for i in range(1, len(chain)))


def dedupe(points, min_dist=DEDUPE_PX):
    if not points:
        return points
    out = [points[0]]
    for p in points[1:]:
        if dist(p, out[-1]) >= min_dist:
            out.append(p)
    return out


def rdp_for(chain):
    """Per-length tolerance: loose on long roads, tight on short ones."""
    return max(RDP_MIN, min(RDP_MAX, chain_length(chain) / RDP_DIVISOR))


def _perp_dist(pt, a, b):
    (x, y), (ax, ay), (bx, by) = pt, a, b
    dx, dy = bx - ax, by - ay
    den = math.hypot(dx, dy)
    if den == 0:
        return math.hypot(x - ax, y - ay)
    return abs(dy * x - dx * y + bx * ay - by * ax) / den


def rdp_iter(points, epsilon):
    """Ramer-Douglas-Peucker, iterative (no recursion limit on long roads)."""
    if len(points) < 3:
        return points[:]
    keep = [False] * len(points)
    keep[0] = keep[-1] = True
    stack = [(0, len(points) - 1)]
    while stack:
        start, end = stack.pop()
        if end <= start + 1:
            continue
        a, b = points[start], points[end]
        max_dist, index = -1.0, -1
        for i in range(start + 1, end):
            d = _perp_dist(points[i], a, b)
            if d > max_dist:
                max_dist, index = d, i
        if max_dist > epsilon and index >= 0:
            keep[index] = True
            stack.append((start, index))
            stack.append((index, end))
    return [p for p, k in zip(points, keep) if k]


def smooth_chain(pts, tension=0.5):
    """Catmull-Rom through the points, emitted as cubic beziers."""
    if len(pts) < 3:
        return "M%.1f %.1f " % pts[0] + " ".join("L%.1f %.1f" % p for p in pts[1:])
    out = ["M%.1f %.1f" % pts[0]]
    n = len(pts)
    for i in range(n - 1):
        p0 = pts[i - 1] if i > 0 else pts[i]
        p1, p2 = pts[i], pts[i + 1]
        p3 = pts[i + 2] if i + 2 < n else pts[i + 1]
        c1 = (p1[0] + (p2[0] - p0[0]) * tension / 3,
              p1[1] + (p2[1] - p0[1]) * tension / 3)
        c2 = (p2[0] - (p3[0] - p1[0]) * tension / 3,
              p2[1] - (p3[1] - p1[1]) * tension / 3)
        out.append("C%.1f %.1f %.1f %.1f %.1f %.1f"
                   % (c1[0], c1[1], c2[0], c2[1], p2[0], p2[1]))
    return " ".join(out)


# ---- chain building ----------------------------------------------------

def _chain_ways(ways):
    """
    Join ways into chains on shared OSM node ids. `ways` is a list of
    (head_node_id, tail_node_id, points). Never reverses a way, so it
    cannot walk back down an opposing carriageway.
    """
    by_head, by_tail = {}, {}
    for i, (head, tail, _) in enumerate(ways):
        by_head.setdefault(head, []).append(i)
        by_tail.setdefault(tail, []).append(i)

    used = [False] * len(ways)
    chains = []
    for i in range(len(ways)):
        if used[i]:
            continue
        used[i] = True
        head, tail, pts = ways[i]
        chain = list(pts)

        while True:  # forwards: a way starting where this one ends
            nxt = next((j for j in by_head.get(tail, []) if not used[j]), None)
            if nxt is None:
                break
            used[nxt] = True
            _, tail, nxt_pts = ways[nxt]
            chain.extend(nxt_pts[1:])

        while True:  # backwards: a way ending where this one starts
            prev = next((j for j in by_tail.get(head, []) if not used[j]), None)
            if prev is None:
                break
            used[prev] = True
            head, _, prev_pts = ways[prev]
            chain = prev_pts[:-1] + chain

        chains.append(chain)
    return chains


def drop_coincident_chains(chains):
    """
    Discard chains that retrace one already kept -- the opposing
    carriageway of a divided motorway. The two are separate ways
    sharing no nodes, so stitching can't merge them, but they project
    to within a pixel of each other. Left in, they double the vertex
    count and the path length the draw and pulse animations traverse.

    Longest chain wins; a shorter one is dropped when COINCIDENT_FRAC
    of its sampled points lie within COINCIDENT_PX of a kept chain.
    Requiring most of the chain to coincide means roads that merely
    touch at a junction are unaffected.
    """
    cell = COINCIDENT_PX
    kept, index = [], {}

    def add_to_index(chain):
        for p in chain:
            index.setdefault((int(p[0] // cell), int(p[1] // cell)), []).append(p)

    def covered(p):
        cx, cy = int(p[0] // cell), int(p[1] // cell)
        for gx in (cx - 1, cx, cx + 1):
            for gy in (cy - 1, cy, cy + 1):
                for q in index.get((gx, gy), ()):
                    if dist(p, q) <= COINCIDENT_PX:
                        return True
        return False

    for chain in sorted(chains, key=chain_length, reverse=True):
        sample = chain if len(chain) <= 60 else chain[:: len(chain) // 60]
        hits = sum(1 for p in sample if covered(p))
        if kept and hits >= COINCIDENT_FRAC * len(sample):
            continue
        kept.append(chain)
        add_to_index(chain)
    return kept


def build_chains(elements):
    by_ref = {}
    for el in elements:
        if el.get("type") != "way" or "geometry" not in el:
            continue
        ref = normalize_ref((el.get("tags") or {}).get("ref"))
        if not ref:
            continue
        geom = el["geometry"]
        node_ids = el.get("nodes") or []
        if len(geom) < 2:
            continue
        pts = [PROJECT(pt["lon"], pt["lat"]) for pt in geom]
        if len(node_ids) == len(geom):
            head, tail = node_ids[0], node_ids[-1]
        else:
            head, tail = pts[0], pts[-1]
        by_ref.setdefault(ref, []).append((head, tail, pts))

    return {ref: _chain_ways(ways) for ref, ways in by_ref.items()}


PROJECT = None  # set in main() once the viewBox width is known


# ---- corridor termini ---------------------------------------------------
#
# OSM gives whole highways, not the leg we draw. N-5 keeps going north-west
# past Peshawar toward Torkham, so the corridor used to run out past its own
# terminus and stop in open country -- and the fragments left over from
# chain-splitting dangled beside the city marker. A route drawn between
# named cities should land on them.

END_JOIN_PX = 3.0      # two chain ends this close are a join, not a terminus
SNAP_PX = 30.0         # a free end this near a node belongs to that node
ORPHAN_PX = 20.0       # a free-floating chain shorter than this is debris


def _free_ends(chains):
    """Indices of (chain, end) that no other chain end meets."""
    ends = [(i, e, c[0] if e == 0 else c[-1]) for i, c in enumerate(chains) for e in (0, -1)]
    free = set()
    for i, e, p in ends:
        if not any((j, f) != (i, e) and math.hypot(p[0] - q[0], p[1] - q[1]) < END_JOIN_PX
                   for j, f, q in ends):
            free.add((i, e))
    return free


def snap_to_nodes(chains, node_pts):
    """Trim each free end back to its closest approach to a node, and put the
    last vertex exactly on it. Drops free-floating debris."""
    if not node_pts:
        return chains

    def nearest(p):
        return min((math.hypot(p[0] - q[0], p[1] - q[1]), q) for q in node_pts)

    free = _free_ends(chains)
    out = []
    for i, chain in enumerate(chains):
        both_free = (i, 0) in free and (i, -1) in free
        if both_free and chain_length(chain) < ORPHAN_PX:
            continue

        c = list(chain)
        for end in (0, -1):
            if (i, end) not in free:
                continue
            # look only at the outer third, so a mid-route city can't clip a leg
            span = max(2, len(c) // 3)
            idxs = range(span) if end == 0 else range(len(c) - 1, len(c) - span - 1, -1)
            best = min(idxs, key=lambda k: nearest(c[k])[0])
            dist, node = nearest(c[best])
            if dist > SNAP_PX:
                continue
            c = c[best:] if end == 0 else c[: best + 1]
            if len(c) < 2:
                break
            c[0 if end == 0 else -1] = node
        if len(c) >= 2:
            out.append(c)
    return out


# ---- corridor depth map ------------------------------------------------

# Distance bands, px, from a dot to the nearest corridor vertex. The dot
# field is drawn brighter, larger and warmer close to the route and fades
# out away from it, so the corridor reads as the map's focal plane rather
# than as a line laid over an evenly-lit field. Styling per band lives in
# PakistanMap.tsx; this only emits which band each dot falls in.
#
# Eight bands, spaced tighter near the route: with four the steps landed
# ~2 dot-spacings apart and read as hard edges rather than a falloff.
DEPTH_BANDS = (12.0, 25.0, 40.0, 58.0, 80.0, 108.0, 145.0)


def depth_band(dot, corridor_pts, cell, grid):
    """Band index for one dot: 0 nearest .. len(DEPTH_BANDS) farthest."""
    x, y = dot
    best = float("inf")
    reach = 0
    max_reach = int(DEPTH_BANDS[-1] // cell) + 1
    cx, cy = int(x // cell), int(y // cell)
    # widen the search ring until the nearest hit can't be beaten
    while reach <= max_reach:
        for gx in range(cx - reach, cx + reach + 1):
            for gy in range(cy - reach, cy + reach + 1):
                # only the newly added ring
                if reach and abs(gx - cx) != reach and abs(gy - cy) != reach:
                    continue
                for px, py in grid.get((gx, gy), ()):
                    d = math.hypot(x - px, y - py)
                    if d < best:
                        best = d
        if best <= reach * cell:
            break
        reach += 1
    for i, edge in enumerate(DEPTH_BANDS):
        if best < edge:
            return i
    return len(DEPTH_BANDS)


def apply_depth(dots, corridor_pts):
    cell = DEPTH_BANDS[0]
    grid = {}
    for p in corridor_pts:
        grid.setdefault((int(p[0] // cell), int(p[1] // cell)), []).append(p)
    return [[d[0], d[1], depth_band(d, corridor_pts, cell, grid)] for d in dots]


def main():
    global PROJECT

    for path in (RAW_PATH, BOUNDARY_PATH, POV_PATH, MAP_PATH):
        if not path.exists():
            sys.exit(f"missing {path}")

    existing = json.loads(MAP_PATH.read_text())
    _, _, view_w, view_h = (float(v) for v in existing["viewBox"].split())
    PROJECT = build_projection(view_w, view_h)

    raw = json.loads(RAW_PATH.read_text())
    chains_by_ref = build_chains(raw.get("elements", []))

    missing = ALLOWED_ROADS - set(chains_by_ref)
    if missing:
        print(f"warning: no geometry for {sorted(missing)}", file=sys.stderr)

    # Projected node positions, so corridor ends can be snapped to them.
    node_pts = [PROJECT(n["lon"], n["lat"]) for n in existing["nodes"]]

    roads, report = [], []
    corridor_pts = []
    for ref in sorted(chains_by_ref):
        raw_chains = chains_by_ref[ref]
        chains = drop_coincident_chains(raw_chains)
        dropped = len(raw_chains) - len(chains)

        simplified_chains = []
        for chain in chains:
            deduped = dedupe(chain)
            if len(deduped) < 2 or chain_length(deduped) < MIN_CHAIN_PX:
                continue
            simplified_chains.append(rdp_iter(deduped, rdp_for(deduped)))

        # Only the corridor is drawn as a route between named cities; the
        # context network is scenery and has no termini to honour.
        if ref in CORRIDOR_ROADS:
            simplified_chains = snap_to_nodes(simplified_chains, node_pts)

        subpaths, verts = [], 0
        for simplified in simplified_chains:
            verts += len(simplified)
            subpaths.append(smooth_chain(simplified))
            if ref in CORRIDOR_ROADS:
                corridor_pts.extend(simplified)
        if not subpaths:
            continue

        kind = "corridor" if ref in CORRIDOR_ROADS else "context"
        roads.append({
            "id": ref,
            "label": CORRIDOR_ROADS.get(ref, ref),
            "path": " ".join(subpaths),
            "type": kind,
        })
        report.append((ref, kind, len(subpaths), verts, dropped))

    existing["roads"] = roads
    existing["outline"] = build_outline(PROJECT)
    existing["dots"] = apply_depth(build_dots(PROJECT, view_w, view_h), corridor_pts)

    # Nodes are hand-placed but carry lon/lat, so they follow the projection
    # instead of being stranded in the coordinates of an older fit.
    for node in existing["nodes"]:
        node["x"], node["y"] = (round(v, 1) for v in PROJECT(node["lon"], node["lat"]))

    MAP_PATH.write_text(json.dumps(existing, separators=(",", ":")))
    print(f"{len(existing['outline'])} outline paths, {len(existing['dots'])} dots")

    JS_PATH.parent.mkdir(parents=True, exist_ok=True)
    JS_PATH.write_text(
        "/* Generated by scripts/build-pakistan-map-data.py from GADM 4.1 PAK_0\n"
        " * (boundary) + OSM Overpass (roads). Do not edit by hand.\n"
        " */\n"
        "window.PAKISTAN_MAP_DATA = "
        + json.dumps(existing, separators=(",", ":"))
        + ";\n"
    )

    report.sort(key=lambda r: (r[1] != "corridor", r[0]))
    print(f"{'road':<8} {'type':<9} {'subpaths':>9} {'vertices':>9} {'dup chains':>11}")
    for ref, kind, n_sub, verts, dropped in report:
        print(f"{ref:<8} {kind:<9} {n_sub:>9} {verts:>9} {dropped:>11}")
    print(f"\n{len(roads)} roads, {sum(r[3] for r in report)} vertices")
    bands = {}
    for d in existing["dots"]:
        bands[d[2]] = bands.get(d[2], 0) + 1
    edges = [f"<{DEPTH_BANDS[0]:.0f}"] + \
            [f"{DEPTH_BANDS[i-1]:.0f}-{DEPTH_BANDS[i]:.0f}" for i in range(1, len(DEPTH_BANDS))] + \
            [f">{DEPTH_BANDS[-1]:.0f}"]
    print("depth bands (px from corridor): " +
          ", ".join(f"{edges[b]} = {bands.get(b, 0)}" for b in range(len(DEPTH_BANDS) + 1)))
    print(f"wrote {MAP_PATH.relative_to(ROOT)} and {JS_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
