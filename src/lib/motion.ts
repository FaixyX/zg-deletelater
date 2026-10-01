/**
 * motion.ts — the single source of truth for movement on this site.
 *
 * Rule: no GSAP easing string or duration number appears anywhere else
 * in the codebase. Every animation imports from here. When a value
 * changes, it changes once.
 */

import { useGSAP } from "@gsap/react";
import type Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import type { RefObject } from "react";

/* useGSAP is registered alongside the plugins rather than in each
   component that calls the hook: GSAP wants it registered once before
   any hook runs, and this module is already the one place plugins are
   turned on. Importing the hook doesn't run it, so the file stays safe
   to pull into a server component. */
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);
}

/* ------------------------------------------------------------------ *
 * 1. The vocabulary
 * ------------------------------------------------------------------ */

/* Direction A, "Contract Ledger" (DESIGN.md): still paper, short weighted
   settles, nothing that bounces or overshoots. Every curve decelerates into
   place; the one looping value (flow) is a plain sine. */
export const EASE = {
  settle: "power3.out", // lands with weight and stops clean (the seal pressing on) -- the default
  snap: "power4.out", // fast and precise -- user-triggered things
  carry: "power2.inOut", // long steady travel
  lift: "power3.out", // small rise into place -- text, rules
  flow: "sine.inOut", // looping states, where there are any
  hold: "none", // no easing of its own -- scroll-scrubbed only
  veil: "power2.inOut", // cross-dissolve
} as const;

export const DUR = {
  settle: 0.42,
  snap: 0.32,
  carry: 0.7,
  lift: 0.42,
  flow: 5,
} as const;

export const STAGGER = 0.06; // seconds between siblings
export const LIFT_Y = 14; // px, always from below -- one direction sitewide
export const START = "top 80%"; // when an entrance fires

/* ------------------------------------------------------------------ *
 * 2. Global defaults
 *
 * Any tween that doesn't specify its own ease or duration inherits
 * Settle, so a forgotten easing degrades to the house style rather
 * than to GSAP's default (power1.out at 0.5s).
 * ------------------------------------------------------------------ */

gsap.defaults({ ease: EASE.settle, duration: DUR.settle });

/* ------------------------------------------------------------------ *
 * 3. Reduced motion
 * ------------------------------------------------------------------ */

/* "Reduced" is also the light page (lib/lite.ts): a visitor the browser
   says wants less motion, or one whose device could not carry the full
   page, gets the same still, short, unscrubbed version. */
export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    document.documentElement.hasAttribute("data-lite"));

export function withMotion<T>(
  buildTimeline: () => T,
  applyFinalState?: () => void
): T | null {
  if (prefersReducedMotion()) {
    applyFinalState?.();
    return null;
  }
  return buildTimeline();
}

/* ------------------------------------------------------------------ *
 * 4. Hero map & preloader timings
 *
 * Durations and stagger steps tuned specifically for the homepage
 * hero's load sequence and corridor pulse loop. Not part of the
 * sitewide feel vocabulary above, but centralised here so no raw
 * number appears in a component.
 * ------------------------------------------------------------------ */

export const HERO = {
  preloaderDotStagger: 0.00055,
  preloaderCountDuration: 3.1,
  /* A second visit in the same session: the count runs short and the
     dots sweep in at the same pace relative to it. */
  preloaderRepeatDuration: 1.1,
  preloaderRepeatDotStagger: 0.0002,
  preloaderFadeDuration: 0.6,
  /* Seconds after the hero starts to appear that its headline rises. */
  copyDelay: 0.35,
  mapDotStagger: 0.0006,
  outlineDuration: 0.8,
  contextRoadDuration: 1.6,
  contextRoadStagger: 0.012,
  corridorRoadDuration: 1.8,
  corridorRoadStagger: 0.02,
  nodeStagger: 0.07,
  headlineDuration: 0.8,
  statCountDuration: 1.3,
  pulseDuration: 7,
  pulseStaggerStep: 0.9,
  ringPulseDuration: 3.4,
  ringPulseStaggerStep: 0.8,
} as const;

/* ------------------------------------------------------------------ *
 * 5. Gradient field
 *
 * The animated background behind the hero. GSAP owns every value the
 * fragment shader reads -- there is no clock inside the shader, no CSS
 * animation and no bare requestAnimationFrame loop. Tweens write to a
 * plain object, the ticker hands it to the GPU, so the field obeys the
 * same timeline controls (and the same reduced-motion switch) as
 * everything else on the page.
 * ------------------------------------------------------------------ */

export const SHADER = {
  /* One tween drives the whole field: phase runs 0 -> 1 on repeat, and
     every value the shader reads is a point on a circle at an integer
     multiple of that phase. So at phase 1 every offset has come back to
     exactly where it started and the loop is seamless -- no jump at the
     wrap, which is what a linearly-advancing clock gives you.

     40s is long enough that the repeat isn't obvious and short enough
     that the pools' orbits (GradientShader) still read as movement. */
  loopDuration: 40,

  fadeInDuration: 1.8,

  /* The field is nothing but soft pools of colour, so it survives being
     drawn at a small fraction of the screen and scaled up: at 0.3 a
     1440-wide window draws about 430 pixels across. */
  renderScale: 0.3,
  maxPixelRatio: 1,
  /* Hard ceiling on the drawing buffer's long edge. */
  maxEdge: 480,
} as const;

/* ------------------------------------------------------------------ *
 * 6. Scroll transition
 *
 * The handoff from the dark hero to the light section below it. The
 * hero pins, a gradient panel slides up through it -- navy into blue
 * into cream -- and by the time the pin releases the screen is already
 * the colour of the section that follows, so the two meet with no seam.
 *
 * Everything here is scrubbed, so these are positions on a timeline
 * rather than durations: a value of 0.34 means "a third of the way
 * through the pinned range", not "0.34 seconds".
 * ------------------------------------------------------------------ */

export const TRANSITION = {
  /* The geometry of the handoff -- how long the hero holds, where the
     flood starts and where it is at release -- is layout now, in
     .hero-track and .hero-flood in globals.css: the hold is as long as the
     flood, board and ramp. The browser moves the
     flood itself, so it cannot lag the scroll. What remains here is timing
     for the things script still does, and the colour thresholds it reads.

     The fades below are bound directly to the scrollbar, no catch-up lag,
     so the hero's contents leave in lockstep with the flood rising over
     them. */
  scrub: true,

  /* Hero content leaves early: it should be gone before the blue
     reaches it rather than dimming underneath it. The map fades out
     later and slower, and that difference in rate is what makes the
     exit read as depth instead of a single cross-fade. */
  contentOut: 0.34,
  mapOut: 0.62,

  /* Reduced motion keeps the colour change and drops only the travel,
     which is what `.agents/skills/review-animations/STANDARDS.md` means
     by gentler rather than zero. Removing the flood outright leaves a
     hard dark-to-cream cut at the section boundary -- more jarring than
     the thing it was meant to spare. So the panel is parked where the
     full animation would have left it and cross-fades instead, over a
     range short enough to be done before the hero leaves the screen. */
  reducedFade: "60%",

  /* Where on the ramp the header switches to ink, as a fraction of the
     ramp's height (#hero-flood-ramp). Measured against the colour actually
     under the header rather than a point in the scroll, so it is right at
     any scroll speed and after release as well as during the hold. 0.38
     sits between the blue stop (0.30) and the first mixed stop (0.45):
     past it the ground is light enough that a dark mark reads better than
     a cream one. The logo is split along this line (ScrollTransition), so
     it also decides which side of the ramp gets which colour. */
  inkFrom: 0.38,

  /* The ramp's first fully opaque stop, as a fraction of the panel. Once
     it has crossed the top of the screen the flood hides everything
     behind it, so the WebGL field stops. Must agree with the
     var(--color-navy) stop in .hero-flood -- the panel's top, now that
     its surface (FloodEdge) carries the entrance. */
  floodSolidFrom: 0,

  /* The light section's entrance fires as its top edge clears the
     bottom of the screen -- which is the moment the hero's hold ends --
     rather than at the sitewide START. Held back to START, the copy
     would rise into view still transparent, and the gap reads as a
     blank screen. */
  sectionStart: "top bottom",
} as const;

/* The flood's surface (FloodEdge.tsx), in CSS px and seconds. Keep
   `height` and `below` in step with --edge-h and --edge-below. */
export const EDGE = {
  height: 120, // the drawing's box
  below: 40, // how far it overlaps the top of the panel
  rest: 34, // the crest's mean height above the panel
  swell: 14, // the slow waves' height
  fullWidth: 1200, // px wide at which the waves are full height
  narrowScale: 0.45, // and the least they come down to on a phone
  sloshGain: 0.012, // px of swing per px/s the scroll's speed changes
  sloshMax: 26,
  sloshDecay: 1.1,
  sloshSpeed: 2.4, // radians/s the swing travels along the edge
} as const;

/* The night run (NightRun.tsx): the motorway the flood opens onto,
   driven by the scroll. Distances are in view heights (V), progress is
   the scene's passage through the window, 0 as its top enters and 1 as
   its bottom leaves; the hold sits between about 0.36 and 0.64. Keep
   `horizon`, `ground`, `lampGap`, `dash` and `hold` in step with .nr in
   globals.css. */
export const NIGHT = {
  horizon: 0.42, // of the view, from the top
  ground: 0.58, // the road's depth below the eye: the rest of the view
  drive: 8, // V driven across the whole passage
  lampGap: 0.45, // V between lamp posts; the road's pattern repeats on it
  lamps: 10, // posts a side: the road, and so the last of them, ends at 5V
  lampFade: [3.2, 5.2], // V ahead where the farthest posts fade in
  lampX: 0.53, // of the road's width, out from the centre line
  lampTop: 0.55, // V above the eye
  paintAt: [2, 2.9, 3.8, 4.7, 5.6], // V down the road, one per route number
  paintX: -0.125, // of the road's width: the lane left of the centre line
  gantryAt: 3.9, // V down the road
  gantryTop: 0.5, // V above the eye
  tanker: { x: 0.125, from: 0.62, to: 9.5, go: [0.34, 0.8] }, // lane, V ahead, when
  pass: 0.3, // V behind the screen plane past which anything is dropped
  line1: { in: [0.1, 0.33], out: [0.4, 0.45] },
  line2: { in: [0.54, 0.63] },
  dawn: [0.46, 0.68],
  scrub: 0.6, // s the scene takes to catch the scroll: it coasts to a stop
  still: 0.11, // the frame shown to reduced motion: the gantry still far off
} as const;

/* The nav and logo stepping away on the way down (HeaderAutoHide.tsx),
   in CSS px. */
export const AUTOHIDE = {
  top: 140, // always shown this near the top of the page
  hideAfter: 48, // scroll down this far in one run before they go
  showAfter: 16, // and up this far before they come back: quicker to return than to leave
  reach: 72, // a mouse this near the top of the window brings them back
} as const;

/* The nav's introduction after the preloader, on every load
   (SiteNav.tsx), in seconds: oil through the pill, rings off the dot,
   and a strip easing out beneath with the links' dots, a ripple running
   along them before it tucks away. */
export const NAV_HINT = {
  delay: 1.2, // after the hand-off: the headline has risen, the eye is free
  sweep: 1.7, // the oil crossing the pill, slow and even
  ringAt: 0.6, // into the sweep, when the dot first rings
  ring: 1.3,
  ringGap: 0.45, // between the two rings
  ringScale: 3,
  peekAt: 0.85, // into the sweep, when the strip begins to ease out
  peek: 0.65, // the strip easing out
  peekDrop: 8, // px it drops as it comes
  dot: 0.5,
  dotStagger: 0.07,
  ripple: 0.28, // each dot's lift and settle as the ripple passes
  rippleLift: 3, // px
  hold: 0.7, // after the ripple, before it flows back in
  dotOut: 0.42, // each dot draining away, the ends first
  tuckLag: 0.12, // after the first dots go, the strip starts drawing in
  tuck: 0.85, // the strip drawing in from its ends and lifting away
  settle: 1.1, // the last soft ring as it all comes home
  settleScale: 2.2,
} as const;

/* The footer (FooterMotion.tsx). The page lifts off it; a tanker drives
   the corridor as it is uncovered; and the wordmark is a tank that fills
   on the way in, its surface a row of columns joined by springs, so a
   push anywhere travels along it. Surface heights in the wordmark's own
   units (53.5 tall). */
export const FOOTER = {
  veil: 0.55, // how dark it is under the page before it is uncovered

  /* The tanker. */
  follow: 7, // per second: how quickly it catches up with the scroll
  damping: 10, // a touch under critical: it overshoots, just, and settles
  lean: 0.0022, // degrees per px/s² of its own acceleration
  leanMax: 4,
  honk: 1.3, // seconds the horn's bubble stays up

  /* The oil in the letters. */
  columns: 160,
  empty: 0.1, // level as the footer starts to show, 0-1 of the letters' height
  full: 0.78, // and at the end of the page: headroom for the heap under the cursor
  levelFollow: 2.4, // per second: the level rises with a little lag
  tension: 2200, // pull between neighbours: how fast a wave travels
  stiffness: 14, // pull back to level: how soon a heap settles
  drag: 2.6,
  scrollSlosh: 0.0008, // tilt per px/s² of the page's acceleration
  sloshMax: 10, // and the most it tilts, edge to middle
  stir: 0.3, // push per unit/s of a pointer moving over the letters, per 60th of a second
  stirReach: 7, // columns either side a pointer's push reaches
  splash: 60, // a click's push down, units/s
  /* The surface reaches for the cursor: it tips toward it and heaps up
     under it, eased so it follows the hand rather than snapping to it. */
  followSwell: 7, // the heap under the cursor, units
  followLean: 3, // how far the whole surface tips toward it
  followWidth: 0.09, // the heap's width, as a share of the name
  followEase: 5, // per second: how quickly it catches the cursor up
  followNear: 140, // px above the letters within which it reaches fully
  followFar: 0.3, // how much it still reaches from elsewhere in the footer
  drops: 14, // drops thrown up by a click
  gravity: 140, // units/s², for the drops
  breathe: 0.35, // the resting swell, so it is never quite still
  bubbles: 10,
} as const;

/* The cursor (CustomCursor.tsx): a point under the hand and a drop of
   oil that glides after it. px and seconds. */
export const CURSOR = {
  ease: 11, // per second: how quickly the drop glides after the point, never passing it
  stretch: 0.00012, // stretch per px/s of the drop's speed
  stretchMax: 0.18,
  wrapMax: { w: 320, h: 90 }, // buttons up to this size are wrapped
  wrapPad: 4, // the drop's gap around a button it wraps
  wrapGive: 0.12, // how far a wrapping drop is drawn off-centre toward the hand
  pull: 4, // most a button leans toward the hand
  pullGive: 0.16, // lean per px the hand is off the button's middle
  letGo: 0.7, // seconds a button takes to spring back
  tagBelow: 180, // targets narrower or shorter than this get the word as a tag beside the point
  tagOffset: 36, // px up and right of the point, for a tag
} as const;

/* The oil in the hero's primary button (CtaOil.tsx): its surface reaches
   for the pointer. Heights in the wave's own units (14 tall). */
export const CTA_OIL = {
  swell: 5, // how high it heaps under the pointer
  lean: 3, // how far the whole surface tips toward it
  reach: 0.22, // the heap's width, as a share of the button
  ripple: 0.9, // the small wave running across
  rippleSpeed: 5, // radians/s
  follow: 7, // per second: how quickly it catches the pointer up
} as const;

/* ------------------------------------------------------------------ *
 * 7. Statement fill
 *
 * The light section's statement fills with ink as it is read: every word
 * starts as a pale tint and darkens to its own colour, in reading order,
 * as the page scrolls. Scrubbed like the transition: the scroll sets the
 * pace, so `front` is counted in words rather than seconds.
 * ------------------------------------------------------------------ */

/* The ship-to-shelf chain in the light section (ShipToShelf.tsx): a drop
   of oil runs it as it is read, lighting each station on arrival. */
export const CHAIN = {
  start: "top 78%", // the drop leaves the ship as the chain comes up
  endAt: 0.42, // and reaches the shelf as the chain's foot passes 42% down
  scrub: 0.8, // s to catch the scroll: the drop glides rather than ticks
  lead: 0.015, // a station lights just before the drop is on it
} as const;

export const FILL = {
  /* How much of its ink an unread word already has: 0 would leave it
     invisible, 1 already filled. The tint is mixed from the section's own
     background and the statement's own colour, so it follows either if
     they change. */
  rest: 0.2,

  /* How many words are part-filled at once. At 1 the fill ticks from word
     to word; at around 4 it reads as one soft front travelling through
     the sentence. */
  front: 4,

  /* Begins once the first line is fully on screen, and is complete as the
     last one reaches the middle, so the whole statement is seen in ink
     while it is still in view. Wherever the page ends too soon for that,
     the fill is complete at the end instead (see reachableScrollEnd). */
  start: "top 90%",
  endAt: 0.55, // the statement's bottom edge, as a fraction down the screen

  /* Seconds the fill takes to catch up with the scrollbar. Unlike the
     handoff, colour has no edge that has to line up with anything, so it
     can trail by a moment -- and that is what turns a mouse wheel's
     notched jumps into one glide. */
  scrub: 0.3, // halved from 0.6 now Lenis smooths the scroll itself
} as const;

/* ------------------------------------------------------------------ *
 * 8. The hand-off, and what is on screen
 *
 * Until the preloader hands off it covers the hero completely, so
 * anything drawing behind it is drawing for nobody. The WebGL field did
 * exactly that for the whole countdown -- some 180 frames nobody could
 * see -- and a trace showed the cost arriving all at once: the queued work
 * was flushed through the GPU in one go at the hand-off, right as the hero
 * appeared. In a CPU-throttled, software-rendered test browser that stall
 * ran two to three seconds; a real GPU clears it far faster, but it was
 * wasted work on every device.
 *
 * HeroMotion marks the hero as the preloader starts to fade; anything that
 * should wait for that subscribes. A data attribute as well as an event, so
 * a subscriber that attaches after the fact still hears that it happened.
 * The same handshake serves anything behind a preloader: /services' page
 * is marked by its manifest.
 * ------------------------------------------------------------------ */

const REVEALED = "zg:revealed";

/** Marks `el` revealed, once: a data attribute and an event. */
export function markRevealed(el: HTMLElement) {
  if ("revealed" in el.dataset) return;
  el.dataset.revealed = "";
  el.dispatchEvent(new Event(REVEALED));
}

/** Calls back once `el` is revealed -- straight away if it already is. */
export function onRevealed(el: HTMLElement, cb: () => void): () => void {
  if ("revealed" in el.dataset) {
    cb();
    return () => {};
  }
  el.addEventListener(REVEALED, cb, { once: true });
  return () => el.removeEventListener(REVEALED, cb);
}

/* Two more facts about the hero, both set by ScrollTransition and carried
   the same way -- a data attribute plus a change event, so a listener that
   attaches late still reads the current state:

   - "leaving": the handoff is under way (any scroll into the hold). The
     map's corridor and ring pulses freeze here, and the WebGL field holds
     its frame: each frame either moves, the browser redraws a layer, and
     that is work it cannot spare while it is also scrolling and fading
     the map.
   - "covered": the flood's first fully opaque stop has crossed the top of
     the screen, so nothing behind it can be seen and the WebGL field
     stops. On a page this short the bottom of the hero is still on screen
     underneath the flood at that point, which is why an
     IntersectionObserver is the wrong tool: it sees position, not what is
     painted over it. */
type HeroFlag = "leaving" | "covered";

export function setHeroFlag(hero: HTMLElement, flag: HeroFlag, on: boolean) {
  if ((flag in hero.dataset) === on) return;
  if (on) hero.dataset[flag] = "";
  else delete hero.dataset[flag];
  hero.dispatchEvent(new Event(`hero:${flag}`));
}

/* Calls back with the current state straight away, then on every change. */
export function onHeroFlag(
  hero: HTMLElement,
  flag: HeroFlag,
  cb: (on: boolean) => void
): () => void {
  const fire = () => cb(flag in hero.dataset);
  fire();
  hero.addEventListener(`hero:${flag}`, fire);
  return () => hero.removeEventListener(`hero:${flag}`, fire);
}

/* ------------------------------------------------------------------ *
 * 9. Housekeeping
 *
 * ScrollTrigger caches element positions, and it already refreshes them
 * on its own -- on resize, on DOMContentLoaded and on load. What it cannot
 * see is web fonts finishing: a late swap reflows the copy and moves every
 * trigger below it. Called from the client, never at import time, so this
 * module stays safe to pull into a server component.
 *
 * This used to add a resize listener of its own as well. That duplicated
 * GSAP's, and overrode its one deliberate exception: on touch devices
 * ScrollTrigger ignores the resizes the address bar causes as it slides in
 * and out, because a full refresh mid-scroll is expensive and, with a
 * pinned section, visibly jumps. The extra listener refreshed on every one
 * of them.
 * ------------------------------------------------------------------ */

export function refreshOnLayoutShift(): () => void {
  if (typeof window === "undefined" || !document.fonts) return () => {};
  let live = true;
  document.fonts.ready.then(() => live && ScrollTrigger.refresh());
  return () => {
    live = false;
  };
}

/* Below the fold, set up when idle.

   Everything useGSAP sets up runs in one piece, in the same task as
   React's hydration. On the home page that was the hero's intro, the
   statement's word split, the corridor map, the tank's WebGL and the FAQ
   together: one long task that, on a phone, froze the preloader's count
   for as long as it ran. None of the sections below the hero can be seen
   for the first seconds -- the preloader covers the page -- so they set
   up in the browser's idle time instead, a task each. The timeout makes
   sure they do on a page that never falls idle; where there is no idle
   callback (Safari), each still gets a task of its own. */
export function afterIdle(fn: () => void, timeout = 1200): () => void {
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(fn, { timeout });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(fn, 1);
  return () => window.clearTimeout(id);
}

/** useGSAP, set up in idle time (see afterIdle). What the setup creates
    still belongs to the component and is reverted with it, and a cleanup
    it returns runs then too. */
export function useIdleGSAP(setup: () => void | (() => void), scope?: RefObject<Element | null>) {
  useGSAP(
    (_, contextSafe) => {
      let undo: void | (() => void);
      const cancel = afterIdle(
        contextSafe!(() => {
          undo = setup();
        })
      );
      return () => {
        cancel();
        undo?.();
      };
    },
    { scope }
  );
}

/* The furthest the page can be counted on to scroll, for anything that
   must be finished by the time it ends. ScrollTrigger's own clamp() uses
   the end it measured, and on a phone that end moves: the toolbars slide
   away as you scroll down, the viewport grows by their height, and the
   last stretch of the page goes with them. It doesn't re-measure for that
   (see above), so a clamped trigger would stop short of complete. 100lvh
   is the viewport with the toolbars gone -- on a desktop, simply the
   viewport. Called at refresh, so the probe costs one layout, and only
   then. */
export function reachableScrollEnd(): number {
  const probe = document.createElement("div");
  probe.style.cssText = "position:fixed;top:0;height:100lvh;visibility:hidden;pointer-events:none";
  document.body.append(probe);
  const largest = probe.offsetHeight;
  probe.remove();
  return ScrollTrigger.maxScroll(window) - Math.max(0, largest - window.innerHeight);
}

/* ------------------------------------------------------------------ *
 * 10. Corridor map
 *
 * The small Karachi-Multan map in the light section. It draws itself
 * once as it scrolls into view -- dots, then the route unrolling north
 * leg by leg, then the cities -- and its pulse only runs while it is on
 * screen.
 * ------------------------------------------------------------------ */

export const CORRIDOR = {
  /* Starts the moment the card's top clears the fold, and is drawn in
     about two seconds: it arrives with the flood, so by the time the eye
     reaches it the route is already there rather than still building. */
  start: "top bottom",
  dotStagger: 0.0004, // per dot of the field's sequence, applied per row
  outlineDuration: 0.5,
  contextDuration: 0.8,
  legDuration: 0.45, // each of M-9, N-5 and M-5, one after the other
  nodeStagger: 0.06,
  pulseDuration: 5.5, // Karachi to Multan, end to end
  pulseDash: 26,
} as const;

/* ------------------------------------------------------------------ *
 * 11. Services -- the pour (Pour.tsx)
 *
 * "Now loading.": the page becomes a tank. The stage holds on the cream
 * while an amber stream pours in and the liquid rises with the scroll,
 * drawn in the map's hex dots. It deepens from amber to the navy the
 * contract carriage section is made of, so the section surfaces inside
 * it rather than being dealt over it. The surface sloshes with the
 * scroll's own acceleration; the stream, the waves and the bubbles run
 * on the clock.
 *
 * Lengths are fractions of the viewport's height unless marked.
 * ------------------------------------------------------------------ */

export const SERVICES = {
  /* Seconds the scrub trails the scroll. Lenis already turns a wheel's
     notches into a glide (section 15), so this only softens what's
     left; any longer and the two lags stack into a drag. */
  scrub: 0.3,
} as const;

export const POUR = {
  /* The dot grid: centre to centre, in CSS px. */
  pitch: 11,
  pitchNarrow: 9,

  /* The drawing buffer (Pour.tsx): the screen's own resolution up to
     maxDpr, within a budget of pixels per frame -- a phone draws at 1.75x,
     a 1440 laptop about 1.4x, a 5K display no more than a laptop. On a
     device that still falls behind (a share of late frames past
     lateShare, after warmFrames) it steps down, to minQuality at most. */
  maxDpr: 1.75,
  pixelBudget: 2.6e6,
  lateFrame: 1 / 40, // seconds: a frame this late counts against it
  lateShare: 0.35,
  warmFrames: 45,
  minQuality: 0.6,

  /* The fill, scrubbed over the spacer plus `overrun` screens: the
     surface starts just below the fold and ends `over` depths above the
     top, so the whole screen is the deep colour by the time the section
     arrives. */
  start: 1.04,
  over: 0.9,
  overrun: 0.35,
  /* Surface to fully deep: amber, burnt, then navy. */
  depth: 0.55,
  /* Depths below the surface where the words turn cream: past the
     bright band, where navy type would sink into the dark. */
  inkSwitch: 0.3,

  /* The stream: where it falls, how wide, and when the valve is open --
     positions on the fill. */
  streamX: 0.72,
  streamXNarrow: 0.86,
  streamWidth: 1.7, // in pitches
  streamWobble: 5, // px it swings near the bottom
  gravity: 2600, // px/s², the head and tail of the stream falling
  valveOpen: 0.03,
  valveClose: 0.6,
  impactDip: 9, // px the surface is pressed down under the stream
  impactWidth: 34, // px

  /* The surface. Four travelling waves (cycles across the screen, and
     radians per second), always breathing a little; the scroll's
     acceleration pumps energy into them and it drains away. */
  waveCycles: [1, 2.3, 4.1, 7.3],
  waveSpeed: [0.55, -0.9, 1.6, -2.4],
  waveIdle: [0.006, 0.004, 0.0024, 0.0012], // of the height
  waveGain: [2.2e-7, 1.6e-7, 1.0e-7, 0.6e-7], // per px/s² of scroll acceleration, per frame
  waveMax: 0.045, // of the height, all four together
  waveDecay: 1.4, // seconds for the extra energy to fall to a third
  /* The tilt: the liquid lags the page and swings back. */
  tiltPerVelocity: -0.045, // px of tilt per px/s of scroll
  tiltMax: 0.07, // of the height
  tiltStiffness: 26,
  tiltDamping: 5.5,

  /* Ripples from a mouse drawn through the surface. */
  rippleReach: 70, // px from the surface the pointer must be within
  rippleEvery: 0.12, // seconds between ripples
  rippleGain: 0.35, // px of strength per px the hand moved down since the last move
  rippleMax: 14,
  rippleSpeed: 240, // px/s each hump runs out
  rippleWidth: 22,
  rippleWiden: 40, // px/s it spreads
  rippleDecay: 1.8, // per second
  rippleLife: 2.6, // seconds before it's gone

  /* The deep: the active cargo's colour glowing under the cards. */
  tintAmount: 0.16,
  tintEase: 2.5, // per second

  /* Reduced motion: one still frame, part-filled. */
  reducedFill: 0.36, // the stage's foot fully deep, meeting the section below
} as const;

/* The tank's lip over the FAQ (FaqLip.tsx), in CSS px and seconds. */
export const LIP = {
  height: 200, // the drawing's box, from the FAQ's top edge
  level: 44, // where the lip's edge rests
  wave: 5, // its slow swell
  drips: 7,
  dripMin: 18, // how far a drip stretches before it lets go
  dripMax: 66,
  growMin: 6, // px/s a drip stretches
  growMax: 17,
  recoil: 0.38, // share of its length a drip keeps once its drop has gone
  gravity: 1400, // px/s², a drop falling
  fall: 130, // px below the lip by which a drop has gone
  sloshGain: 0.015, // px of swing per px/s the scroll's speed changes
  sloshMax: 16,
  sloshDecay: 1.2,
} as const;

/* Cargo held in the cover flow's cards (CargoFill.tsx): a small height
   field per card, stepped like the sight glass (section 16), rocked by
   the cover flow's own motion, the page's scroll and a finger. */
export const TANK = {
  step: 1 / 60,
  columns: 28,
  level: 0.42, // of the fill's box: where the resting surface sits from the top
  carouselGain: 40, // px/step of push per card/frame² the row accelerates
  scrollGain: 0.004, // px/step of push per px/s the scroll's speed changes in a frame
  splash: 5, // px/step dropped into the middle when a card comes forward
  poke: 0.35, // how hard a pointer moving through the surface pushes it
  idle: 0.018, // the road, always rocking a little
  restore: 0.012, // gravity's pull back to level: a tilt settles rather than holding
  bubbleRate: 0.06, // chemicals: chance per step of a new bubble
  bubbleRise: [0.35, 0.8], // px per step
} as const;

/* ------------------------------------------------------------------ *
 * 11b. Cover flow
 *
 * The cargo cards, one at the centre facing the viewer and the rest
 * turned away to either side. Moved by swipe, arrows or keyboard, not by
 * the scroll. The transitions themselves are CSS (see .cf-card), so a
 * change of card mid-move retargets rather than restarts; these are the
 * geometry and the gesture thresholds.
 * ------------------------------------------------------------------ */

export const COVERFLOW = {
  sideAngle: 48, // degrees a side card turns away
  sideScale: 0.8,
  sideDepth: 160, // px a side card sits back from the centre one
  firstGap: 0.62, // centre to first side card, as a fraction of card width
  nextGap: 0.24, // each card after that, the same
  visible: 2, // side cards drawn each way; further ones fade out
  dragPerCard: 0.55, // fraction of card width a drag must cover to move one card
  flickVelocity: 0.4, // px/ms: a quicker release moves one card whatever the distance
} as const;

/* ------------------------------------------------------------------ *
 * 13. Manifest preloader (/services)
 *
 * A dot-matrix printer feeds a bill of lading out a line at a time: the
 * header, then one row per cargo, each typed and ticked LOADED as the
 * page loads. Once the page really has loaded, the sheet is signed and
 * stamped CLEARED, torn off the printer and tossed away, and the page
 * rises in underneath it. Seconds, except where marked.
 * ------------------------------------------------------------------ */

export const MANIFEST = {
  groundIn: 0.35, // printer and readout settle in
  feed: 0.18, // each line feed: the paper jumps up to the next line
  feedOverlap: 0.45, // share of a feed still running when the head starts typing
  headStep: 0.006, // per character, the document's header and fields
  typeStep: 0.008, // per character, the cargo rows
  tick: 0.22, // LOADED pops in at the end of each row
  tickFrom: 1.6, // scale it pops from
  count: 0.3, // the counter catching up with each row
  rowShare: 90, // the counter reaches this with the rows; the rest waits on the real load
  gateMax: 6, // never wait on the load longer than this
  sign: 0.4, // the signature scrawl
  stamp: 0.3, // the stamp coming down
  stampFrom: 2.3, // scale it comes down from
  stampTilt: -11, // degrees it lands at
  thud: 5, // px the sheet gives under the stamp
  hold: 0.25, // a beat to read CLEARED
  tear: 0.2, // the rip along the perforation
  tearTilt: 1.6, // degrees
  toss: 0.8, // the sheet thrown up and away
  tossTilt: -13, // degrees
  tossTip: 34, // degrees it tips back as it goes
  tossDrift: -24, // % of the sheet's width it drifts sideways
  tossDepth: 900, // px of perspective for the tip back
  rise: 1, // the page coming up beneath
  riseFrom: 14, // vh the page starts below its place
  riseScale: 0.96,
  skipSpeed: 4, // a click or key plays the rest this much faster
  reducedHold: 0.6, // reduced motion: the finished sheet is shown this long

  feedEase: "power3.out", // the paper jerks up and stops, like a platen
  thump: "back.out(2.2)", // the stamp overshoots into the paper and settles
  tossEase: "power3.in", // gathers speed as it leaves
} as const;

/* A typewriter's ease: `chars` even steps, one per character. */
export const typeEase = (chars: number) => `steps(${Math.max(1, chars)})`;

/* ------------------------------------------------------------------ *
 * 14. Dispatch (/services)
 *
 * The services page as a transport terminal: a split-flap departure
 * board, then a sight glass showing each cargo's own physics as its
 * chapter scrolls past, then the contract as kilometre posts.
 * ------------------------------------------------------------------ */

export const DISPATCH = {
  /* Split-flap tiles */
  flapStep: 0.055, // one flap falling
  flapSpins: 7, // random characters a tile shows before it lands
  flapSpinsJitter: 5, // up to this many more, per tile, so they don't land together
  flapStagger: 0.028, // left to right along a line
  flapRowStagger: 0.14, // down the board
  flapEase: "power2.in", // a flap drops under its own weight
  flapTilt: 80, // degrees a new face starts from, tipped back
  clockEvery: 20, // seconds between clock reads
  statusEvery: 3.4, // seconds between one row's status moving on

  /* Kilometre posts */
  postsStart: "top 75%",
  roadDraw: 1.6,
  postStagger: 0.18,
} as const;

/* ------------------------------------------------------------------ *
 * 15. Smooth scroll (Lenis)
 *
 * Lenis eases the page's own scroll -- the window still scrolls, so
 * sticky sections and ScrollTrigger work as before -- and is stepped on
 * GSAP's ticker, so every scrubbed animation reads the same position in
 * the same frame. Started by SmoothScroll in the root layout; off under
 * reduced motion, and touch keeps the device's native scroll (Lenis's
 * default). Anything that moves the page goes through scrollToY, so a
 * jump glides the same way a wheel does, and through lockScroll, so a
 * held page can't be wheeled past.
 * ------------------------------------------------------------------ */

export const SMOOTH = {
  lerp: 0.14, // share of the remaining distance covered each frame: tighter than before, so paper doesn't float
  wheelMultiplier: 1,
  jump: 0.8, // seconds a nav jump takes
} as const;

let lenis: Lenis | null = null;
export const setLenis = (l: Lenis | null) => {
  lenis = l;
};

/** Scrolls the page to `y`, gliding unless told not to or motion is reduced. */
export function scrollToY(y: number, { immediate = false } = {}) {
  if (lenis) {
    lenis.scrollTo(y, { immediate, duration: SMOOTH.jump, force: true });
    return;
  }
  window.scrollTo({ top: y, behavior: immediate || prefersReducedMotion() ? "auto" : "smooth" });
}

/** Holds the page still (a preloader over it), or lets it go. */
export function lockScroll(on: boolean) {
  document.documentElement.classList.toggle("scroll-lock", on);
  if (on) lenis?.stop();
  else lenis?.start();
}

/* ------------------------------------------------------------------ *
 * 16. Sight glass (/services) -- CargoGlass.tsx
 *
 * Each cargo simulated in the dot grid. The physics runs in fixed steps
 * of `step` seconds, so it behaves the same at any frame rate; per-step
 * values below are in grid cells.
 * ------------------------------------------------------------------ */

export const GLASS = {
  step: 1 / 60,
  settleSteps: 900, // reduced motion: steps simulated off screen before the one drawing
  dump: 0.6, // seconds the old cargo takes to drop out of the glass
  dumpFall: 200, // rows/s², the dump's gravity
  gravity: 0.05, // rows/step², cartons and grain
  coilRate: 7, // radians/s the molasses rope swings as it coils
  sloshRate: 1.6, // radians/s the road rocks a full load
  bubbleRate: 0.25, // chance per step of a new bubble
  grainRate: 3, // grains poured per step
  grainTotal: 600, // grains in a full pile
} as const;

/* ------------------------------------------------------------------ *
 * 16b. Capacity request (/contact) -- CapacityForm.tsx
 *
 * The slip rises in section by section; sent, it is stamped RECEIVED,
 * the same stamp that clears the manifest on /services.
 * ------------------------------------------------------------------ */

export const CONTACT = {
  /* The slip's entrance is CSS (.ct-rise in globals.css), so it plays
     from the first paint rather than once the script arrives. */
  clearHeader: 120, // px left above the slip when it is scrolled to
  stamp: MANIFEST.stamp,
  stampFrom: MANIFEST.stampFrom,
  stampTilt: -8, // degrees it lands at
  thump: MANIFEST.thump,
} as const;

/* ------------------------------------------------------------------ *
 * 17. Springs (react-spring)
 *
 * For motion that should follow a hand -- drags, hovers, things that can
 * be interrupted and retargeted mid-flight -- a spring beats a timed
 * tween. The same rule holds: components import these, never write
 * tension or friction of their own. Each mirrors a word in section 1.
 * ------------------------------------------------------------------ */

export const SPRING = {
  settle: { tension: 210, friction: 26 }, // arrives with weight, stops clean
  snap: { tension: 380, friction: 32 }, // quick and exact, for direct input
  carry: { tension: 120, friction: 26 }, // large, steady objects
  lift: { tension: 260, friction: 24 }, // small rise into place, a touch of life
} as const;
