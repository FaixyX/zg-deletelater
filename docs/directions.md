# Three design directions — round 2

Round 1 (the static Contract Ledger, Motorway Gantry and Survey Atlas) is superseded. You asked for motion
design, scroll-based response and a premium feel, grounded in real research. All three directions below are
built and scroll-driven at `/lab/directions`.

**Inputs:**
- [PRODUCT.md](../PRODUCT.md)
- [audit](audit.md)
- [inspiration, round 2](inspiration.md): nine sites, captured and scrolled in a real browser

**Shared ground rules:**
- **Real material only.** The route is the actual OSM and GADM geometry. Port Qasim → Hyderabad → Sukkur → Multan
  → Faisalabad → Lahore is stitched by `scripts/build-lab-route.py` from M-9, N-5, M-5, M-4 and M-3. The figures
  are the confirmed 22 / 20 / 14 / 8. The cargo copy is the existing copy. No distances or claims are invented.
- **Motion stack:**
  - GSAP 3.15: ScrollTrigger, SplitText, DrawSVG, MotionPath.
  - Lenis smooth scroll, driven from GSAP's ticker per the GSAP MCP server's pattern.
  - `useGSAP` for cleanup, `matchMedia` for reduced motion. ScrollTriggers sit only on top-level timelines.
  - Validated with the GSAP server.
- **Reduced motion** gets a complete still page in every direction: no pins, no scrubs, everything at its finished
  state.
- **Contact:** both contact paths ("Request capacity", "Call or WhatsApp") have equal weight. The motto appears in
  Roman Urdu and Nastaliq.
- **Typefaces** are all SIL OFL, self-hosted by `next/font`.
- **Contrast:** WCAG ratios are computed from the hex values. Every text pair is at least 5:1.

---

## 1. The Run: `/lab/directions/run`

**Idea.** Scroll is the throttle. A drawn Zia Goods tanker drives Port Qasim to Lahore, leg by leg, and the page
streams past it.

**Hero.** "TWENTY YEARS." / "NATIONWIDE." in very large condensed type, with the second line in outline. The tanker
rolls in from the left on load with its wheels turning, and settles on the road.

**Signature: the drive** (pinned over about five screens, scrubbed):
- The road, its lane dashes and the roadside posts stream past the tanker at different speeds (parallax), and the
  wheels turn with the scroll.
- At each leg a **gantry sign** passes overhead: M-9 to Hyderabad, N-5 to Sukkur, M-5 to Multan, M-4 to
  Faisalabad, M-3 to Lahore.
- A **leg readout** (Leg 02 / 05 · N-5 · Hyderabad → Sukkur) and a five-segment progress bar track the trip.
- A **mini-map** draws the real route and a marker follows it with MotionPath.
- The current city's name stands behind the truck as giant outlined type.

**Close.** "Every leg, every load, on contract." The figures sit in a ruled table, not counters.

| Colour | Hex | Role | Contrast |
|---|---|---|---|
| Night | `#0B1440` | ground | — |
| Deep | `#070D2C` | road | — |
| Cream | `#F3ECDD` | type, the tanker | 15.0:1 on night |
| Mist | `#A9B6E6` | secondary text | 8.9:1 |
| Signal | `#5B7FFF` | route, progress | 5.0:1 |
| Amber | `#E3A23F` | lane centre line only, after the mark's own road | 8.6:1 on deep |

**Type.**
- **Big Shoulders** 800–900 for display. It is a condensed grotesque descended from Chicago's signage, so it feels
  like roadside lettering.
- **Hanken Grotesk** for body.
- **Martian Mono** for readouts.
- Display runs `clamp(80px, 15vw, 268px)` at line-height 0.8.

**Motion overall.** Mechanical and continuous. Linear (`none`) easing wherever scroll drives distance. A short
`power4.out` for text rising out of masks. Lenis lerp 0.09.

**Informed by:**
- United Carriers: the scrubbed truck and live readout.
- CargoKite: the vehicle as technical line art.
- Truck'N Roll: confident condensed type.
- Codrops: the route drawing and following marker.

**Departs** by using a side elevation of Zia Goods' own tanker in line art rather than 3D stock, real named legs
rather than a speedometer, and the real route map.

**Risk.** The most "show": it needs a light hand in production so the drive never feels long. On a slow phone, the
pinned section is the heaviest of the three.

---

## 2. Ledger in Motion: `/lab/directions/ledger`

**Idea.** The contract is the product. Cream paper, ink type and a waybill. This is round 1's Contract Ledger
(which you picked), rebuilt with motion.

**Hero.**
- The waybill rules draw left to right.
- The headline "Twenty years on the road, *nationwide.*" is written in **word by word** out of masks (SplitText).
- The seal **turns in and lands**, then keeps turning a quarter turn per screen as you scroll, like a stamp being
  lined up.
- Port Qasim's coordinates run along the top as micro-type.

**Signature: the contract, read sideways** (pinned, scrubbed):
- Schedule A and the five cargo clauses travel horizontally.
- Each clause's ghost numeral (01–05) drifts against its panel.
- Between clauses 3 and 4 **the paper turns to ink** in one quick flip.
- On the last panel, "Twenty years, *every clause kept*", **the seal comes down**: it drops in large and lands with
  a ring.

**Close.** The record (22 / 20 / 14 / 8) in light serif numerals, then "Put your lane *on contract*."

| Colour | Hex | Role | Contrast |
|---|---|---|---|
| Paper | `#F5EEDF` | ground | — |
| Ink | `#0C2467` | text | 12.4:1 on paper |
| Deep | `#071544` | ink state, close | paper on deep 15.2:1 |
| Stamp | `#2146C7` | seal, emphasis | 6.6:1 on paper |
| Stamp light | `#9FB3FF` | emphasis on deep | 8.6:1 on deep |
| Seal amber | `#B8791A` | one dot on the seal | graphic only |

**Type.**
- **Newsreader** for display and text, including italics.
- **Public Sans** for UI.
- **IBM Plex Mono** for slip data.
- Hero `clamp(60px, 10vw, 180px)` at line-height 0.92.

**Motion overall.** Quiet and weighted, with deceleration only (`power3`/`power4.out`, `expo.out` for the seal).
The only scrubbed movement is the sideways contract. Lenis lerp 0.085.

**Informed by:**
- WeEvolveIT: the sequence with ghost numerals and a colour shift.
- Rapide: coordinates as texture.
- Wembi: numbered structure.

**Departs** with paper and serif rather than dark mono, numbers that are real clause numbers, and the seal as the
one moment of drama.

**Risk.** The quietest of the three. It is premium through restraint, and depends on beautiful copy.

---

## 3. Cobalt Atlas: `/lab/directions/atlas`

**Idea.** One map, one camera. The real road network, drawn in cream hairlines on vivid cobalt, is the hero, and
then it becomes the camera.

**Hero.**
- The country's outline draws itself.
- The 20 context roads fade in at random.
- The 8 corridors draw.
- "Twenty years, nationwide." rises line by line in Libre Caslon.
- A survey frame, a live coordinate readout and a scale bar surround the map.

**Signature: the flight** (pinned over about seven screens, scrubbed):
- The copy steps aside and the camera **dives into Port Qasim**.
- It **follows the real route north**, with the line inking in behind it, through Hyderabad, Sukkur, Multan,
  Faisalabad and Lahore.
- Each stop gets a chapter card: the city in large Caslon, its coordinates, and the road taken.
- The coordinate readout updates at each stop.
- The camera **pulls back to the whole country**, all eight corridors light, and "Nationwide." lands with the figures.
- Strokes are non-scaling, so lines stay hairline at any zoom, and labels are counter-scaled.

**Close.** Cream band: "Name the lane. We'll draw the line."

| Colour | Hex | Role | Contrast |
|---|---|---|---|
| Cobalt | `#1E3CC0` | ground | — |
| Cream | `#F2EBDC` | map ink, type | 7.2:1 on cobalt |
| Pale | `#C6D1FF` | secondary text | 5.7:1 on cobalt |
| Deep | `#0D1E66` | text on cream | 12.7:1 on cream |

**Type.**
- **Libre Caslon Display**, a classic map-lettering serif, for display.
- **Schibsted Grotesk** for UI and labels.
- Hero `clamp(56px, 7.6vw, 136px)`, city cards up to 132px.

**Motion overall.** Cinematic and slow: `power2.inOut` camera moves, linear while following the road, and a
scrub of 1 for weight. Lenis lerp 0.08.

**Informed by:**
- Codrops: the scroll-driven SVG map camera.
- United Carriers: map as hero, and the readout.
- Rapide: coordinates.
- Truck'N Roll: bold single-colour field.

**Departs** with real survey data in printed-atlas hairlines rather than a glowing globe or dot-field, and a vivid
cobalt rather than black.

**Risk.** Map-led, so it leans on the GADM permission being confirmed. It is the closest of the three to the old
site's idea, the map, but has none of its look.

---

## Comparison

| | 1. The Run | 2. Ledger in Motion | 3. Cobalt Atlas |
|---|---|---|---|
| Subject | the tanker on the road | the contract | the network from above |
| Ground | night navy | cream paper → ink | vivid cobalt |
| Display type | condensed grotesque | book serif | map serif |
| Signature | scroll-driven drive with gantries | sideways contract, seal stamps | camera flight along the corridor |
| Feel | bold, kinetic | calm, exacting | cinematic, expansive |
| Message it lands best | "we run these roads" | "we honour contracts" | "twenty years, nationwide" |

## Recommendation

**3 or 1.** The Atlas is the most premium-feeling and lands the client's ten-second belief ("twenty years,
nationwide") with the one picture only Zia Goods can draw. The Run is the most memorable and the closest in spirit
to United Carriers, the client's own favourite.

A strong production hybrid is the **Atlas hero and flight plus The Run's tanker** in the services section. The Ledger
is the safest choice, and its seal and clause pattern would also make a good contract-carriage page in either of the
other two.
