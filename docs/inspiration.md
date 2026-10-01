# Inspiration

Reference material for the Zia Goods redesign. These are principles to learn from, never layouts, code, text or
images to copy. The old site is an anti-reference ([audit](audit.md)).

## How this was gathered, and its limits

- **No screenshots were viewed.** The sandbox's headless Chromium rejected the proxy's certificate
  (`ERR_CERT_AUTHORITY_INVALID`) on every site. I did not bypass certificate checks, and a read of the proxy
  documentation was denied, so I did not pursue it. `screenshots/inspiration/` is empty.
- Notes on sites 1–7 and 10 come from page text and structure as summarised by the fetch tool. Anything about
  colour, type or motion is therefore **thin or inferred**, and flagged `(inferred)`.
- The Codrops article returned HTTP 403 to the fetcher, so entry 8 rests on the search-result description only.
- Awwwards is blocked from this sandbox's browser path. Its pages were reachable only through the fetch tool,
  which gave jury scores and summary text, not visuals. FWA and CSS Design Awards searches returned nothing usable.
  21st.dev was not used: nothing there is needed, and nothing would be installed from it.
- To close the gap, capture the sites in a browser that works (a local machine, or a sandbox whose browser trusts the
  proxy CA) and add notes on type, pacing and motion to each entry.

## References

### 1. United Carriers (unitedcarriers.com): the client's admired site
- **Learn:** the order of persuasion. Promise, then service paths, then hard numbers (shipments a month,
  on-time rate, years operating), then named client quotes, then partner logos and accreditation, then FAQ. Trust is
  built in layers *before* the call to action repeats. The copy is direct and unfussy ("we own the outcome").
- **Fits Zia Goods:** the same buyer anxiety (will they deliver, who is accountable). It shows what the client
  means by "reputable".
- **Departure:** it leans on stock-style cargo photography and a dark palette `(inferred)`. Zia Goods has no photography
  yet and should not borrow a look it can't back with real material. Its proof must be Zia Goods' own: 22 tankers,
  20 years, named roads.

### 2. FMI Industries (fmi-industries.com): quiet certainty
- **Learn:** one tagline carrying the whole brand promise ("Quality proven in extreme environments"), a plain
  statement of age ("over 55 years"), and a certification shown small. Specificity (named applications) does the
  persuading, not adjectives.
- **Fits:** the client's "never neglects standards" fear is answered by understatement and specifics, not volume.
- **Departure:** it is a materials catalogue with a product-photo hero. Zia Goods sells reliability on a route, so the
  route, not a product shot, is the subject.

### 3. Rapide Yacht Group (rapideyachtgroup.com): founder-led trust
- **Learn:** a named person with credentials ("20+ years"), one hard transaction figure, and quiet technical vocabulary,
  alternating with generous whitespace. Small decorative detail (coordinates between sections) supplies a sense of
  place without noise.
- **Fits:** the 20-years story could be carried by the people behind it, once the client supplies them. Route
  coordinates and road numbers are the equivalent of nautical coordinates.
- **Departure:** its tone is aspirational and lifestyle-led. Zia Goods' buyers want accountability, not aspiration.

### 4. WeEvolveIT (weevolveit.com): direct contact first
- **Learn:** WhatsApp and email are the primary calls to action, ahead of a form. Short declarative copy,
  provocative contrast lines, and a methodology section that explains how work is done.
- **Fits:** the client asked for form and phone/WhatsApp at equal weight. This is a live example of treating the
  message button as a first-class path.
- **Departure:** its logo carousel, dark ground and "irreverent" voice `(inferred)` suit a tech agency, not a carrier.

### 5. Wembi (wembi.ai): numbered structure
- **Learn:** numbered section markers (n.001, n.002) give a long page a visible structure and a sense of
  completeness, with questions as headings, a minimal top bar, and alternating photograph and diagram.
- **Fits:** a contract document has numbered clauses. A numbering system could carry the "detail and standards" feeling.
- **Departure:** the old site already overused numbered eyebrow labels (`01 ────● EDIBLE OIL TRANSPORT`). Any
  numbering must earn its place as real structure, such as lane numbers or clause numbers, not decoration.

### 6. Terminal Industries (Awwwards Site of the Day, Sept 2025)
- **Learn:** an industrial, logistics-yard subject treated as a story, with animation and transitions scoring highest
  with the jury (8.8/10). Corporate subject matter does not need to be dull to be taken seriously.
- **Fits:** proof that a logistics site can earn design recognition through motion that explains the operation.
- **Departure:** its jury notes also marked accessibility down (7.0). Zia Goods' motion must degrade gracefully and
  never carry the content on its own.

### 7. Q Industrial (Awwwards Site of the Day, June 2024)
- **Learn:** a strict two-colour palette (light grey and one strong red) with typography as the hero, and 3D and
  timeline motion kept to a few moments.
- **Fits:** the client wants a contrast of blue and cream-white. A two-colour system proves a restrained palette can
  feel premium and industrial at once.
- **Departure:** the red is an alarm colour. Zia Goods should use a blue that reads as calm and dependable.

### 8. Codrops, "Creating Scroll-Driven SVG Map Animations with GSAP" (May 2026)
- **Learn:** a lightweight technique with no map service: draw a route path on scroll, move a point along it, and
  shift a camera group, all inside one SVG. `(search description only)`
- **Fits:** the route is Zia Goods' strongest asset, and it is already SVG.
- **Departure:** keep this to one signature moment, and always provide a still, readable version of the route for
  reduced-motion visitors.

### 9. Flexport, via Blend B2B's review (blendb2b.com)
- **Learn:** confident typography and white space, with real product UI instead of illustrative art. The
  lesson is that clarity reads as competence.
- **Fits:** a mill owner comparing carriers wants to see the thing the carrier does (lanes, capacity) rather
  than a metaphor for it.
- **Departure:** Flexport sells a software platform. Zia Goods has no dashboard to show, so the lane board and route
  facts must stand in for it.

### 10. Schneider, via Blend B2B's review
- **Learn:** it segments its audiences immediately, before any generic message ("shippers" and "carriers" as separate
  paths).
- **Fits:** Zia Goods has one main audience, but its five cargoes are really different buyers (a refinery, a sugar mill,
  a chemical plant). Entry points by cargo could shortcut straight to the right proof.
- **Departure:** do not build a mega-menu. Five cargoes do not need one.

## Patterns that show up everywhere, which we avoid

- **The dark hero with a glow.** Dark ground, one accent colour and a halo around the hero object. The old site did this, and many
  logistics and tech sites do too.
- **Stats in a row of four** under the hero, counting up on load. The old site's `22 / 20 / 14 / 8` strip was one.
- **Logo carousel as the only proof.** Logos with no sentence about what was moved, how often or for how long.
- **Stock cargo photography** (containers, cranes, a truck on a highway at sunset) used as the whole identity.
- **Numbered eyebrow labels** on every section.
- **Card grids** with an icon tile above each heading.
- **Scroll-jacked storytelling** that withholds content until an animation finishes.
- **"We move freight" copy** with no named road, cargo or procedure.
