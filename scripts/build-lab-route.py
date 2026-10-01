#!/usr/bin/env python3
"""Builds one continuous Port Qasim -> Lahore route for the design lab.

Reads the projected corridor geometry in src/data/pakistan-map.json (M-9, the
Hyderabad-Sukkur stretch of N-5, M-5, M-4, M-3), samples each leg's bezier
subpaths into points, orients and stitches the legs end to end, and writes a
single smoothed path plus each station's position along it (0..1), so scroll
animations can draw the line and move along it with GSAP. Output:
src/app/(lab)/lab/_data/route.json
"""
import json, math, re

SRC = "src/data/pakistan-map.json"
OUT = "src/app/(lab)/lab/_data/route.json"
d = json.load(open(SRC))
roads = {r["id"]: r for r in d["roads"]}
nodes = {n["label"]: (n["x"], n["y"]) for n in d["nodes"]}

def subpaths(path):
    out = []
    for sp in re.split(r"(?=M)", path):
        nums = [float(n) for n in re.findall(r"-?\d+\.?\d*", sp)]
        if len(nums) < 2:
            continue
        pts = [(nums[0], nums[1])]
        i, cur = 2, (nums[0], nums[1])
        while i + 5 < len(nums) + 0 and i + 6 <= len(nums):
            x1, y1, x2, y2, x, y = nums[i:i + 6]
            for t in (0.25, 0.5, 0.75, 1.0):
                mt = 1 - t
                px = mt**3 * cur[0] + 3 * mt * mt * t * x1 + 3 * mt * t * t * x2 + t**3 * x
                py = mt**3 * cur[1] + 3 * mt * mt * t * y1 + 3 * mt * t * t * y2 + t**3 * y
                pts.append((px, py))
            cur = (x, y)
            i += 6
        out.append(pts)
    return out

def dist(a, b):
    return math.hypot(a[0] - b[0], a[1] - b[1])

def leg(road_id, start, end, keep=None):
    """Longest chain of a road's subpaths from near `start` toward `end`."""
    sps = subpaths(roads[road_id]["path"])
    if keep:
        sps = [[p for p in sp if keep(p)] for sp in sps]
        sps = [sp for sp in sps if len(sp) > 1]
    # greedy: start with the subpath end nearest `start`, keep appending nearest
    chain, pool = [], sps[:]
    best = min(pool, key=lambda sp: min(dist(sp[0], start), dist(sp[-1], start)))
    pool.remove(best)
    if dist(best[-1], start) < dist(best[0], start):
        best = best[::-1]
    chain = best[:]
    while pool:
        tail = chain[-1]
        nxt = min(pool, key=lambda sp: min(dist(sp[0], tail), dist(sp[-1], tail)))
        gap = min(dist(nxt[0], tail), dist(nxt[-1], tail))
        if gap > 12:
            break
        pool.remove(nxt)
        if dist(nxt[-1], tail) < dist(nxt[0], tail):
            nxt = nxt[::-1]
        chain += nxt[1:]
    # trim to the stretch between the two nodes
    i0 = min(range(len(chain)), key=lambda i: dist(chain[i], start))
    i1 = min(range(len(chain)), key=lambda i: dist(chain[i], end))
    if i1 < i0:
        chain = chain[::-1]
        i0, i1 = len(chain) - 1 - i0, len(chain) - 1 - i1
    seg = chain[i0:i1 + 1]
    seg[0], seg[-1] = start, end
    return seg

PQ, HY, SU, MU, FA, LA = (nodes[k] for k in ("Port Qasim", "Hyderabad", "Sukkur", "Multan", "Faisalabad", "Lahore"))
LEGS = [
    ("M-9", PQ, HY, None),
    ("N-5", HY, SU, None),
    ("M-5", SU, MU, None),
    ("M-4", MU, FA, None),
    ("M-3", FA, LA, None),
]
pts, stations = [], [("Port Qasim", "M-9")]
for rid, a, b, keep in LEGS:
    seg = leg(rid, a, b, keep)
    pts += seg if not pts else seg[1:]
    stations.append((None, rid))

# drop near-duplicate points
clean = [pts[0]]
for p in pts[1:]:
    if dist(p, clean[-1]) >= 1.2:
        clean.append(p)
pts = clean

# cumulative length and each station's fraction
cum = [0.0]
for a, b in zip(pts, pts[1:]):
    cum.append(cum[-1] + dist(a, b))
total = cum[-1]
names = ["Port Qasim", "Hyderabad", "Sukkur", "Multan", "Faisalabad", "Lahore"]
roads_in = ["M-9", "N-5", "M-5", "M-4", "M-3"]
out_st = []
for i, name in enumerate(names):
    nx, ny = nodes[name]
    k = min(range(len(pts)), key=lambda j: dist(pts[j], (nx, ny)))
    out_st.append({"name": name, "x": nx, "y": ny, "at": round(cum[k] / total, 4), "road": roads_in[i] if i < 5 else None})

# Catmull-Rom -> cubic beziers, one single-segment path (DrawSVG prefers that)
def cr(p):
    s = f"M{p[0][0]:.1f} {p[0][1]:.1f}"
    for i in range(len(p) - 1):
        p0 = p[i - 1] if i > 0 else p[i]
        p1, p2 = p[i], p[i + 1]
        p3 = p[i + 2] if i + 2 < len(p) else p2
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        s += f"C{c1[0]:.1f} {c1[1]:.1f} {c2[0]:.1f} {c2[1]:.1f} {p2[0]:.1f} {p2[1]:.1f}"
    return s

json.dump({"viewBox": d["viewBox"], "path": cr(pts), "length": round(total, 1), "points": len(pts), "stations": out_st}, open(OUT, "w"), indent=1)
print("points", len(pts), "length", round(total, 1))
for s in out_st:
    print(s)
