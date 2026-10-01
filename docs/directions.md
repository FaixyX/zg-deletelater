# Three design directions

Inputs: [PRODUCT.md](../PRODUCT.md), [audit](audit.md), [inspiration](inspiration.md).

**Brief in one breath.** Mill owners deciding on a contract should believe within ten seconds that Zia Goods
has hauled for twenty years, nationwide. It should feel reputable, honouring contracts, and growing. It must never feel
careless about detail. The palette is generated around blue and cream-white. The ZG mark and the motto (Roman Urdu and
Urdu script) are fixed. The old site (dark navy, all-mono, glowing dot-map, glass pills, preloader) is an anti-reference.

**Shared rules for all three.**
- Contrast ratios below are WCAG, computed from the hex values. Body text is at least 4.5:1, and decorative rules and strokes are marked.
- All typefaces are SIL OFL, self-hosted by `next/font/google`: free for commercial web use.
- Motto: *Dekh magar pyar se* in the display face, and دیکھ مگر پیار سے in Noto Nastaliq Urdu (OFL) with generous line-height.
- Amber appears only where the ZG mark already carries it, as a small accent, never as a glow.
- Copy is the real copy, with no invented claims: 22 tankers, 20 years, 14 highways, 8 corridors; Karachi to Lahore is
  M-9, N-5, M-5, M-4, M-3. The Lahore distance is the old site's ≈1,215 km, **unverified with M-4**, and is not shown as a fact in the lab.
- No photographs, because none exist yet.
- Reduced motion shows the finished state of every moment.

**How to read the departures.** "Old site" means the dark-navy, mono, dot-map build. Reference numbers
refer to [inspiration.md](inspiration.md).

---

## A. Contract Ledger (cream-led, editorial)

**Idea.** Zia Goods' product is a contract kept. The page is built like the paperwork the trade runs on: a
waybill, a weighing slip, a seal number. Cream paper, ink-blue type, and thin ruled lines. It is the opposite of a
glowing interface: it looks like something that has been signed.

| Colour | Hex | Role | Contrast |
|---|---|---|---|
| Paper | `#F5EEDF` | ground | n/a |
| Ink | `#0C2467` | text, rules | 12.4:1 on paper |
| Deep ink | `#071544` | footer, stamp ground | paper on deep 15.2:1 |
| Stamp blue | `#2146C7` | links, the stamp, key figures | 6.6:1 on paper |
| Rule | `#B9C4E4` | hairlines (decorative only) | 1.5:1, never text |
| Seal | `#B8791A` | the logo's amber, one seal dot | 3.1:1, graphic only |

**Type.** Newsreader (display, text, optical sizes) with Public Sans (UI and body), and IBM Plex Mono at 12–13px
for slip data only (seal numbers, route codes). Scale at a 1.25 ratio from 17px body: 17 / 21 / 27 / 34 / 42 / clamp(56, 8vw, 112) for the hero line.
Newsreader italic carries the motto.

**Layout.** A single wide column of "form" with a ruled left margin of small slip data (clause numbers that are real:
cargo 1–5). The hero is one huge serif line over a waybill-style header strip (consignor, consignee, route, seal
no.). The cargo section is a ledger: five ruled rows, each with name, a line of real copy, three specs. No cards.

**Signature motion.** On load, the headline settles and a round **seal stamp** ("20 YEARS · NATIONWIDE") presses
onto the slip with a short, weighted drop (scale 1.08 to 1 with a slight rotation, `cubic-bezier(.2,.8,.2,1)`, 380ms)
and the ledger rules draw left to right. **Overall motion:** almost none: still paper, a few 320–420ms settles, hover
as an underline that inks in. No bounce, no scroll-jacking.

**Informed by.** [1] United Carriers: layered proof order. [2] FMI: understatement and age as a claim. [5] Wembi:
numbered structure, used as real clauses. **Departs by** using paper and serif where all three use light-on-dark
sans, and by making the document metaphor the identity instead of stock photography.

**AI-default check.** No Inter, no purple gradient, no card grid, no icon tiles, no glow, no pure black or grey (all
neutrals are tinted toward the blue), no bounce easing. The "numbered eyebrow" habit is replaced by clause numbers that
mean something. **Breaks hardest from the old site.**

---

## B. Motorway Gantry (blue-led, wayfinding)

**Idea.** Zia Goods lives on named roads, and Pakistani drivers read those roads from overhead signs. The page is
a gantry: cream sign panels hung on a cobalt field, route numbers as the biggest type, cities as exits. It is
wayfinding, so it is instantly legible, and nobody could say it "looks like a template".

| Colour | Hex | Role | Contrast |
|---|---|---|---|
| Gantry blue | `#1238A8` | ground | sign on gantry 8.6:1 |
| Deep blue | `#081C63` | night band, footer | sign on deep 13.6:1 |
| Sign cream | `#F6F0E1` | panels, text on blue | n/a |
| Sign ink | `#0A2070` | text on cream | 12.7:1 on sign |
| Mist | `#C9D6FA` | secondary text on blue | 6.7:1 on gantry |
| Lane amber | `#E8B04B` | the one lane-line accent | 5.0:1 on gantry, 7.9:1 on deep |

**Type.** Overpass (a highway-sign grotesque) for route numerals, panel headings and UI, with Source Sans 3 for
body. Scale: 16 / 20 / 28 / 40 / 64 / clamp(72, 14vw, 200) for route numerals, which are set very large with tight
tracking. Cities are set in caps in Overpass 600.

**Layout.** The hero is a gantry: a thin steel beam across the top with three or four sign panels hanging from it
(M-9 Karachi–Hyderabad, N-5 Sukkur, M-5 Multan, M-4 and M-3 Lahore), the headline on the largest panel. Below, each
corridor section is an "exit": a numbered exit panel with city, road and what is carried there.

**Signature motion.** Scrolling is a **drive under the gantry**: as each section arrives, its sign panels slide in
from the top edge on a short carry (like passing under the structure), and a dashed lane line scrolls on the floor of
the page, locked to scroll position. **Overall motion:** scroll-linked and purposeful; hover states are
instant and flat; no easing flourish; the lane line stops when the reader stops.

**Informed by.** [8] Codrops: scroll-driven route technique. [7] Q Industrial: strict two-colour palette. [10]
Schneider: immediate audience paths. **Departs by** using the road's own sign system as the whole interface, and
by turning the old night-run illustration (a drawn truck and gantry) into the page structure rather than a scene.

**AI-default check.** No gradient hero, no glass, no neon on dark, no icon tiles. It has to avoid ending up as "the old site, but
brighter". That risk is real, since the ground is still blue, so the panels are flat cream, the type is a sign face
and not a mono, and there are no glows at all.

---

## C. Survey Atlas (map-led, split blue and cream)

**Idea.** The route is the company's real asset, and the client confirmed that maps matter. Instead of a glowing
dot-field, the country is drawn the way a survey atlas draws it: cream paper, fine ink hairlines for the boundary and the
motorways, a pale-blue sea, and one bold blue line for the corridor with cities as named stations. Boundary data is GADM
and Natural Earth with OpenStreetMap roads, with attribution.

| Colour | Hex | Role | Contrast |
|---|---|---|---|
| Paper | `#F1EADA` | map ground | n/a |
| Sea | `#D8E2F6` | water and the quiet panels | ink on sea 9.2:1 |
| Ink | `#10307F` | boundary, labels, text | 10.0:1 on paper |
| Route blue | `#1D4ED8` | the corridor | 5.6:1 on paper, 5.2:1 on sea |
| Contour | `#8FA2D4` | context roads (decorative only) | 2.1:1, never text |
| Night | `#0A1B52` | the left information panel | paper on night 13.6:1 |

**Type.** Spectral (a book serif, with italics) for place names and headlines, Barlow for body and UI, Barlow
Condensed for road numbers and map labels. Scale: 16 / 19 / 24 / 32 / 48 / clamp(48, 6.5vw, 96).

**Layout.** A split screen: a night-blue information panel on the left (headline, sub, two paths to contact, the
four figures set as a plain legend), and the atlas page on the right, cream and full height, with a scale bar, a
north arrow and a small credit line. Below the fold the five cargoes are "stations" listed against a vertical
route line.

**Signature motion.** The corridor **inks itself north from Port Qasim**. A single route line draws along the real
M-9, N-5, M-5, M-4, M-3 path, and each city's station label prints as the line reaches it. It plays once, in about
three seconds, and the finished map is the static state. **Overall motion:** one drawn line and nothing else;
station labels respond to hover with a plain underline; no looping pulses.

**Informed by.** [8] Codrops: path drawing. [3] Rapide Yacht Group: coordinates and place detail as texture. [9]
Flexport: showing the real object. **Departs by** rendering the route as cartography rather than as a light, and
by keeping the map as one calm object, not a field of thousands of dots.

**AI-default check.** No dot field, no pulsing glow, no gradients, no icon tiles. The map is real data, so the
page cannot be generic. Split-hero is a common layout, so what keeps it from being a template is the printed-atlas
detailing (scale bar, graticule ticks, a coloured sea) and the serif.

---

## Comparison

| | A. Ledger | B. Gantry | C. Atlas |
|---|---|---|---|
| Ground | cream | cobalt | split: night + cream |
| Subject | the contract | the road signs | the map |
| Display type | serif | highway grotesque | book serif |
| Signature | seal stamp | drive under gantry | route inks itself |
| Risk | too quiet or "legal" | reads as "old site, brighter" | split-hero cliché |
| Break from old site | strongest | weakest | strong |
| Ambition vs. trust | trust-led | recognition-led | proof-led |

## Recommendation

**C or A.** A is the clearest statement of "honours contracts" and breaks hardest from the old site; C puts the
confirmed 20-years-nationwide claim in the one picture only Zia Goods can draw. B is the most memorable but sits
closest to the old site's blue and its night-run scene.
