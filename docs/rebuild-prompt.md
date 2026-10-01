# Zia Goods — build brief (from scratch)

Paste this whole file as the first message of a fresh Claude Code session in a new, empty
repo.

**Set up the GSAP MCP server first.** Commit a `.mcp.json` at the repo root — in a remote
or cloud session that is the only route that works, because `claude mcp add` writes to a
config on the machine running the `claude` binary and the container is ephemeral:

```json
{
  "mcpServers": {
    "gsap": {
      "command": "npx",
      "args": ["-y", "@osaidrajput9/gsap-mcp"]
    }
  }
}
```

It serves the official GreenSock skills as MCP resources and cites which one each answer
comes from, targeting GSAP 3.15.

Nothing is carried over. Every asset — the map data, the geometry pipeline, the
components — is generated in the new repo from primary sources. The numbers below are
specified as values because they were arrived at by measurement, and the reasoning is
given so you can re-derive them rather than take them on faith. Where the brief says
"because", that reason is a bug that was already paid for once.

---

## ⚠ Read this before you start: the one thing that can block the build

The road network needs **OpenStreetMap via Overpass**. If you are running in a Claude
Code web session with a restricted network policy, Overpass is blocked. Measured in that
environment on 2026-09-22:

| Host | Result |
|---|---|
| `overpass-api.de`, `overpass.kumi.systems`, `z.overpass-api.de` | 403 at CONNECT |
| `geodata.ucdavis.edu` (GADM) | 403 at CONNECT |
| `www.geoboundaries.org` | 403 at CONNECT |
| `download.geofabrik.de` | 403 at CONNECT |
| `raw.githubusercontent.com` | **200** |
| `registry.npmjs.org`, `pypi.org`, Google Fonts | **200** |

So boundaries are obtainable (Natural Earth and geoBoundaries both mirror onto
`raw.githubusercontent.com`) but **roads are not**. And Natural Earth's road layer cannot
substitute: its 10m roads file has 919 features inside Pakistan's bounding box and every
one of them has `name: null`, `label: null`, `ref: null`. There is geometry but no way to
tell which line is the Grand Trunk Road, so the named corridor set cannot be built from it.

**Before doing anything else, run the probe in §2.1.** If Overpass answers, build
everything. If it does not, you have three options — take the first that applies:

1. Run this build **locally** instead of in a restricted web session.
2. Have the repo owner widen the environment's network policy to allow
   `overpass-api.de`.
3. Ask the owner to run the query in §2.3 on any machine with open network and drop the
   response at `data-raw/osm-roads.json`. That is one `curl`, and it is the only piece
   of the pipeline that needs the outside world.

Do not silently fall back to hand-drawn roads, straight lines between cities, or a
different road source. Say which option you took.

---

## 1. Stack and project setup

Start from `create-next-app` with TypeScript, Tailwind and the App Router, then trim it
to this:

```
next        ^16.3       App Router, Turbopack
react       ^19.3
gsap        ^3.15   +   @gsap/react ^2.1
tailwindcss ^4.3        CSS-first @theme tokens, no tailwind.config.js
typescript  ^5.9        strict
```

`package.json` scripts: `dev`, `build`, `start`, `typecheck` (`tsc --noEmit`), `map`
(`python3 scripts/build-pakistan-map-data.py`). **No `lint` script** — `next lint` was
removed in Next 16 and a script pointing at it is dead weight.

Zero runtime dependencies beyond the four above.

Python for the data pipeline: `shapely` only (`pip install shapely`). Everything else is
stdlib.

Before writing any Next-specific code, **read `node_modules/next/dist/docs/`** for the
areas you touch. This version has breaking changes from your training data — config
shape, conventions and file structure have all moved. `next dev` writes an `AGENTS.md`
saying the same thing; commit it with your work rather than deleting it and watching it
come back.

Before writing any GSAP, use the **GSAP MCP server** (`gsap`, eight tools):

| Tool | Use it for |
|---|---|
| `understand_and_create_animation` | structuring the load sequence from a description |
| `create_production_pattern` | a known pattern done properly — the Flip handoff in §5 |
| `get_gsap_api_expert` | confirming a plugin's real API, especially Flip |
| `generate_complete_setup` | plugin registration and the React/`useGSAP` wiring |
| `validate_gsap_code` | checking a written tween against the official skills |
| `optimize_for_performance` | the finished timeline |
| `debug_animation_issue` | anything that stutters or fires in the wrong place |
| `get_gsap_guidance` | the underlying skill text when you want to read it yourself |

Do not write GSAP from memory. Where the skills don't cover something the server says so
rather than inventing — take that at face value and reason it out in the open instead of
pretending it answered.

---

## 2. The map data pipeline

This is the expensive part of the build and the part most likely to go wrong. Do it
first, get it verified, then build the site around it. The output is one file,
`src/data/pakistan-map.json` (~128 KB), with this shape:

```jsonc
{
  "viewBox": "0 0 900 950",
  "dots":    [[x, y, depthBand], ...],        // ~4,400 entries, 1dp
  "outline": ["M… L… Z"],                     // 1 path after island culling
  "roads":   [{ "id": "M-5", "label": "M-5 · Multan – Sukkur",
                "path": "M… C…", "type": "corridor" | "context" }],
  "nodes":   [{ "label": "Multan", "lon": 71.5249, "lat": 30.1568,
                "x": 0, "y": 0, "major": 0|1, "side": "left"? }]
}
```

### 2.1 Probe first

```bash
curl -s -o /dev/null -w "%{http_code}\n" --max-time 25 https://overpass-api.de/api/interpreter
```

`200`/`400` means reachable (a bare GET with no query is a 400 — that still proves the
connection). `000` means blocked; go to the options in the banner above.

### 2.2 Boundary sources

Two, unioned, because neither alone is right.

**GADM 4.1 PAK level 0** — detailed coastline, the Indus delta and the Makran islands.
Its `features[0]` is Pakistan proper and `features[1]` is `Z06`, the Kashmir region GADM
itself files under `COUNTRY: "Pakistan"`. **Read both features.** Reading only
`features[0]` is the first way this goes wrong and it silently drops Kashmir.

```
https://geodata.ucdavis.edu/gadm/gadm4.1/json/gadm41_PAK_0.json   → data-raw/gadm41_PAK_0.json
```

If that host is blocked, geoBoundaries ADM0 is a usable stand-in and *is* reachable:

```
https://raw.githubusercontent.com/wmgeolab/geoBoundaries/main/releaseData/gbOpen/PAK/ADM0/geoBoundaries-PAK-ADM0.geojson
```

**Natural Earth 10m admin_0, Pakistan point of view** — carries the territory as Pakistan
draws it, out to 79.6°E, so Jammu and Kashmir is whole. Coarser coastline, no islands.

```
https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries_pak.geojson
  → keep the largest polygon of the feature named "Pakistan"; the other two are an
    offshore maritime claim near Gujarat and a coastal islet
  → data-raw/ne_pak_pov.json
```

**Why both.** GADM's extent stops at 77.8°E, so Kashmir comes out truncated part-way
through. Natural Earth publishes per-country point-of-view boundary sets for exactly this
situation. Unioning takes the territory from one and the coastline detail from the other
with no seam down the overlap — this is not a line drawn by hand.

Union with shapely, `.buffer(0)` on every part first to fix self-intersections, then
`unary_union`. Keep each polygon's rings **in order, exterior first then holes** — the
even-odd test in the dot builder depends on it. Drop rings with fewer than 8 coordinates.

### 2.3 Road source

```
[out:json][timeout:180];
area["ISO3166-1"="PK"][admin_level=2]->.pk;
(
  way(area.pk)["highway"~"^(motorway|trunk|primary)$"]["ref"];
);
out geom;
```

POST it to `https://overpass-api.de/api/interpreter`, save as `data-raw/osm-roads.json`.
Expect 30–60 MB. `out geom` matters — each way must carry its own coordinates. It never
reaches the browser; only the Python script reads it.

If it times out, split by bounding box and merge, and use POST rather than GET.

`data-raw/` is gitignored. Commit a `data-raw/README.md` recording these URLs, the query,
and the date fetched, so the next person can reproduce it.

### 2.4 The road set

```python
CORRIDOR_ROADS = {            # drawn amber, lit, labelled, pulsed
    "M-9":  "M-9 · Karachi – Hyderabad",
    "N-5":  "N-5 · Grand Trunk Road",
    "M-5":  "M-5 · Multan – Sukkur",
    "M-4":  "M-4 · Pindi Bhattian – Multan",
    "M-3":  "M-3 · Lahore – Abdul Hakeem",
    "M-2":  "M-2 · Lahore – Islamabad",
    "N-65": "N-65 · Sukkur – Quetta",
}

CONTEXT_ROADS = {             # scenery, drawn cool and thin
    "M-1", "M-8", "M-10", "M-11", "M-14", "M-15",
    "N-10", "N-15", "N-25", "N-35", "N-40", "N-45", "N-50",
    "N-55", "N-70", "N-75", "N-80", "N-85", "N-95", "N-110",
}
```

Normalise refs before matching: take the part before any `;`, upper-case it, strip a
trailing parenthetical (`"M-2 (L)"` → `"M-2"`), and insert the hyphen (`"N5"` → `"N-5"`).

### 2.5 Cities

Hand-placed, but stored as lon/lat and **re-projected on every run**, so a change to the
fit moves them with the map instead of stranding them in the coordinates of an older one.

```python
NODES = [
  {'label': 'Port Qasim', 'lon': 67.3399, 'lat': 24.7800, 'major': 1},
  {'label': 'Hyderabad',  'lon': 68.3584, 'lat': 25.3965},
  {'label': 'Sukkur',     'lon': 68.8566, 'lat': 27.7129},
  {'label': 'Multan',     'lon': 71.5249, 'lat': 30.1568},
  {'label': 'Faisalabad', 'lon': 73.1354, 'lat': 31.4507},
  {'label': 'Lahore',     'lon': 74.3587, 'lat': 31.5206, 'major': 1},
  {'label': 'Islamabad',  'lon': 73.0484, 'lat': 33.6848},
  {'label': 'Peshawar',   'lon': 71.5249, 'lat': 34.0150, 'side': 'left'},
  {'label': 'Quetta',     'lon': 66.9748, 'lat': 30.1804, 'major': 1, 'side': 'left'},
  {'label': 'Gwadar',     'lon': 62.3257, 'lat': 25.1265},
]
```

`major: 1` gets a pulsing ring. `side: "left"` puts the text label on the left of the
marker — labels default to the right, which on Peshawar and Quetta lays the text straight
across the corridor.

### 2.6 Projection — Web Mercator, fitted

```python
def mercator(lon, lat):
    return math.radians(lon), math.log(math.tan(math.pi/4 + math.radians(lat)/2))
```

Take the union's lon/lat bounds, project the corners, fit to the viewBox with `PAD = 26`
on every side on whichever axis binds, centre on the other. Adding Kashmir widens the
bounding box by about 15%, so the fit ends up width-bound.

**It must be Mercator.** An equirectangular projection lands nodes ~230px away from where
the roads draw, and a straight-line fit to latitude drifts up to 8.9px at Peshawar — close
enough to look plausible and wrong enough that city markers sit beside their own
motorways.

### 2.7 Dot field

Hex grid: `DX 7.6`, `DY 6.6`, `PAD 26`, odd rows offset half a step. Walk the grid,
keep the point if it is on land. Land test is **even-odd across all of a polygon's rings**
so lakes and enclaves punch through; bbox-reject per polygon first or it is unusably slow.

Round to 1dp. Expect ~4,400 dots.

### 2.8 Outline

One path per ring of the union, RDP-simplified at `eps 0.35` (the same tolerance the
roads use), emitted as `M … L … Z` at 1dp. Drop any ring whose bounding diagonal is under
`4.0px` — at this scale they are a single grey pixel and there are dozens of them.

### 2.9 Roads — the seven steps

**a. Group ways by normalised ref**, projecting each way's geometry.

**b. Stitch ways into chains on shared OSM node ids** — never on coordinate proximity, and
never reverse a way. A motorway is mapped as two parallel one-way carriageways that carry
the same ref and whose endpoints sit metres apart. Proximity-joining hops from one
carriageway onto the other and walks back where it came from. Carriageways share no nodes,
so id-matching keeps them apart. Fall back to endpoint coordinates only when a way's
`nodes` array length doesn't match its geometry length.

**c. Drop coincident chains.** Id-stitching keeps the two carriageways apart but leaves
both. They project to within a pixel of each other, so left in they double the vertex
count *and* the path length the draw and pulse animations traverse. Process chains longest
first; drop a chain when ≥90% (`COINCIDENT_FRAC`) of up to 60 sampled points lie within
`1.0px` (`COINCIDENT_PX`) of a chain already kept. Index the kept points into a 1px grid
and check the 3×3 neighbourhood — a naïve O(n²) pass is far too slow here. Requiring
*most* of the chain to coincide is what stops roads that merely touch at a junction from
being eaten.

**d. Dedupe and simplify.** Drop consecutive points closer than `0.5px`. Discard chains
shorter than `5.0px`. RDP with a **per-length tolerance**:
`max(0.35, min(1.2, chain_length / 300))` — loose on long roads, tight on short ones.

**e. Snap corridor termini to cities.** *Corridors only; context roads are scenery and
have no termini to honour.*

OSM hands you whole highways, not the leg being drawn. N-5 keeps going north-west past
Peshawar toward Torkham, so without this the corridor runs out past its own terminus and
stops in open country, and the fragments left over from chain-splitting dangle beside the
city marker. A route drawn between named cities has to land on them.

```
END_JOIN_PX = 3.0    two chain ends this close are a join, not a terminus
SNAP_PX     = 30.0   a free end this near a node belongs to that node
ORPHAN_PX   = 20.0   a free-floating chain shorter than this is debris
```

Find free ends (ends that no other chain end meets within `END_JOIN_PX`). Drop chains
where both ends are free and the whole chain is under `ORPHAN_PX`. For each free end,
search **only the outer third** of the chain for its closest approach to a node — search
the whole chain and a mid-route city clips the leg in half — then trim back to that vertex
and set it exactly equal to the node's position. Exactly, not nearly: a terminus 0.4px off
the marker is visible as a line that stops just short.

**f. Smooth.** Catmull-Rom through the simplified points at `tension 0.5`, emitted as
cubic béziers. Every chain gets its own `M` command; join a ref's subpaths with a space
into one `path` string.

**g. Collect corridor vertices** as you go — the depth map needs them.

### 2.10 Depth bands

For each dot, the distance to the nearest corridor vertex, bucketed:

```python
DEPTH_BANDS = (12.0, 25.0, 40.0, 58.0, 80.0, 108.0, 145.0)   # → bands 0..7
```

Eight bands, spaced tighter near the route. With four, the steps landed about two dot
spacings apart and read as hard edges rather than a falloff.

Use an expanding-ring spatial grid at cell size 12.0 (the first band), widening the search
ring until the best hit cannot be beaten. Brute force over 4,400 dots × ~2,000 corridor
vertices is minutes; this is seconds.

### 2.11 The script's own report

Print, every run: outline path count, dot count, a per-road table (`ref`, type, subpaths,
vertices, dropped duplicate chains), total roads and vertices, and the dot count in each
depth band. Warn on any ref in the allowed set with no geometry. **Read this output** —
it is how you catch a corridor that silently lost its geometry.

Sanity targets: **27 roads** (7 corridor + 20 context), **1 outline path**, **~4,400
dots**, no band holding more than ~40% of them.

---

## 3. Brand assets

One honest flag: a company's logo is not something to regenerate from scratch, and the
Zia Goods mark already exists as an SVG. Ask the owner for
`zia-goods-lockup.svg` plus favicons and drop them in `public/`. If they'd rather you not
ask, set the wordmark in Archivo 800 at `tracking-[-0.02em]` in cream as a placeholder and
say plainly in your summary that it is a placeholder.

The mark is a single SVG containing the ZIA GOODS wordmark, so it stands alone in the
header — a text lockup beside it would set the name twice. Render it at **44px tall**
(36px below 900px) with `shrink-0`. 44px is about its floor: the counters are set small
inside the letterforms and turn to mush below ~40px.

Favicons needed: `favicon.ico` (32px), `favicon.svg`, `apple-touch-icon.png`.

---

## 4. Design spec

### Palette — Tailwind v4 `@theme` tokens in `globals.css`

```css
@theme {
  --color-navy:       #011f7b;   /* page ground */
  --color-navy-deep:  #0b1433;
  --color-blue:       #2457ff;
  --color-cream:      #f8f1e4;   /* body text */
  --color-mist:       #d8e3ff;   /* secondary text */
  --color-amber:      #e8a33d;   /* the corridor, and nothing else warm on the page */

  /* map incidentals — not brand colours */
  --color-dot:          #5e73b4;
  --color-outline:      #364f9b;
  --color-road-ctx:     #4960a7;
  --color-road-pulse:   #ffd9a0;
  --color-rule:         #233e90;
  --color-ghost-border: #3a539e;

  --font-sans: var(--font-archivo), system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-mono: var(--font-plex-mono), ui-monospace, Menlo, monospace;
}
```

Amber is the corridor's alone. Nothing else on the page is warm, which is what makes the
route read as the one live thing on a cold map.

### Type

**Archivo** 400–800 and **IBM Plex Mono** 300/400/500, both via `next/font/google` with
`display: "swap"` and a CSS variable. Self-hosted by `next/font`, so the built site makes
**zero** third-party requests — that is a budget item in §8, not a nicety.

The mono's 300 is load-bearing: the nav pills set `font-weight: 300` and without the real
weight the browser synthesises it, which on mono at 13px thins the stems unevenly.

### Page structure

Fixed transparent header over the hero — mark left, four nav pills right. The wrapper is
`pointer-events-none` with `[&>*]:pointer-events-auto` so the map underneath stays
unobstructed. Hero is a full `100svh` flex column with `overflow-hidden` (the map is
oversized and bleeds past the viewport rather than scrolling it). Footer with a top rule.

Three stacked layers inside the hero, back to front: gradient field `z-0` → map `z-1` →
scrim `z-1` → content `z-2`.

Copy column (`max-w-620px`, left):

| Element | Spec |
|---|---|
| eyebrow | mono 15px amber, `tracking-.11em`, `Nationwide coverage`, preceded by a 34px amber hairline at 70% |
| h1 | `clamp(40px, 5.6vw, 80px)`, weight 800, `leading-.99`, `tracking--.035em`, two mask-clipped lines: *From berth to* / *refinery gate.* |
| sub | 17px mist, `leading-1.6`, `max-w-50ch` |
| CTAs | `Request capacity` (primary) · `See our network` |
| stats | 4-up `dl` over a rule — **22** Dedicated oil tankers · **20** Years in edible oil · **14** Highways served · **7** Core inland corridors |

Body copy: *"Bulk edible oil moved on contract across Pakistan's motorway and national
highway network, from Port Qasim to every major refining centre."*

The h1's tracking is tighter than a 600-weight setting would want: at 800 the counters
close up on their own, so default spacing reads loose.

Nav labels: Services · Network · Contract carriage · Contact. Repeated in the footer
alongside `© 2026 Zia Goods. Bulk edible oil freight, nationwide.`

### Shared geometry

The header's nav is aligned to the map's left edge, so both must derive from the same
numbers. A hard-coded margin silently drifts the moment the map is resized.

```css
:root {
  --map-h: 94svh;                        /* 86svh below 1400px */
  --map-w: calc(var(--map-h) * 900 / 950);   /* 900/950 is the viewBox aspect */
  --map-inset-right: 4vw;
  --nav-map-gap: 24px;
  --page-pad: 44px;                      /* 22px below 900px */
  --glass-strength: 1;
  --glass-weight: 300;
}
```

The map steps back to 86svh below 1400px because it is sized by height but constrained by
width: the same `--map-h` reaches much further into the copy column on a narrower desktop
— 119px inside the text at 1280 against 51px at 1440. The map gives way, not the copy.

The nav's right margin is computed from `--map-w` so `Contact` stops just short of the
country instead of sitting over it. It also needs a floor, because on a narrow desktop
map-alignment drags the nav left through the logo and flexbox resolves that by squashing
the logo rather than stopping.

**Do not solve that floor with a measured constant.** The reference build hard-coded
`--nav-w: 557px`, read off the rendered nav, which goes stale the moment a label or the
type scale changes — and did, silently, once already. Derive it: a grid whose right track
is `--map-w`, or `fit-content` plus `min()` against intrinsic size. Whatever you pick,
verify the logo still renders at 44px at 1280×800.

### Liquid glass

One `.glass` base plus three modifiers, every layer multiplied by `--glass-strength` so a
single number genuinely takes the effect from nothing to full rather than just fading a
tint.

```
backdrop      blur(14px · g) saturate(100% + 70% · g)
body          rgba(216,227,255, .07 · g)
border        1px rgba(216,227,255, .15 · g)
top rim       inset 0  1px 0 rgba(255,255,255, .20 · g)    ← reads as thickness
bottom rim    inset 0 -1px 0 rgba(1,15,60,   .32 · g)
lift          0 6px 18px rgba(1,12,52, .30 · g)
radius        999px,  isolation: isolate
```

`.glass--pill` 7/13 padding, `font-weight: var(--glass-weight)`. `.glass--cta` 13/28.
`.glass--primary` is cream at `.06 + .86 · g` with navy label text — at a low tint the
primary sinks to the same visual weight as the secondary and the CTA row loses its
hierarchy. It keeps the blur, the rim and the sheen; only the body goes opaque.

The "liquid" is the sheen: a narrow diagonal highlight on `::before` at
`linear-gradient(105deg, transparent 34%, rgba(255,255,255,.16·g) 47%, transparent 62%)`,
`background-size: 260% 100%`, parked at `background-position: 130% 0` and transitioned to
`-30% 0` over `760ms cubic-bezier(.16,1,.3,1)` on hover. It is a background-position
transition on a pseudo-element, so it costs no layout and no JS — **the nav links and the
CTAs stay server components.**

`:active` scales to `.97`. Hover rules go behind
`@media (hover: hover) and (pointer: fine)` so they never latch on touch. All transitions
off under `prefers-reduced-motion`.

### Nav link hover

The label wipes left-to-right from mist to amber. Two stacked copies of the string, both
`aria-hidden` (the anchor carries the `aria-label`, so a screen reader gets the name once,
not twice); the amber copy is clipped to `w-0` and grows to `w-full` over
`.85s cubic-bezier(.16,1,.3,1)`. Wrap the label in non-breaking spaces so the wipe starts
and finishes just clear of the glyphs rather than flush against the first and last letter.

Three traps, all already paid for:

- **Animate width, never translate.** A transform slides the glyphs out of register with
  the resting copy underneath, and mid-wipe the two read as separate words.
- **Clip and padding must be on separate elements.** `overflow: hidden` clips to the
  *padding box*, not the content box, so padding on the clipped element leaves a padding's
  width of amber showing at `w-0`. It reads as a stray amber tint on the first letter of
  every nav item at rest. Outer span = bare zero-width clip, inner span = the padding.
- **Solid fills on both copies.** Do not attempt `-webkit-text-stroke` outline type for
  the resting state. It needs roughly 20px before it holds together; at a 13px nav the
  sub-pixel stroke straddles the pixel grid, and with no fill inside the counters the
  browser has nothing to hint against, so the glyphs come apart into speckle.

The amber glow is `text-shadow: 0 0 10px rgba(232,163,61,.45)`, not a `drop-shadow`
filter — a filter rasterises the text to an offscreen buffer first and small type does not
survive that round trip cleanly.

Pure CSS on purpose. Routing four hover states through GSAP would put four listeners and a
tween on the main thread for something the compositor does on its own.

### The map component

A **server component**. ~4,400 circles and 27 paths render to static HTML at build time,
so the 128 KB of JSON never reaches the browser; the motion layer selects by id afterwards.

Group order, back to front, each with a stable id:

```
#m-dots → #m-outline → #m-ctx → #m-bloom → #m-halo → #m-cor → #m-pulse → #m-nodes
```

Class names **must** be prefixed — `.map-boundary`, `.map-ring`, `.map-layer`. Bare
`.outline` and `.ring` collide with Tailwind utilities of the same name and you get a 1px
CSS outline around every boundary path and a ring box-shadow on every city marker.

Keep the map CSS as plain CSS rather than utilities: it sets SVG presentation properties
(`fill-opacity`, `r`, `stroke-linejoin`) that Tailwind has no utilities for, and it applies
to thousands of generated elements where a class list per element would bloat the document.

Depth ladder — carried on **`fill-opacity`, not `opacity`**, because the load timeline
animates `opacity` on these same circles and the two need to multiply so the gradient
survives the reveal. `r` as a CSS geometry property is the enhancement; the `r` attribute
(1.55) is the fallback.

```
d0  fill #707aa4  .95  r1.90        d4  .68  r1.70
d1  fill #6777ac  .88  r1.84        d5  .63  r1.66
d2  fill #6275b0  .81  r1.79        d6  .59  r1.62
d3                .74  r1.74        d7  .55  r1.58
```

Only d0–d2 carry a warm tint. Mixing amber through the whole ladder desaturates the dots
into grey rather than warming them; d3–d7 inherit the cool base `#5e73b4` and carry depth
on opacity and radius alone.

**The floor is 0.55.** Depth is measured from the corridor, and Kashmir is the part of the
country furthest from it — 375 of its 392 dots land in the two faintest bands and none in
the nearest five. At a 0.34 floor the north-east renders as bare outline and reads as
missing from the map. Near-to-far goes 2.8:1 → 1.7:1 and the route still clearly owns the
focal plane.

**Never dim the dots with an `opacity` on the group.** That makes the browser render all
~5,800 circles to an offscreen buffer and composite it, every frame the corridor pulse
moves. Scale the per-band values instead.

Corridor rendering is **stacked strokes, not an SVG blur filter**:

```
.road-bloom  amber  26px  opacity .075     .road-cor    amber  1.9px
.road-halo   amber   9px  opacity .2       .road-pulse  #ffd9a0 2.4px
.road-ctx    #4960a7 1.15px opacity .9     .map-boundary #364f9b .75px
```

Same read, near-zero cost on mid-range mobile. The **only** filter left on the page is a
`drop-shadow(0 0 5px rgba(232,163,61,.6))` on the twelve static city cores — rasterised
once and never touched again. A `drop-shadow` on `#m-cor` or `#m-pulse` looks identical
standing still and costs a re-rasterisation of that whole layer on every frame the pulse
moves; measured at roughly half the page's frame budget.

City markers: `major` nodes get a `.map-ring` (r9, amber, 50%) plus a `.core` (r3.4
amber); minors get a `.core-min` (r2, mist at 80%). Labels are mono 11px mist at
`opacity .62`, offset ±12px per the node's `side`, `text-anchor` set to match. 0.62 rather
than 0.8: behind centred copy these labels cross the stats row and at 0.8 they read as a
second column of text competing with it.

### Background stack

`.hero-scrim` — two gradients on one element:

```css
linear-gradient(to right,  rgba(1,12,52,.9) 0%, rgba(1,15,66,.72) 26%,
                           rgba(1,24,98,.3) 42%, rgba(1,31,123,0) 56%),
linear-gradient(to bottom, rgba(1,31,123,.42) 0%, rgba(1,31,123,0) 18%,
                           rgba(1,31,123,0) 84%, rgba(1,31,123,.55) 100%)
```

The horizontal pools darkness under the copy column and buys the type its contrast back;
the vertical keeps the top clear of the fixed header and fades the map out before it
reaches the footer rule so nothing hard-cuts at the section edge.

Below 900px the scrim becomes a **flat vertical veil** and `.map-layer` drops to
`opacity .66`. There is no left column to protect on a phone — the copy spans the width,
so the horizontal wash would darken the wrong half.

`.map-glow` — two amber radials under the corridor: a tight core
(`ellipse 20% 40% at 72% 44%`, amber at .14) over the route's bulk through Punjab, and a
wide faint halo (`ellipse 34% 58% at 70% 50%`, amber at .055) so the falloff doesn't end
on a visible edge. On its own element under the SVG, not a filter on the route, so the
glow reads *through* the dot field rather than only around the stroke.

---

## 5. Motion

### `src/lib/motion.ts` — the single source of truth

**No GSAP easing string and no duration number appears anywhere else in the codebase.**
Every animation imports from here. When a value changes, it changes once.

```ts
EASE = {
  settle: "power2.out",   // arrives with weight, stops clean — the default
  snap:   "power4.out",   // fast and precise — user-triggered
  carry:  "power1.inOut", // long steady travel — large objects
  lift:   "power2.out",   // small rise into place — text, cards
  flow:   "sine.inOut",   // viscous, looping — route fill, breathing
  hold:   "none",         // no easing of its own — scrubbed or linear loops
  veil:   "power2.inOut", // cross-dissolve — preloader handing off
}
DUR = { settle: .6, snap: .4, carry: 1.2, lift: .5, flow: 5 }
STAGGER = .08    LIFT_Y = 30 (always from below, one direction sitewide)    START = "top 80%"
```

`gsap.defaults({ ease: EASE.settle, duration: DUR.settle })` at module scope, so a
forgotten easing degrades to the house style rather than to GSAP's `power1.out` at 0.5s.

```ts
HERO = {
  preloaderDotStagger: .00055,  preloaderCountDuration: 3.1,  preloaderFadeDuration: .6,
  mapDotStagger: .0006,         outlineDuration: .8,
  contextRoadDuration: 1.6,     contextRoadStagger: .012,
  corridorRoadDuration: 1.8,    corridorRoadStagger: .02,
  nodeStagger: .07,             headlineDuration: .8,        statCountDuration: 1.3,
  pulseDuration: 7,             pulseStaggerStep: .9,
  ringPulseDuration: 3.4,       ringPulseStaggerStep: .8,
}
```

Also export `prefersReducedMotion()`, a `withMotion(build, applyFinalState)` wrapper, and
`refreshOnLayoutShift()` — refreshes ScrollTrigger on `document.fonts.ready` and on a
200ms-debounced resize, returns its own cleanup. Call it from the client, **never at
import time**, so the module stays safe to pull into a server component.

Register ScrollTrigger behind `typeof window !== "undefined"`.

### The load sequence

One client component that renders `null` and drives everything by id — that is what keeps
the map JSON server-side.

1. **Preload.** The dot field lights up on a `.00055` stagger; a counter runs 00→100 over
   3.1s on `EASE.carry` with a hairline progress bar driven off the same tween; label
   `MAPPING NETWORK` in amber mono at `tracking-.2em`.
2. **Reveal**, on the counter's `onComplete`, as one overlapping timeline: preloader
   fades out (`veil`, .6) → hero fades in (`-=0.4`) → map dots stagger up (`-=0.3`) →
   outline fades in (`-=0.4`) → context roads draw (`-=0.5`) → bloom + halo + corridor
   draw together (`-=1.2`) → city nodes fade in (`-=1.1`) → headline lines slide up out of
   their masks (`-=1.6`) → sub (`-=0.5`) → actions (`-=0.35`) → stats (`-=0.35`) → stat
   numbers count up (`-=0.2`) → pulse loop starts (`-=1.0`).
3. **Pulse loop.** A `40 / len-40` dash travelling each corridor on `EASE.hold`, `repeat: -1`,
   staggered .9s apart; and the three `major` rings expanding r9→17 and fading on
   `EASE.flow`, staggered .8s.

Draw-on is `stroke-dasharray` / `strokeDashoffset` from `getTotalLength()`. That setup has
to run client-side even though the paths are server-rendered — it needs real rendered
geometry. Stash the length on `dataset.len` so the pulse loop can reuse it.

Count-ups animate a proxy object and write `Math.round` into `textContent`, so the DOM
sees integers and the numbers stay `tabular-nums`.

**Reduced motion** gets a real finished page via `applyFinalState`: preloader
`display: none`, hero and all map layers at `opacity 1`, every `strokeDashoffset` at 0,
headline at `yPercent 0`, soft-enter elements at `opacity 1, y 0`, stat numbers set to
their final values. Not a blank page and not a frozen preloader.

### Render the dot field once

The reference build rendered the field **twice** — once in the preloader, once in the map
— which cost ~4,400 duplicate circles and an equal number of tweens, and made the handoff
a cross-dissolve between two unrelated SVGs.

Do it once. Use **GSAP Flip** to move the single field from the preloader's state (centred,
`w-[min(52vw,46vh)]`, mist, uniform) into the hero's (right-aligned, `--map-h` tall,
depth-banded). Consult the GSAP MCP server for the correct Flip structure across a DOM reparent:
`get_gsap_api_expert` for Flip's real API, then `create_production_pattern`, then
`validate_gsap_code` on what you write. The
handoff then reads as one continuous object rather than two things swapping, and the
duplicate DOM disappears entirely.

If Flip does not come out clean, fall back to two SVGs — but then the preloader field must
be **half-sampled on a checkerboard by grid position**:

```ts
const row = Math.round((y - 26) / 6.6);
const col = Math.round((x - 26 - (row % 2 ? 3.8 : 0)) / 7.6);
return (row + col) % 2 === 0;
```

Checkerboard specifically. The preloader draws into a ~414px box on a 1440px viewport — a
0.46 scale, putting dots at 1.56px across and 3.5px apart, finer than the screen resolves.
Dropping whole rows leaves visible horizontal striping; dropping both axes thins it to a
quarter and visibly weakens the silhouette; and striding over the *array* cuts diagonally
across rows and leaves moiré banding instead of an evenly thinned field.

Either way, say in your summary which one you shipped.

---

## 6. The gradient field

A raw WebGL1 fragment shader behind the hero, in a client component.

**Fullscreen triangle**, not a quad: three vertices instead of six, one triangle instead of
two, no seam down the diagonal, and the parts hanging outside the viewport clip for free.
Buffer is `[-1,-1, 3,-1, -1,3]`.

**Domain-warped value-noise fbm** — fbm feeds its own coordinates back into itself twice,
which bends the bands into soft folded shapes a plain fbm cannot make. **Three octaves**
(`p *= 2.03`, `a *= 0.5`): the warp already breaks up the banding a fourth would hide, and
every octave is paid five times per fragment — twice for the warp, twice for the second
warp, once for the field.

```glsl
const vec3 C_DEEP = vec3(0.004, 0.059, 0.231);
const vec3 C_BASE = vec3(0.004, 0.122, 0.482);
const vec3 C_LIFT = vec3(0.012, 0.200, 0.722);
const vec3 C_EDGE = vec3(0.020, 0.302, 0.941);

vec3 col = mix(C_DEEP, C_BASE, smoothstep(0.20, 0.66, f));
col = mix(col, C_LIFT, smoothstep(0.54, 1.00, f) * 0.62);
col = mix(col, C_EDGE, smoothstep(0.80, 1.06, f + 0.12 * r.x) * 0.22);
col = mix(C_BASE, col, uIntensity);   // settle out of flat navy
```

Sample at `p * 1.35 + uOffA` for the first warp, `p * 1.80 + uWarp*q + …` for the second,
`p * 1.55 + uWarp*r` for the field. Correct the x axis for aspect (`p.x *= uRes.x/uRes.y`).
Guard precision with `#ifdef GL_FRAGMENT_PRECISION_HIGH`.

**Measure saturation as `(max-min)/max`, not as an absolute channel spread.** Absolute
spread shrinks with darkness even when saturation is identical, which makes a dark navy
look like the problem when it isn't — that mistake sent a whole round of tuning at the
wrong colour stop. Against a ground at 0.99, the two bright stops must also sit near 0.98.
Desaturated blue at the crests is pale blue, and pale blue drifting across a saturated
navy is exactly the white haze this gets reported as.

Four rules for the loop:

- **GSAP owns every value.** One tween runs `phase` 0→1 on repeat; `gsap.ticker` turns it
  into uniforms and draws. No clock inside the shader, no CSS animation, no bare `rAF`.
  The field then obeys the same timeline controls and the same reduced-motion switch as
  everything else on the page.
- **Seamless, not wrapping.** Every animated value is a point on a circle travelled a whole
  number of times per cycle (`a = τφ`, `b = 2τφ + 1.7`, `c = τφ - 0.9`), so phase 1 and
  phase 0 describe the same field exactly. A linearly-advancing clock gives you a visible
  jump at the wrap. The trig is per frame on the CPU, not per fragment on the GPU.
- **Linear easing.** `EASE.hold` on the loop — any easing makes the field visibly slow down
  and speed up once per cycle and gives the repeat away.
- **Never read `clientWidth` from the ticker.** That forces a style and layout flush every
  frame to re-learn a number that only changes when the window does — the single most
  expensive thing this component could do. A `ResizeObserver` delivers it instead.

Sizing: `min(devicePixelRatio, 1.5) × 0.55`, hard-capped so the drawing buffer's long edge
never exceeds **720px**. The field is all low-frequency gradient and survives being drawn
well under device resolution and upscaled; without the cap a 4K display pays for 4K of
noise to show a soft gradient.

**Degradation.** If WebGL is missing or the program fails to compile or link, set
`display: none` on the canvas — the navy page background showing through *is* the shader's
own `C_BASE`, so the fallback is the field's floor rather than a different design. A canvas
with `alpha: false` that is never drawn to composites as **opaque black**, so a half-way
bail paints a black slab over the hero, which is worse than not being there. Route every
failure path through one `bail()`, and clear `display` at the top of every setup so a good
mount after a bad one recovers.

**Do not call `loseContext()` in cleanup.** `getContext()` returns the same context for the
life of the canvas element, and React reuses that element across a remount — StrictMode
remounts every component once in development on purpose. Losing the context on the first
teardown leaves the second setup linking against a dead context, which fails and bails, so
the field is simply *gone* in `next dev` while production looks fine. Delete the program,
both shaders and the buffer; leave the context alive.

Under reduced motion: `uIntensity = 1`, draw one frame, return. Movement is what's
reduced, not the background.

---

## 7. Dev tuning panel — optional, and only on these terms

You do not need one; the constants in `motion.ts` are already tuned. If you add one
anyway, the import graph is the entire point:

- **`src/lib/live.ts`** holds mutable copies of the tunable constants, **seeded from
  `motion.ts`** so what renders is exactly the shipped configuration. Render paths read
  this object — the shader's draw loop reads it every frame, so a change lands on the next
  frame with no React re-render.
- **Exactly one module** imports the tuning library, and it holds every panel and the
  library's stylesheet.
- That module is reached only through
  `dynamic(() => import("./DevPanels"), { ssr: false })` behind
  `if (process.env.NODE_ENV === "production") return null`. Next inlines `NODE_ENV`, the
  branch folds to `null`, and the chunk is never requested.

Wiring a tuning hook directly into render components put **664 KB** into the production
bundle (395 KB library + 269 KB its `motion` peer) for a panel that is hidden in production
anyway. That is more than the entire rest of the site.

Two further traps if the library is DialKit or similar:

- Its stylesheet opens with a **remote `@import`** (Google Fonts). Imported at top level
  that lands in the page's main stylesheet and your zero-off-origin budget is gone. Strip
  it with a PostCSS plugin *as well as* splitting the chunk — the two failure modes are
  independent.
- Resolve that plugin's path with
  `fileURLToPath(new URL("./plugin.cjs", import.meta.url))`. Turbopack's PostCSS loader
  resolves plugin keys from its own working directory, not from the config's, so a plain
  relative string fails to resolve.
- Panel writes to `LIVE` go in a `useEffect`, not in render.

---

## 8. Performance budget

Add `scripts/budget.mjs`, run it as part of `npm run build`, and fail the build on a
breach:

```
JS transferred       < 600 KB
HTML                 < 1.4 MB
DOM nodes            < 7,000
Off-origin requests    0        (next/font self-hosts; nothing else may phone out)
```

The reference build lands at 568 KB JS, 1,368 KB HTML, 6,782 DOM nodes. A single-field
Flip build should come in meaningfully under the node count.

---

## 9. File layout

```
src/app/layout.tsx              fonts, metadata, header, footer
src/app/page.tsx                <Hero />
src/app/globals.css             @theme tokens, :root geometry, .glass, map CSS
src/components/Hero.tsx         server — the three layers + copy column
src/components/PakistanMap.tsx  server — the SVG
src/components/Preloader.tsx    server
src/components/NavLink.tsx      server — the wipe pill
src/components/HeroMotion.tsx   client — renders null, drives the timeline
src/components/GradientShader.tsx  client — the WebGL field
src/lib/motion.ts               the motion vocabulary
src/data/pakistan-map.json      generated by the script
scripts/build-pakistan-map-data.py
scripts/budget.mjs
data-raw/                       gitignored; README records sources + query + date
```

Everything that can be a server component is one. The only two client components are the
two that genuinely must be.

Metadata: title `Zia Goods — nationwide edible oil freight`, description as the hero sub,
icons wired to the favicons.

---

## 10. Verification — measure, don't assert

**Take a real screenshot at 1440×900 and at 390×844 and look at it** before reporting
anything as done. On the reference build, five separate "not visible" reports turned out to
be real rendering bugs rather than stale builds. Presence in the DOM is not legibility.

On a **production** build:

- [ ] preloader clears; `#hero` reaches `opacity: 1`
- [ ] shader canvas is `display: block` and painting — sample a pixel, it must not equal the
      navy page background
- [ ] ~4,400 map dots, 7 corridors, 20 context roads, 1 outline path, 10 city nodes
- [ ] stats read `22 / 20 / 14 / 7`
- [ ] **Kashmir is present and legible** in the north-east, not bare outline
- [ ] **every corridor terminates exactly on a city node**, not near one — zoom in on
      Peshawar and Quetta specifically
- [ ] no dangling road stubs anywhere
- [ ] nav pills show **zero** amber at rest; the wipe covers the full pill on hover
- [ ] `backdrop-filter` is live on both nav pills and CTAs
- [ ] logo renders at 44px at 1280×800, not squashed
- [ ] **zero** off-origin network requests
- [ ] `npm run typecheck` and `npm run build` both clean

Then run the **whole thing again in `next dev`** — StrictMode's double-invoke breaks things
production never sees, and the WebGL context bug in §6 only ever appeared there.

Then set `prefers-reduced-motion: reduce` and confirm a complete, static, fully-readable
page.

**On FPS numbers:** if you are measuring inside a container you are on a software
rasteriser (SwiftShader), and the numbers say nothing about real hardware. Layer promotion
(`translateZ(0)`, `will-change`, `contain: paint`) measured *worse* there — expected when
there is no GPU compositing to win, and evidence of nothing. Report that caveat rather than
presenting the number as a result.

---

## 11. Working agreement

- Build in this order: **data pipeline → verify the map → layout and type → glass and nav →
  motion → shader → budget.** The map is the long pole and everything else is cheap to
  redo; do not leave it until last.
- Commit in logical steps with real messages. Do not open a PR unless asked.
- When something here is ambiguous, pick the option the reasoning points at, say which you
  picked, and keep going. Don't stop and ask.
- If you disagree with a number, say so in a sentence and then implement it as specified.
  Every one of them replaced something that looked fine and measured wrong.
- Report honestly. If you could not reproduce a problem, say that instead of shipping a
  speculative fix and calling it solved. If you skipped something, say what and why.
