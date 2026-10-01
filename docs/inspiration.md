# Inspiration — round 2

Reference material for the Zia Goods redesign. These are principles to learn from. Never copy a layout, code,
text or images. The old site is an anti-reference ([audit](audit.md)).

## How this was gathered

- **Every site below was opened in a real headless Chromium and scrolled with real wheel events.** Each one was
  captured at 1440×900 as a fold frame, 4–14 frames through the scroll and a three-frame "scroll response" burst,
  plus three phone frames at 390×844. The capture also recorded the fonts and colours in use and the motion stack
  it could detect (GSAP, Lenis, WebGL and so on).
- Round 1 could not do this: the browser rejected the sandbox proxy's certificate. In round 2 each request is
  fetched in Node, which verifies TLS against the environment's own CA bundle, and handed to the browser.
  Certificate checks stayed on throughout.
- All frames are in `screenshots/inspiration/<site>/`, which is gitignored and never committed.
- **Not used:**
  - Awwwards itself is blocked from this sandbox's browser, so its pages were read only through the fetch tool,
    to find live URLs of winners.
  - LODISNA (Awwwards Honorable Mention) did not finish loading and is not used.
  - FWA and CSS Design Awards searches turned up no logistics winners worth capturing.
  - Codrops article pages returned 403 to the fetcher, so the technique entry rests on its published description.
- Nothing was installed from any of these sites, and none of their code was run outside the browser page itself.

## What all eight captured sites run

**Lenis smooth scroll on every one of them.** (Truck'N Roll's Locomotive Scroll v5 is itself built on Lenis.) The serious sites in this space treat scroll as a designed
material, not a browser default. Several pair it with GSAP. United Carriers, WeEvolveIT, CargoKite and Terminal also run WebGL.

---

## Your picks

### 1. United Carriers (unitedcarriers.com): Awwwards Site of the Day, WD of the Day Aug 2026
*The client's admired site, and the strongest reference in the set.*
- **What it does:**
  - The hero is a WebGL globe with glowing trade lanes and labelled countries, behind a heavy, wide uppercase
    headline (BT Steinhart, 80px/700) that resolves letter by letter from blue to white.
  - Then the signature: **a scroll-scrubbed freight story.** A reach stacker lifts a container and sets it on a
    truck. The truck drives across the page as you scroll, with a **live km/h readout** in the corner and a giant
    outlined word ("OUR SERVICES") passing behind it. A top-down road follows with the truck travelling down the
    page, then an aerial container ship. Huge numerals ("2,500+", "98.2%") and named client quotes come after.
- **Learn:** let the vehicle carry the story. Scroll is the throttle, and a readout makes the motion feel measured
  rather than decorative.
- **Fits Zia Goods:** the same business, at a different scale. Zia Goods can tell it with its own roads.
- **Departure:** it uses photoreal 3D cut-outs and global lanes. Zia Goods should use its real corridor, named
  roads and its own tanker, not a generic container truck.

### 2. Rapide Yacht Group (rapideyachtgroup.com)
- **What it does:**
  - **Coordinates as micro-typography** label every section (`50°37′00″N, 3°24′00″W`).
  - **Statements fill with ink as you scroll**, word by word, from grey to black.
  - A pinned full-bleed yacht gallery carries a spec table (manufacturer, model, year, length, price) and a ruler
    of tick marks along the bottom edge.
  - Topographic contour lines appear as a brand texture.
  - The contact form is a sentence ("Hello, my first name is ___").
  - Type is Denim, a light grotesque at 42–60px with negative tracking. It runs GSAP and Lenis.
- **Learn:** place and precision as texture, with spec tables that feel like documents.
- **Fits:** Port Qasim's coordinates, route numbers and tank specs are Zia Goods' equivalent of the yachts'
  latitude and length.

### 3. WeEvolveIT (weevolveit.com)
- **What it does:**
  - The hero is a particle globe.
  - The signature is **a five-step method, each step a full screen with a huge ghost numeral (01–05) behind it,
    while the page background shifts from white to grey to black across the sequence.**
  - Mono type (Geist Mono 111px/800).
  - Text set on a rotating curve, and scrambled-letter reveals.
  - **WhatsApp is a first-class call to action**, beside email.
  - It runs WebGL and Lenis.
- **Learn:** a scroll sequence can change the whole room's colour, and numbered steps can be architecture rather
  than labels.
- **Departure:** all-mono type and a dark tech palette are exactly the old Zia Goods site. We take the colour shift
  and the ghost numerals, not the look.

### 4. FMI (fmi-industries.com)
- **What it does:**
  - A rocket-launch video hero with an orange horizon line.
  - Manrope 86px/400.
  - Headlines in two tones ("Our materials *are a part of* something bigger").
  - An accordion list of materials.
  - An AS9100 certification shown as a small chip.
  - A cinematic sunset-gradient call-to-action band.
- **Learn:** certification shown small and calm, and two-tone headlines that put the stress on the right words.

### 5. Wembi (wembi.ai)
- **What it does:**
  - An enormous custom wordmark, then soft 3D renders.
  - Numbered headings with highlighter-marker blocks behind keywords ("01 *Digital Twin* Data").
  - Statements that fill in on scroll.
  - Industries in a stacked list.
  - Haas Unica, 97px/400. It runs Lenis.
- **Learn:** generous scale, and numbering that gives a long page structure.
- **Departure:** pastel 3D product renders. Zia Goods has a physical fleet, so draw that instead.

## Award winners found by search

### 6. Truck'N Roll (trucknroll.com): Awwwards Site of the Day, June 2026, by Locomotive
- **What it does:**
  - Logistics for touring entertainment.
  - **Massive condensed uppercase type** ("FULL TOURS, NO EXCUSES.", "WE MOVE SHOWS FORWARD") that slides,
    scales and wraps around images on scroll.
  - A numbered three-step section.
  - A **plain stats table** (70+ trucks, +140 years of driver experience, 100% full-time, 24/7).
  - Halftone dot-matrix display type, and a rotated marquee band at the footer in electric blue.
  - National 2 Condensed at 200px/900, tracking -4px.
  - Built with Locomotive Scroll.
- **Learn:** confidence through type scale alone, and stats as a ruled table instead of counter tiles.
- **Fits:** the same buyer anxiety ("no excuses"). It proves a trucking company can win design awards on
  typography and pacing.

### 7. CargoKite (cargokite.com): Awwwards Site of the Day
- **What it does:**
  - **The vessel is drawn as clean technical line art** (deck plan, hull, containers), and scroll transforms it:
    one large ship splits into a fleet of small ones.
  - A huge kite arc grows across sections.
  - One accent colour (orange-red #FF471D) on paper grey.
  - A problem statement told across several screens ("…not sustainable", "…slow", "…only for standard routes").
  - Helvetica Now Display at 83px/500.
- **Learn:** technical drawing reads as engineering credibility, and it animates beautifully without photography.
- **Fits:** Zia Goods has no photography yet. A precise line drawing of its own tanker gives the same credibility.

### 8. Terminal Industries (terminal-industries.com): Awwwards Site of the Day, Sept 2025
- **What it does:**
  - A truck silhouetted at sunset.
  - A dark section where a **wireframe point-cloud truck** assembles.
  - A "What's your yard costing you?" calculator with live savings.
  - Customer logos.
  - Contact promised the same day.
  - Suisse Intl at 70px/400, tracking -3.6px.
  - Built in Vue.
- **Learn:** an interactive tool (a calculator) as proof of expertise, and wireframe vehicles as a visual language.
- **Future idea for Zia Goods:** a lane estimator (from, to, volume) could do the same job as Terminal's calculator.

### 9. Codrops, "Creating Scroll-Driven SVG Map Animations with GSAP" (May 2026)
- **Technique:**
  - A lightweight scroll-driven map with no map service: the route path draws on scroll, a marker moves along it,
    and a "camera" group pans and zooms.
  - DrawSVG and MotionPath tied to ScrollTrigger.
- **Learn:** exactly the mechanism for showing a real corridor cinematically, at a few kilobytes.
- *Source: the published description only; the page returned 403 to the fetcher.*

---

## Patterns that recur (use the principle, avoid the cliché)

| Pattern | Seen on | Take | Avoid |
|---|---|---|---|
| Smooth scroll (Lenis) | all 8 captured | a weighted, consistent scroll feel | heavy inertia that fights the reader |
| Scroll-scrubbed vehicle or object | United Carriers, CargoKite, Terminal | the object carries the story | generic 3D stock vehicles |
| Giant display type | Truck'N Roll, United Carriers, Wembi | one confident line per screen | type so big the message is lost |
| Live readouts and coordinates | United Carriers, Rapide | precision as texture | fake data; Zia Goods' readouts must be real roads |
| Colour shift across a sequence | WeEvolveIT | the room changes as the story turns | slow fades where text and ground go grey together |
| Ruled stats tables | Truck'N Roll, United Carriers | numbers that read as records | count-up tiles in a row of four |
| WhatsApp as a primary path | WeEvolveIT | phone or WhatsApp beside the form | hiding the number behind a form |

## Seen everywhere, and avoided here

- Glowing globes and trade lanes on black.
- Pastel 3D renders.
- Logo carousels as the only proof.
- Cookie banners over the hero.
- Numbered eyebrows on every section.
- Neon accents on dark.
