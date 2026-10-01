# Old site audit

What the current Zia Goods site is, what it does well, and what the redesign should leave behind.
The old site is an **anti-reference**: the new direction must not resemble it.

Written 2026-10-01 from a production build (`next build && next start`, Next 16.3.5) and the screenshots
in [`docs/old-site/screens/`](old-site/screens/): `/`, `/services` and `/contact`, each at 1440×900 and
390×844, one frame at the fold and up to five while scrolling. The screens were taken in a headless
Chromium on a software rasteriser, so motion and timing are only roughly represented. A frame caught
mid-transition (for example the "Now loading." heading in `home-desktop-scroll5.png`) is not itself a bug.

`docs/audit.md` and `docs/old-site/screens/` did not exist in the repo when this phase started; both were
generated here, not inherited.

## What it is

- **Routes:** `/` (home), `/services`, `/contact`, plus `opengraph-image`, `error`, `global-error`,
  `not-found`.
- **Stack:** Next 16 App Router, React 19, GSAP (ScrollTrigger, SplitText), Lenis smooth
  scroll, Tailwind 4 tokens, DialKit dev panels, Vercel Analytics and Speed Insights. About 18k lines in
  `src/`, of which `src/app/globals.css` is 6,962.
- **Home, in order:**
  1. Hero. A navy field with a dot-matrix map of Pakistan and an amber corridor, headline "Never run dry.
     Never run late.", two CTAs, and four stats (22 / 20 / 14 / 8).
  2. A blue-to-cream "flood" hand-off.
  3. Ship to shelf. A large statement that fills with ink as it scrolls, and a corridor map card.
  4. A night run. An illustrated tanker driving down a motorway under gantry signs, with the truck's
     "DEKH MAGAR PYAR SE".
  5. Services. A cargo "sight glass" that simulates each cargo in a dot grid.
  6. FAQ with a lane board.
  7. A footer with a route strip and the motto.
- **Services:** the five cargoes (edible oil, molasses, chemicals, finished goods, dry cargo), with a cover flow.
- **Contact:** "Tell us the load." A capacity-request form on a pale glass panel, with cargo icon tiles.

## What works (keep the idea, not the execution)

- **The truth of the business is clear.** Port Qasim to the refinery gate, food-grade oil-only tanks, own fleet,
  contract carriage. The copy is concrete and plain-spoken. `src/lib/cargo.ts` and `src/lib/faq.ts` are
  real raw material for the new site.
- **"Never run dry. Never run late."** is a strong promise line and survives a redesign.
- **The truck-back motto** "Dekh magar pyar se" is a real piece of local culture and gives the brand a human voice.
- **The road is the story.** Corridors, route numbers (M-9, N-5, M-5, M-4, M-3, M-2) and gantry signs are
  an honest, specific visual language that no competitor owns.
- **Capacity-request form** structure is sound: cargo, then lane, then who to call back, with a three-step
  expectation list beside it.
- **Reduced-motion and failure handling** were taken seriously (watchdog, `data-lite`, `Safe` boundaries).

## What to leave behind

| Area | Old site | Why it should go |
|---|---|---|
| Type | Space Mono for everything: display, body, labels, figures | A monospace face at 70px reads as a terminal or a crypto dashboard, not as a trusted national carrier. It also costs readability on long copy, and there is no Urdu strategy. |
| Colour | Deep navy ground with amber as the only warm colour, cream only as a section break | It reads as a tech product. The client wants blue and cream-white in real contrast, and a reputable, not-flashy tone. |
| Hero | A dot-matrix map with glowing amber corridor, glass pills, a pulsing "live" language | Glow and glass are decoration. They say "demo", not "contract honoured for twenty years". |
| Preloader | Counted and animated, with watchdog and rescue code behind it (`Preloader`, `ManifestPreloader`, `ContactPreloader`, `Alive`, `rescue.ts`, `lite.ts`) | A buyer arriving to find a rate or a number should not wait on an intro. The amount of defensive code is itself a sign the intro is too heavy. |
| Scroll | Pinned hero, flood hand-off, scrubbed text fill, Lenis | Several beats rely on scroll-jacking. Mid-transition frames (like "Now loading." on the cream section) show how fragile the pacing is. |
| Chrome | Custom cursor, floating pill nav, header auto-hide | Novelty UI on a B2B contracting site adds risk and no trust. |
| Section labels | `01` boxes with dashed lines and amber dots before every heading | A repeated "techy eyebrow" pattern that appears on every section and says nothing. |
| Cards | Pale glass panels with corner screws, small stat cards, icon tiles above labels | Visual noise, and the icon-tile-above-label pattern is a common template tell. |
| Interactions | Sight glass physics, pour animations, split-flap lane board | Clever, but they compete with the content. A mill owner wants to see capacity and credentials. |
| Code weight | 6.9k-line `globals.css`, dev panels, per-section motion engines | Hard to evolve and expensive to redesign. The new site needs a smaller, token-driven stylesheet. |

## Gaps in what the site communicates

- **No proof beyond four numbers.** There is no named client, certification, standard, inspection or insurance
  evidence, even though "doesn't neglect standards" is the thing the client most wants conveyed.
- **No photography of any kind.** The fleet, the drivers and the yard are drawn or implied. No photos were
  supplied for the redesign, so the direction work uses type, drawing and cartography only.
- **Urdu appears only as Roman-script motto text** in the footer and on the truck illustration. No Urdu script anywhere.
- **Contact is the only conversion path.** The code contains no `tel:`, WhatsApp or email link anywhere, so there is no phone number to call,
  only a form that asks for one.
- **Route copy is inconsistent.** The FAQ gives Karachi to Lahore as M-9, N-5, M-5 and M-3 (`src/lib/faq.ts:204`,
  `:278`, `:279`), but the footer map and the night run both go Multan to Lahore via the M-4 and then the M-3
  (`src/components/SiteFooter.tsx:34`, `src/components/NightRun.tsx:11`). The client has confirmed M-4 belongs on that route.
- **Corridor count.** The old stats say 8 corridors, which is the brief's 7 core corridors plus the N-10 Gwadar leg.
  The client confirmed 8.

## Facts to carry forward

- 22 food-grade oil tankers, 20 years hauling edible oil, 14 motorways and highways, 8 corridors.
- Port Qasim, Karachi origin. Destinations: Hyderabad, Sukkur, Rahim Yar Khan, Multan, Faisalabad, Lahore,
  Sheikhupura, Islamabad-Rawalpindi, Peshawar, and Gwadar by the N-10.
- Karachi to Lahore: about 1,215 km and 24–28 hours of road time. This figure needs rechecking once the M-4 is on
  the route.
- Five cargoes: edible oil, molasses, chemicals, finished goods, dry cargo.
- Motto, as painted on the trucks: "Dekh magar pyar se" (look, but with love).
