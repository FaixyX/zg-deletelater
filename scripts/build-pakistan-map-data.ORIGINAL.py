#!/usr/bin/env python3
"""Build-time preprocessor: GADM Pakistan boundary + OSM highways → /data/pakistan-map-data.js."""

from __future__ import annotations

import json
import math
import os
import random
import re
from collections import defaultdict, deque

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BOUNDARY_PATH = os.path.join(ROOT, "data-raw", "gadm41_PAK_0.json")
ROADS_PATH = os.path.join(ROOT, "data-raw", "osm-roads.json")
OUT_PATH = os.path.join(ROOT, "data", "pakistan-map-data.js")

ALLOWED_ROADS = {
    "M-1": ("motorway", "M-1 — Peshawar–Islamabad Motorway"),
    "M-2": ("motorway", "M-2 — Lahore–Islamabad Motorway"),
    "M-3": ("motorway", "M-3 — Lahore–Abdul Hakeem Motorway"),
    "M-4": ("motorway", "M-4 — Pindi Bhattian–Multan Motorway"),
    "M-5": ("motorway", "M-5 — Multan–Sukkur Motorway"),
    "M-8": ("motorway", "M-8 — Ratodero–Gwadar Motorway"),
    "M-9": ("motorway", "M-9 — Karachi–Hyderabad Motorway"),
    "M-10": ("motorway", "M-10 — Karachi Northern Bypass"),
    "M-11": ("motorway", "M-11 — Lahore–Sialkot Motorway"),
    "M-14": ("motorway", "M-14 — Hakla–D.I. Khan Motorway"),
    "M-15": ("motorway", "M-15 — Hasanabdal–Mansehra Motorway"),
    "N-5": ("national", "N-5 — Karachi–Peshawar (Grand Trunk Road)"),
    "N-25": ("national", "N-25 — Karachi–Quetta (RCD Highway)"),
    "N-35": ("national", "N-35 — Karakoram Highway"),
}

CITIES = [
    {"id": "karachi", "label": "Karachi", "lon": 67.0011, "lat": 24.8607, "type": "city"},
    {"id": "lahore", "label": "Lahore", "lon": 74.3587, "lat": 31.5204, "type": "city"},
    {"id": "islamabad", "label": "Islamabad", "lon": 73.0479, "lat": 33.6844, "type": "city"},
    {"id": "peshawar", "label": "Peshawar", "lon": 71.5249, "lat": 34.0151, "type": "city"},
    {"id": "quetta", "label": "Quetta", "lon": 66.9750, "lat": 30.1798, "type": "city"},
    {"id": "multan", "label": "Multan", "lon": 71.5249, "lat": 30.1575, "type": "city"},
    {"id": "faisalabad", "label": "Faisalabad", "lon": 73.1350, "lat": 31.4504, "type": "city"},
]

INTERCHANGES = [
    {"id": "zero-point-lahore", "label": "Zero Point Interchange", "lon": 74.2268, "lat": 31.4643},
    {"id": "babu-sabu", "label": "Babu Sabu Interchange", "lon": 74.2619, "lat": 31.5352},
    {"id": "sheikhupura", "label": "Sheikhupura Interchange", "lon": 74.0160, "lat": 31.7460},
    {"id": "pindi-bhattian", "label": "Pindi Bhattian Interchange", "lon": 73.2830, "lat": 31.9301},
    {"id": "lilla", "label": "Lilla Interchange", "lon": 72.7984, "lat": 32.5825},
    {"id": "islamabad-m1", "label": "Islamabad M-1 Interchange", "lon": 72.8694, "lat": 33.5911},
    {"id": "burhan", "label": "Burhan Interchange", "lon": 72.6273, "lat": 33.8282},
    {"id": "hazara", "label": "Hazara Interchange", "lon": 72.6209, "lat": 33.8474},
    {"id": "sangjani", "label": "Sangjani Interchange", "lon": 72.8274, "lat": 33.6523},
    {"id": "swabi", "label": "Swabi Interchange", "lon": 72.4105, "lat": 34.0398},
    {"id": "gujranwala", "label": "Gujranwala Interchange", "lon": 74.2078, "lat": 32.0601},
    {"id": "hyderabad-m9", "label": "Hyderabad Interchange", "lon": 68.3578, "lat": 25.3960},
    {"id": "sukkur-m5", "label": "Sukkur Interchange", "lon": 68.8570, "lat": 27.7132},
    {"id": "hakla", "label": "Hakla Interchange", "lon": 72.9120, "lat": 33.5480},
    {"id": "kalashahkaku", "label": "Kala Shah Kaku Interchange", "lon": 74.2700, "lat": 31.7210},
    {"id": "abdul-hakeem", "label": "Abdul Hakeem Interchange", "lon": 72.1280, "lat": 30.5520},
]

VIEW_H = 720
PADDING = 32
DOT_SPACING = 13.2
DOT_JITTER = 1.55
RDP_ROADS = 1.85
MIN_CHAIN_PX = 12.0
MIN_POLY_VERTS = 40
GEO_MERGE_TOL = 0.0014  # ~150m — join OSM way endpoints without collapsing dual carriageways together


def ring_area(ring):
    area = 0.0
    n = len(ring)
    if n < 3:
        return 0.0
    for i in range(n - 1):
        x1, y1 = ring[i]
        x2, y2 = ring[i + 1]
        area += x1 * y2 - x2 * y1
    return abs(area) * 0.5


def extract_rings(geom):
    rings = []
    if geom["type"] == "Polygon":
        coords = [geom["coordinates"]]
    else:
        coords = geom["coordinates"]
    for poly in coords:
        outer = poly[0]
        if len(outer) >= MIN_POLY_VERTS or ring_area(outer) > 0.02:
            rings.append(outer)
    return rings


def bbox_of_rings(rings):
    xs, ys = [], []
    for ring in rings:
        for x, y in ring:
            xs.append(x)
            ys.append(y)
    return min(xs), min(ys), max(xs), max(ys)


def point_in_ring(x, y, ring):
    inside = False
    n = len(ring)
    j = n - 1
    for i in range(n):
        xi, yi = ring[i][0], ring[i][1]
        xj, yj = ring[j][0], ring[j][1]
        intersects = ((yi > y) != (yj > y)) and (
            x < (xj - xi) * (y - yi) / ((yj - yi) if yj != yi else 1e-16) + xi
        )
        if intersects:
            inside = not inside
        j = i
    return inside


def point_in_rings(x, y, rings):
    return any(point_in_ring(x, y, ring) for ring in rings)


def rdp(points, epsilon):
    if len(points) < 3:
        return points[:]
    start, end = points[0], points[-1]
    dx = end[0] - start[0]
    dy = end[1] - start[1]
    length = math.hypot(dx, dy) or 1e-12
    max_dist = -1.0
    index = 0
    for i in range(1, len(points) - 1):
        dist = abs(dy * points[i][0] - dx * points[i][1] + end[0] * start[1] - end[1] * start[0]) / length
        if dist > max_dist:
            index = i
            max_dist = dist
    if max_dist > epsilon:
        left = rdp(points[: index + 1], epsilon)
        right = rdp(points[index:], epsilon)
        return left[:-1] + right
    return [start, end]


def perp_dist(px, py, ax, ay, bx, by):
    dx, dy = bx - ax, by - ay
    length = math.hypot(dx, dy) or 1e-12
    return abs(dy * px - dx * py + bx * ay - by * ax) / length


def rdp_iter(points, epsilon):
    """Iterative RDP to avoid recursion limits on long highways."""
    if len(points) < 3:
        return points[:]
    keep = [False] * len(points)
    keep[0] = keep[-1] = True
    stack = [(0, len(points) - 1)]
    while stack:
        start, end = stack.pop()
        ax, ay = points[start]
        bx, by = points[end]
        max_dist = -1.0
        index = -1
        for i in range(start + 1, end):
            d = perp_dist(points[i][0], points[i][1], ax, ay, bx, by)
            if d > max_dist:
                index = i
                max_dist = d
        if max_dist > epsilon and index >= 0:
            keep[index] = True
            stack.append((start, index))
            stack.append((index, end))
    return [p for p, k in zip(points, keep) if k]


def normalize_ref(raw):
    if not raw:
        return None
    text = re.sub(r"\(.*?\)", "", raw).strip().upper().replace(" ", "")
    match = re.match(r"^(M|N)-?(\d+)$", text)
    if not match:
        return None
    ref = f"{match.group(1)}-{int(match.group(2))}"
    return ref if ref in ALLOWED_ROADS else None


def way_coords(element):
    geom = element.get("geometry") or []
    coords = [(pt["lon"], pt["lat"]) for pt in geom if "lon" in pt and "lat" in pt]
    return coords if len(coords) >= 2 else []


def dist(a, b):
    return math.hypot(a[0] - b[0], a[1] - b[1])


def merge_chains(chains, tol):
    chains = [c[:] for c in chains if len(c) >= 2]
    changed = True
    while changed:
        changed = False
        used = [False] * len(chains)
        merged = []
        for i, a in enumerate(chains):
            if used[i]:
                continue
            cur = a[:]
            used[i] = True
            grew = True
            while grew:
                grew = False
                for j, b in enumerate(chains):
                    if used[j]:
                        continue
                    if dist(cur[-1], b[0]) <= tol:
                        cur.extend(b[1:])
                    elif dist(cur[-1], b[-1]) <= tol:
                        cur.extend(reversed(b[:-1]))
                    elif dist(cur[0], b[-1]) <= tol:
                        cur = b[:-1] + cur
                    elif dist(cur[0], b[0]) <= tol:
                        cur = list(reversed(b[1:])) + cur
                    else:
                        continue
                    used[j] = True
                    grew = True
                    changed = True
            merged.append(cur)
        chains = merged
    return chains


def path_from_chains(chains):
    parts = []
    for chain in chains:
        if len(chain) < 2:
            continue
        x0, y0 = chain[0]
        cmds = [f"M{x0:.1f} {y0:.1f}"]
        for x, y in chain[1:]:
            cmds.append(f"L{x:.1f} {y:.1f}")
        parts.append(" ".join(cmds))
    return " ".join(parts)


def chain_length(chain):
    return sum(dist(chain[i], chain[i + 1]) for i in range(len(chain) - 1))


def extract_road_paths(ways, q=0.0022):
    """Snap OSM ways to a ~200m grid so dual carriageways collapse, then take each component's diameter."""

    def key(point):
        return (round(point[0] / q), round(point[1] / q))

    def unkey(cell):
        return (cell[0] * q, cell[1] * q)

    adj = defaultdict(set)
    for way in ways:
        cells = [key(p) for p in way]
        dedup = [cells[0]]
        for cell in cells[1:]:
            if cell != dedup[-1]:
                dedup.append(cell)
        for a, b in zip(dedup, dedup[1:]):
            adj[a].add(b)
            adj[b].add(a)

    def bfs(src, allowed):
        dist = {src: 0}
        prev = {src: None}
        queue = deque([src])
        while queue:
            node = queue.popleft()
            for nxt in adj[node]:
                if nxt in allowed and nxt not in dist:
                    dist[nxt] = dist[node] + 1
                    prev[nxt] = node
                    queue.append(nxt)
        far = max(dist, key=dist.get)
        return far, prev

    def diameter(comp):
        allowed = set(comp)
        ends = [n for n in comp if sum(1 for m in adj[n] if m in allowed) == 1]
        src = ends[0] if ends else comp[0]
        far1, _ = bfs(src, allowed)
        far2, prev = bfs(far1, allowed)
        path, cur = [], far2
        while cur is not None:
            path.append(cur)
            cur = prev[cur]
        path.reverse()
        return path

    seen = set()
    paths = []
    for node in adj:
        if node in seen:
            continue
        stack = [node]
        seen.add(node)
        comp = []
        while stack:
            cur = stack.pop()
            comp.append(cur)
            for nxt in adj[cur]:
                if nxt not in seen:
                    seen.add(nxt)
                    stack.append(nxt)
        if len(comp) < 4:
            continue
        path = diameter(comp)
        if len(path) >= 4:
            paths.append([unkey(cell) for cell in path])
    paths.sort(key=chain_length, reverse=True)
    return paths


def main():
    boundary = json.load(open(BOUNDARY_PATH))
    rings_lonlat = extract_rings(boundary["features"][0]["geometry"])
    min_lon, min_lat, max_lon, max_lat = bbox_of_rings(rings_lonlat)
    mean_lat = (min_lat + max_lat) * 0.5
    lon_scale = math.cos(math.radians(mean_lat))

    def project(lon, lat):
        x = (lon - min_lon) * lon_scale
        y = max_lat - lat
        return x, y

    projected = [[project(lon, lat) for lon, lat in ring] for ring in rings_lonlat]
    xs = [p[0] for ring in projected for p in ring]
    ys = [p[1] for ring in projected for p in ring]
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)
    content_h = VIEW_H - PADDING * 2
    scale = content_h / (max_y - min_y)
    view_w = (max_x - min_x) * scale + PADDING * 2

    def to_svg(x, y):
        return (
            (x - min_x) * scale + PADDING,
            (y - min_y) * scale + PADDING,
        )

    # PIP against the full projected rings (do not RDP first — a closed ring
    # has identical start/end, which would collapse Douglas-Peucker to nothing).
    svg_rings = [[to_svg(x, y) for x, y in ring] for ring in projected]

    rng = random.Random(42)
    dots = []
    x = PADDING
    while x <= view_w - PADDING:
        y = PADDING
        while y <= VIEW_H - PADDING:
            if point_in_rings(x, y, svg_rings):
                dots.append(
                    {
                        "x": round(x + rng.uniform(-DOT_JITTER, DOT_JITTER), 2),
                        "y": round(y + rng.uniform(-DOT_JITTER, DOT_JITTER), 2),
                    }
                )
            y += DOT_SPACING
        x += DOT_SPACING

    osm = json.load(open(ROADS_PATH))
    grouped = defaultdict(list)
    for element in osm.get("elements", []):
        ref = normalize_ref((element.get("tags") or {}).get("ref"))
        if not ref:
            continue
        coords = way_coords(element)
        if not coords:
            continue
        mid = coords[len(coords) // 2]
        if not point_in_rings(mid[0], mid[1], rings_lonlat):
            continue
        grouped[ref].append(coords)

    roads = []
    for ref in sorted(grouped, key=lambda r: (ALLOWED_ROADS[r][0], r)):
        geo_chains = extract_road_paths(grouped[ref])
        simplified = []
        for chain in geo_chains:
            pts = [to_svg(*project(lon, lat)) for lon, lat in chain]
            deduped = [pts[0]]
            for p in pts[1:]:
                if dist(p, deduped[-1]) >= 0.6:
                    deduped.append(p)
            if len(deduped) < 2:
                continue
            simp = rdp_iter(deduped, RDP_ROADS)
            if chain_length(simp) >= MIN_CHAIN_PX and len(simp) >= 2:
                simplified.append(simp)
        if simplified:
            longest = max(chain_length(c) for c in simplified)
            cutoff = max(MIN_CHAIN_PX, longest * 0.12)
            simplified = [c for c in simplified if chain_length(c) >= cutoff]
        path = path_from_chains(simplified)
        if not path:
            continue
        kind, label = ALLOWED_ROADS[ref]
        print(f"  {ref}: {len(simplified)} chains, {path.count('L') + path.count('M')} verts")
        roads.append({"id": ref, "label": label, "path": path, "type": kind})

    nodes = []
    for city in CITIES:
        x, y = to_svg(*project(city["lon"], city["lat"]))
        nodes.append(
            {
                "id": city["id"],
                "label": city["label"],
                "x": round(x, 2),
                "y": round(y, 2),
                "type": "city",
            }
        )
    for item in INTERCHANGES:
        x, y = to_svg(*project(item["lon"], item["lat"]))
        if not (PADDING - 8 <= x <= view_w - PADDING + 8 and PADDING - 8 <= y <= VIEW_H - PADDING + 8):
            continue
        nodes.append(
            {
                "id": item["id"],
                "label": item["label"],
                "x": round(x, 2),
                "y": round(y, 2),
                "type": "interchange",
            }
        )

    payload = {
        "viewBox": f"0 0 {view_w:.0f} {VIEW_H}",
        "dots": dots,
        "roads": roads,
        "nodes": nodes,
    }

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    js = (
        "/* Pre-processed from GADM 4.1 PAK_0 (boundary) + OSM Overpass (M1–M15, N-5/N-25/N-35).\n"
        " * Generated at build time — do not parse raw GeoJSON in the browser.\n"
        " * M-6, M-7, M-12, M-13 were not present as operational OSM motorway/trunk ways.\n"
        " */\n"
        "window.PAKISTAN_MAP_DATA = "
        + json.dumps(payload, separators=(",", ":"))
        + ";\n"
    )
    with open(OUT_PATH, "w") as handle:
        handle.write(js)

    print(f"viewBox {payload['viewBox']}")
    print(f"dots {len(dots)}")
    print(f"roads {[r['id'] for r in roads]}")
    print(f"nodes {len(nodes)}")
    print(f"wrote {OUT_PATH} ({len(js) / 1024:.1f} KB)")


if __name__ == "__main__":
    main()
