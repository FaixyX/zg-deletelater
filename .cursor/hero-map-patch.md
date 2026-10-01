# Zia Goods hero map — revision patch

Three commits, in order. Each is independently shippable.

1. Re-fetch wider road data + split corridor from context
2. Retheme to the Zia palette
3. Fix the performance and timeline issues

---

## Commit 1 — Data: corridor vs context

### 1a. Re-fetch OSM with a wider net

Your current `osm-roads.json` contains only 16 distinct refs because the Overpass
query was scoped to them. Run this instead and save over `data-raw/osm-roads.json`:

```
[out:json][timeout:180];
area["ISO3166-1"="PK"][admin_level=2]->.pk;
(
  way(area.pk)["highway"~"^(motorway|trunk|primary)$"]["ref"];
);
out geom;
```

This returns every M-series and N-series way in the country, plus primary roads.
Expect roughly 30–60MB of raw JSON. It never reaches the browser — the Python
script is what consumes it.

If Overpass times out, split by bounding box and merge, or use the
`overpass-api.de/api/interpreter` POST endpoint rather than GET.

### 1b. Replace `ALLOWED_ROADS` in `scripts/build-pakistan-map-data.py`

```python
# Roads Zia Goods actually runs. These get drawn, lit, labelled, interactive.
CORRIDOR_ROADS = {
    "M-9": "M-9 — Karachi–Hyderabad Motorway",
    "N-5": "N-5 — Grand Trunk Road",
    "M-5": "M-5 — Multan–Sukkur Motorway",
    "M-4": "M-4 — Pindi Bhattian–Multan Motorway",
    "M-3": "M-3 — Lahore–Abdul Hakeem Motorway",
    "M-2": "M-2 — Lahore–Islamabad Motorway",
}

# Real roads, drawn faint and static. Density only — no labels, no interaction.
CONTEXT_ROADS = {
    "M-1", "M-8", "M-10", "M-11", "M-14", "M-15",
    "N-10", "N-15", "N-25", "N-35", "N-40", "N-45", "N-50",
    "N-55", "N-65", "N-70", "N-75", "N-80", "N-85", "N-95", "N-110",
}

ALLOWED_ROADS = set(CORRIDOR_ROADS) | CONTEXT_ROADS
```

### 1c. Update `normalize_ref` (line ~188)

It currently returns `ref if ref in ALLOWED_ROADS else None`. Keep that, but make
sure the aliases in your data are folded first — `osm-roads.json` contains both
`N5` and `N-5`, and `M-2 (L)` alongside `M-2`:

```python
def normalize_ref(ref):
    if not ref:
        return None
    ref = ref.split(";")[0].strip().upper()
    ref = re.sub(r"\s*\(.*\)$", "", ref)          # "M-2 (L)" -> "M-2"
    ref = re.sub(r"^([MN])-?(\d+)$", r"\1-\2", ref)  # "N5" -> "N-5"
    return ref if ref in ALLOWED_ROADS else None
```

### 1d. Per-length simplification

`RDP_ROADS = 1.85` is why M-11 came out as two points. Replace the constant with
a function so short roads keep their shape:

```python
RDP_BASE = 1.85
RDP_MIN = 0.45

def rdp_for(chain):
    """Loosen tolerance on long roads, tighten on short ones."""
    length = chain_length(chain)
    if length <= 0:
        return RDP_BASE
    return max(RDP_MIN, min(RDP_BASE, length / 120.0))
```

At line ~398, change:

```python
simp = rdp_iter(deduped, RDP_ROADS)
```

to:

```python
simp = rdp_iter(deduped, rdp_for(deduped))
```

### 1e. Smooth the output

Every path is currently straight `L` segments, so the roads read as faceted
polylines. Add a Catmull-Rom to cubic converter and use it in `path_from_chains`:

```python
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
```

### 1f. Emit the type

At line ~408, replace the two-tuple unpack:

```python
if ref in CORRIDOR_ROADS:
    kind, label = "corridor", CORRIDOR_ROADS[ref]
else:
    kind, label = "context", ref

roads.append({"id": ref, "label": label, "path": path, "type": kind})
```

### 1g. Cities

Drop the ones off Zia's network, add the ones on it:

```python
CITIES = [
    {"id": "karachi",    "label": "Port Qasim",  "lon": 67.3400, "lat": 24.7800, "type": "city"},
    {"id": "hyderabad",  "label": "Hyderabad",   "lon": 68.3578, "lat": 25.3960, "type": "city"},
    {"id": "sukkur",     "label": "Sukkur",      "lon": 68.8570, "lat": 27.7132, "type": "city"},
    {"id": "multan",     "label": "Multan",      "lon": 71.5249, "lat": 30.1575, "type": "city"},
    {"id": "faisalabad", "label": "Faisalabad",  "lon": 73.1350, "lat": 31.4504, "type": "city"},
    {"id": "lahore",     "label": "Lahore",      "lon": 74.3587, "lat": 31.5204, "type": "city"},
]
```

Cut `INTERCHANGES` to the handful on the corridor — Hyderabad, Sukkur, Pindi
Bhattian, Abdul Hakeem, Kala Shah Kaku. Twenty-three nodes is visual noise.

---

## Commit 2 — Retheme

### 2a. `components/hero-map/hero-map.css`, lines 1–7

```css
:root {
  --navy:        #111C44;
  --navy-deep:   #0B1433;
  --blue:        #2457FF;
  --cream:       #F8F1E4;
  --mist:        #D8E3FF;
  --amber:       #E8A33D;

  --hero-bg:     var(--navy);
  --hero-dot:    #2B3866;
  --hero-accent: var(--amber);
  --hero-label:  var(--cream);
  --hero-muted:  #6E7CAB;
}
```

### 2b. Road styles, lines ~137–153

Delete `.hero-map__road-glow` entirely and replace with a halo stroke — no SVG
filter, same visual, near-zero cost:

```css
.hero-map__road--context {
  stroke: #26335E;
  stroke-width: 0.9;
  opacity: 0.55;
}

.hero-map__road--corridor {
  stroke: var(--amber);
  stroke-width: 1.6;
}

.hero-map__road-halo {
  stroke: var(--amber);
  stroke-width: 5;
  opacity: 0.13;
  filter: none;
}
```

### 2c. Dots

```css
.hero-map__dot {
  fill: var(--hero-dot);
  opacity: 0.5;
  pointer-events: none;
}
```

### 2d. Remove the filter from the markup

In `index.html` and `components/hero-map/hero-map.html`, delete the whole
`<defs>` block containing `#highway-glow`, and rename the layer:

```html
<g class="hero-map__roads-context" data-layer="context"></g>
<g class="hero-map__roads-halo"    data-layer="halo"></g>
<g class="hero-map__roads"         data-layer="roads"></g>
```

### 2e. Copy

`Xirvo Technologies` is your agency, not the client. In `index.html`:

```html
<p class="hero__eyebrow">Port Qasim to Punjab</p>
<h1 class="hero__title">From berth to refinery gate.</h1>
<p class="hero__lede">
  A dedicated tanker fleet moving bulk edible oil inland from Port Qasim.
  Contract carriage with guaranteed capacity and rates that hold for the
  length of the agreement.
</p>
<a class="hero__cta" href="#network">Request capacity</a>
```

Also drop `text-transform: uppercase` and the `0.28em` tracking on the eyebrow —
tracked-out all-caps labels are a template tell.

---

## Commit 3 — Performance and timeline

### 3a. Split the render loop

In `hero-map.js`, where `DATA.roads.forEach` builds the paths (~line 46):

```js
DATA.roads.forEach((road) => {
  if (road.type === "context") {
    const line = el("path", {
      class: "hero-map__road hero-map__road--context",
      d: road.path,
    });
    line.dataset.roadId = road.id;
    layers.context.appendChild(line);
    return;                      // no halo, no hit area, no label
  }

  const halo = el("path", { class: "hero-map__road-halo", d: road.path });
  const line = el("path", {
    class: "hero-map__road hero-map__road--corridor",
    d: road.path,
    "data-id": road.id,
  });
  const hit = el("path", {
    class: "hero-map__hit",
    d: road.path,
    tabindex: "0",
    role: "button",
    "aria-label": road.label,
    "aria-describedby": "hero-map-tooltip",
  });
  hit.dataset.tooltip = road.label;
  halo.dataset.roadId = line.dataset.roadId = hit.dataset.roadId = road.id;
  layers.halo.appendChild(halo);
  layers.roads.appendChild(line);
  layers.hits.appendChild(hit);
});
```

Only corridor roads get dash-offset prepared. Context roads fade in as one group.

### 3b. Fix the counter

It currently animates to `53` over a fixed 1.65s — a fake progress bar that also
stops at the wrong number. Tie it to real readiness:

```js
const ready = Promise.race([
  Promise.all([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
  ]),
  new Promise((r) => setTimeout(r, 2200)),   // hard cap — never gate on animation
]);

const counter = { val: 0 };
const spin = gsap.to(counter, {
  val: 92,
  duration: 2.2,
  ease: "power1.out",
  onUpdate: () => {
    counterEl.textContent = String(Math.round(counter.val)).padStart(2, "0");
  },
});

ready.then(() => {
  spin.kill();
  gsap.to(counter, {
    val: 100,
    duration: 0.3,
    ease: "power2.out",
    onUpdate: () => {
      counterEl.textContent = String(Math.round(counter.val)).padStart(2, "0");
    },
    onComplete: startMapTimeline,
  });
});
```

### 3c. Shorten the draw

Your current sequence runs about 5.5s. Corridor roads draw together, not one
after another:

```js
load.to(contextPaths, { opacity: 0.55, duration: 0.8, ease: EASE.carry }, 0)
    .to(corridorPaths, {
      strokeDashoffset: 0,
      duration: 1.2,
      ease: EASE.carry,
      stagger: 0.1,
    }, 0.15)
    .to(nodes, {
      opacity: 1, scale: 1,
      duration: DUR.settle, ease: EASE.settle, stagger: 0.09,
    }, 0.6)
    .to(labels, {
      opacity: 1, duration: DUR.lift, ease: EASE.lift, stagger: 0.04,
    }, 1.1);
```

Six roads staggered 0.1s at 1.2s each = 1.7s total instead of 3.0s. Whole
sequence lands under 2s after the preloader.

### 3d. Viscous flow instead of electric pulse

Replace `setupIdlePulse` — 23 permanent tweens becomes 6, and the feel changes
from data to liquid:

```js
function setupFlow() {
  corridorPaths.forEach((path, i) => {
    const len = Number(path.dataset.length);
    gsap.set(path, { strokeDasharray: `54 ${len - 54}` });
    gsap.fromTo(path,
      { strokeDashoffset: len },
      { strokeDashoffset: 0, duration: 6, ease: "none", repeat: -1, delay: i * 0.5 }
    );
  });

  cityRings.forEach((ring, i) => {
    gsap.to(ring, {
      scale: 1.6, opacity: 0,
      transformOrigin: "center",
      duration: 3.2, ease: "sine.inOut",
      repeat: -1, delay: i * 0.7,
    });
  });
}
```

Note this runs on the corridor stroke itself. If you want the road to stay
solid *and* carry a travelling highlight, duplicate the corridor layer: solid
underneath, dashed amber on top.

### 3e. Label collision

With context roads unlabelled this mostly resolves itself. For the six that
remain, skip any label whose box overlaps one already placed:

```js
const placed = [];
function canPlace(x, y, w = 70, h = 14) {
  const box = { x: x - w / 2, y: y - h, w, h };
  const hit = placed.some((p) =>
    box.x < p.x + p.w && box.x + box.w > p.x &&
    box.y < p.y + p.h && box.y + box.h > p.y);
  if (!hit) placed.push(box);
  return !hit;
}
```

### 3f. Mobile

Add to the `max-width: 991px` block — context roads off, flow off:

```css
@media (max-width: 991px) {
  .hero-map__roads-context { display: none; }
  .hero-map__road-halo     { display: none; }
}
```

And guard the flow loop in JS with `window.matchMedia("(min-width: 992px)").matches`.

---

## Verify before you call it done

- Load sequence under 2.5s end to end, measured on a throttled 4G profile
- 60fps through the draw — check the Performance panel, not your eyes
- Tab through the map: six roads and six cities, all reachable, tooltip announces
- `prefers-reduced-motion` on: everything visible instantly, no motion
- Turn the amber off for a second and check the layout still reads — if the map
  only works because it glows, the composition needs work
