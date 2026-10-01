"use client";

import { gsap } from "gsap";
import { useEffect } from "react";

import { scrollMotion, watchScroll } from "@/lib/liquid";
import { FOOTER, prefersReducedMotion, scrollToY } from "@/lib/motion";
import { WORDMARK } from "@/lib/wordmark";

/**
 * Drives the footer (SiteFooter.tsx). Renders nothing.
 *
 * - The reveal: the footer's contents are held still while the page
 *   above scrolls off them, so the page seems to lift away from
 *   something that was underneath all along -- by a script for a mouse,
 *   by the stylesheet on a touch screen (see "Who holds the contents
 *   still" below). `p` is how far uncovered it is, 0-1, and everything
 *   else keys off it.
 * - The tanker drives the corridor as `p` grows, on a spring, so it
 *   pulls away and pulls up rather than sliding; it leans with its own
 *   acceleration, its wheels turn with the distance, it turns round to
 *   drive back when the page goes back up, and it sounds its horn when
 *   pressed.
 * - The oil in the name fills with `p`. Its surface is a row of columns,
 *   each sprung to the level and to its neighbours, so a push anywhere
 *   travels along it as a wave: the page's own acceleration tilts it
 *   (lib/liquid.ts), it heaps and tips toward the cursor, following the
 *   hand, a pointer moving over the letters stirs it, and a
 *   click splashes it, throwing drops that fall back in. Bubbles rise
 *   through it all the while.
 *
 * Runs only while the footer is on screen. Reduced motion: the footer
 * sits in place, the tanker has arrived and the oil is still.
 */

const SVG_NS = "http://www.w3.org/2000/svg";
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const easeOut = (t: number) => 1 - (1 - t) ** 3;
const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);

/* The tyre's radius in the tanker's own units (136 across). */
const TYRE = 7;
const TRUCK_UNITS = 136;

export default function FooterMotion() {
  useEffect(() => {
    const foot = document.getElementById("site-footer");
    const inner = foot?.querySelector<HTMLElement>(".zf-inner");
    const veil = foot?.querySelector<HTMLElement>(".zf-veil");
    const shade = foot?.querySelector<HTMLElement>(".zf-shade");
    const road = foot?.querySelector<HTMLElement>(".zf-road");
    const truck = foot?.querySelector<HTMLButtonElement>(".zf-truck");
    const face = truck?.querySelector<HTMLElement>(".zf-truck-face");
    const body = truck?.querySelector<SVGGElement>(".zf-truck-body");
    const chains = truck?.querySelector<SVGGElement>(".zf-chains");
    const mark = foot?.querySelector<SVGSVGElement>(".zf-mark-svg");
    const shape = mark?.querySelector<SVGPathElement>(".zf-oil-shape");
    const line = mark?.querySelector<SVGPathElement>(".zf-oil-line");
    const bubbleLayer = mark?.querySelector<SVGGElement>(".zf-bubbles");
    const dropLayer = mark?.querySelector<SVGGElement>(".zf-drops");
    const back = foot?.querySelector<HTMLButtonElement>(".zf-return");
    if (
      !foot || !inner || !veil || !shade || !road || !truck || !face || !body || !chains ||
      !mark || !shape || !line || !bubbleLayer || !dropLayer
    )
      return;
    const wheels = Array.from(truck.querySelectorAll<SVGGElement>(".zf-wheel"));
    const stops = Array.from(road.querySelectorAll<HTMLElement>(".zf-stop"));
    const reduced = prefersReducedMotion();

    /* ---- The return trip, and the horn ------------------------------ */
    const onBack = () => scrollToY(0);
    back?.addEventListener("click", onBack);

    let honkTimer = 0;
    const onHonk = () => {
      /* Off and on again, so a second press replays the bubble. */
      delete truck.dataset.honk;
      void truck.offsetWidth;
      truck.dataset.honk = "";
      window.clearTimeout(honkTimer);
      honkTimer = window.setTimeout(() => delete truck.dataset.honk, FOOTER.honk * 1000);
      tv += 60 * facing; // a jolt forward, and the spring pulls it back
    };
    truck.addEventListener("click", onHonk);

    /* ---- The reveal -------------------------------------------------- */
    /* Who holds the contents still while the page lifts off them:
         js    a script, each frame, for a mouse: the smooth scroll is set on
               this same ticker, so the two agree to the pixel.
         css   the stylesheet, for a touch screen whose footer fits the
               smallest window: a finger scrolls off the main thread, so
               anything a script sets lands a frame or two late and the
               contents swim against the scroll. Scroll-driven animations
               tie the hold to the scroll itself, on the compositor.
         none  nothing: touch where that is not available (or the footer is
               taller than the window), and reduced motion. The footer is
               then just scrolled, which can't lag. */
    const touch = window.matchMedia("(pointer: coarse)").matches;
    const canCss = typeof CSS !== "undefined" && CSS.supports("animation-timeline: view()");
    /* The smallest window the footer will be seen in: toolbars out, so it
       doesn't change as they go in and out. */
    const probe = document.createElement("div");
    probe.style.cssText = "position:absolute;width:0;height:100svh;visibility:hidden;pointer-events:none";
    foot.appendChild(probe);
    foot.style.setProperty("--veil", String(FOOTER.veil));
    let mode: "js" | "css" | "none" = "js";

    let p = 0;
    /* What was last written to the page, so a frame that changes nothing
       writes nothing: every write is a style recalculation. */
    let lastTransform = "";
    let lastLift = "";
    const reveal = () => {
      const r = foot.getBoundingClientRect();
      /* No box to measure -- the footer is detached or hidden, as when the
         page is being torn down: nothing to reveal, and a height of 0
         would make `p` NaN, which the oil below never recovers from. */
      if (!(r.height > 0)) return;
      const vh = window.innerHeight;
      /* Page still to scroll before the footer's bottom reaches the
         window's. */
      const remaining = Math.max(0, r.bottom - vh);
      /* Reduced motion has no scroll loop to keep this current, so the
         trip is simply done: the tanker has arrived, every stop is lit. */
      p = reduced ? 1 : clamp(1 - remaining / r.height, 0, 1);
      /* The stylesheet holds it, and dims it, on its own. */
      if (mode === "css") return;
      let transform = "";
      if (mode === "js") {
        /* Held where it will come to rest: a footer that fits the window
           waits with its bottom on the window's bottom; a taller one with
           its top on the window's top, until the page has lifted clear of
           it, and then scrolls on as usual -- so none of it is ever out of
           reach. */
        const over = Math.max(0, r.height - vh);
        /* Never held further than its own height: past that it is wholly
           clipped whatever the distance, and the browser's own sense of
           where the links are -- for find-in-page, and for bringing a
           focused link into view -- stays near the truth. */
        const shift = Math.min(r.height, Math.max(0, remaining - over));
        transform = shift > 0.5 ? `translate3d(0, ${(-shift).toFixed(1)}px, 0)` : "";
      }
      if (transform !== lastTransform) {
        lastTransform = transform;
        inner.style.transform = transform;
      }
      /* The page's darkness over the footer, and its shadow along the
         edge, both gone once it is uncovered: nothing dims the top of it
         at rest. Nothing is held in "none", so nothing is dimmed. */
      const lift = (mode === "js" ? 1 - p : 0).toFixed(3);
      if (lift !== lastLift) {
        lastLift = lift;
        veil.style.opacity = (Number(lift) * FOOTER.veil).toFixed(3);
        shade.style.opacity = lift;
      }
    };

    /* Picked again whenever the footer or the window changes size: what
       fits depends on both. */
    const pick = () => {
      const next = reduced || (touch && !(canCss && foot.offsetHeight <= probe.offsetHeight + 1)) ? "none" : touch ? "css" : "js";
      if (next === mode && foot.dataset.hold === next) return;
      mode = next;
      foot.dataset.hold = next;
      /* Whatever the last mode left inline is not the new mode's. */
      lastTransform = "";
      lastLift = "";
      inner.style.transform = "";
      if (next === "css") {
        veil.style.opacity = "";
        shade.style.opacity = "";
      }
    };
    pick();
    const holdWatch = new ResizeObserver(pick);
    holdWatch.observe(foot);
    window.addEventListener("resize", pick);

    /* Tabbing into the footer before the page has lifted off it: the
       browser brings the focused link to where the held contents are
       drawn, which is not where they will rest. So the page goes on to
       its end, where the footer sits uncovered and every link is where
       it looks. */
    const onFocus = (e: FocusEvent) => {
      /* Keyboard focus only: a click lands where the pointer already is. */
      if (mode === "none" || !(e.target instanceof Element) || !e.target.matches(":focus-visible")) return;
      if (foot.getBoundingClientRect().bottom > window.innerHeight + 1)
        scrollToY(document.documentElement.scrollHeight - window.innerHeight);
    };
    if (!reduced) foot.addEventListener("focusin", onFocus);

    /* ---- The tanker -------------------------------------------------- */
    let tx = -1; // px along the road
    let tv = 0;
    let facing = 1;
    let lastTarget = -1;
    let heading = 0; // the road's own direction of travel, smoothed, px/s
    let wheelA = 0;
    let delivered = false;
    const lit = stops.map(() => false);
    /* The tanker's width and the road's, read when either changes size
       rather than every frame -- straight after the frame's own style
       writes, each read would force the browser to lay out the page. */
    let tw = 0;
    let travel = 0;
    const drawn = { at: "", flip: "", tilt: "", turn: "" };
    const measure = () => {
      tw = truck.offsetWidth;
      travel = Math.max(0, road.clientWidth - tw);
    };
    const ro = new ResizeObserver(measure);
    ro.observe(road);
    ro.observe(truck);
    measure();
    const drive = (dt: number) => {
      const target = p * travel;
      let a = 0;
      if (tx < 0 || reduced) {
        tx = target;
        tv = 0;
      } else {
        const k = FOOTER.follow * FOOTER.follow;
        a = k * (target - tx) - FOOTER.damping * tv;
        tv += a * dt;
        tx += tv * dt;
      }
      /* It turns round only when the trip does -- the page going back up
         -- not on its own spring's overshoot or a jolt from the horn. */
      if (lastTarget >= 0 && dt > 0) heading += ((target - lastTarget) / dt - heading) * 0.15;
      lastTarget = target;
      if (heading > 40) facing = 1;
      else if (heading < -40) facing = -1;
      const lean = clamp(-a * facing * FOOTER.lean, -FOOTER.leanMax, FOOTER.leanMax);
      wheelA += ((tv * dt * facing) / (TYRE * (tw / TRUCK_UNITS))) * (180 / Math.PI);

      /* Only what changed is written: a tanker at rest costs nothing. */
      const at = `translate3d(${tx.toFixed(1)}px, 0, 0)`;
      if (at !== drawn.at) truck.style.transform = drawn.at = at;
      const flip = facing < 0 ? "scaleX(-1)" : "";
      if (flip !== drawn.flip) {
        face.style.transform = drawn.flip = flip;
        truck.toggleAttribute("data-back", facing < 0);
      }
      const tilt = `rotate(${lean.toFixed(2)}deg)`;
      if (tilt !== drawn.tilt) {
        body.style.transform = drawn.tilt = tilt;
        chains.style.transform = `rotate(${(lean * 3).toFixed(2)}deg)`;
      }
      const turn = `rotate(${(wheelA % 360).toFixed(1)}deg)`;
      if (turn !== drawn.turn) {
        drawn.turn = turn;
        wheels.forEach((w) => (w.style.transform = turn));
      }

      /* A stop lights as the tanker's middle reaches it. */
      const mid = travel > 0 ? tx / travel : 1;
      stops.forEach((s, i) => {
        const on = mid >= i / (stops.length - 1) - 0.004;
        if (on !== lit[i]) {
          lit[i] = on;
          s.toggleAttribute("data-lit", on);
        }
      });
      const done = p > 0.985 && Math.abs(tx - travel) < 8;
      if (done !== delivered) {
        delivered = done;
        road.toggleAttribute("data-delivered", done);
      }
    };

    /* ---- The oil ----------------------------------------------------- */
    const N = FOOTER.columns;
    const X0 = WORDMARK.x;
    const W = WORDMARK.w;
    const Y0 = WORDMARK.y;
    const H = WORDMARK.h;
    const BOTTOM = Y0 + H;
    const h = new Float32Array(N); // each column's rise above the level
    const v = new Float32Array(N);
    const acc = new Float32Array(N);
    const ys = new Float32Array(N); // each column's surface, as drawn
    const colX = (i: number) => X0 + (i / (N - 1)) * W;
    const colAt = (x: number) => clamp(Math.round(((x - X0) / W) * (N - 1)), 0, N - 1);
    let level = -1;
    let time = 0;
    /* The cursor the surface reaches for: where it is across the name
       (units), eased, and how hard the oil reaches, eased. */
    let fx = X0 + W / 2;
    let fxTarget = fx;
    let pull = 0;
    let pullTarget = 0;
    /* The oil sleeps -- no physics, no drawing -- while nothing is moving it
       and its resting ripple is too small to see. On a phone the ripple is
       under a pixel, yet drawing it means restyling and repainting the
       whole name 60 times a second, for nobody. Anything that touches it
       wakes it. On a big screen the ripple shows and it never sleeps. */
    let sleeping = false;
    let quiet = 0; // frames in a row with nothing moving
    let peakV = 0;
    let peakA = 0;
    let unitPx = 1; // px per unit of the name, set on resize
    const wake = () => {
      sleeping = false;
      quiet = 0;
    };
    const measureName = () => {
      unitPx = mark.getBoundingClientRect().width / W;
      wake();
    };
    const nameWatch = new ResizeObserver(measureName);
    nameWatch.observe(mark);
    measureName();

    const step = (dt: number) => {
      const tilt = clamp(scrollMotion().a * FOOTER.scrollSlosh, -FOOTER.sloshMax, FOOTER.sloshMax);
      const ux = (fx - X0) / W;
      for (let i = 0; i < N; i++) {
        const l = h[i > 0 ? i - 1 : 1];
        const r = h[i < N - 1 ? i + 1 : N - 2];
        const u = i / (N - 1);
        /* Where this column would rest: tilted by the page's push, and
           heaped and tipped toward the cursor. */
        const g = (u - ux) / FOOTER.followWidth;
        const reach = pull * (FOOTER.followSwell * Math.exp(-g * g) + FOOTER.followLean * (0.5 - Math.abs(u - ux)));
        acc[i] =
          FOOTER.tension * (l + r - 2 * h[i]) -
          FOOTER.stiffness * (h[i] - tilt * (u - 0.5) - reach) -
          FOOTER.drag * v[i];
      }
      peakV = 0;
      peakA = 0;
      for (let i = 0; i < N; i++) {
        v[i] += acc[i] * dt;
        h[i] = clamp(h[i] + v[i] * dt, -16, 16);
        peakV = Math.max(peakV, Math.abs(v[i]));
        peakA = Math.max(peakA, Math.abs(acc[i]));
      }
    };

    /* Drops thrown up by a click, and bubbles rising. */
    type Drop = { el: SVGCircleElement; x: number; y: number; vx: number; vy: number; live: boolean };
    const drops: Drop[] = Array.from({ length: FOOTER.drops * 2 }, () => {
      const el = document.createElementNS(SVG_NS, "circle");
      el.setAttribute("r", "0");
      el.setAttribute("class", "zf-drop");
      dropLayer.appendChild(el);
      return { el, x: 0, y: 0, vx: 0, vy: 0, live: false };
    });
    type Bubble = { el: SVGCircleElement; x: number; y: number; speed: number; r: number; phase: number };
    const bubbles: Bubble[] = Array.from({ length: FOOTER.bubbles }, () => {
      const el = document.createElementNS(SVG_NS, "circle");
      el.setAttribute("class", "zf-bubble");
      bubbleLayer.appendChild(el);
      return { el, x: 0, y: -1, speed: 0, r: 0, phase: 0 };
    });
    const spawnBubble = (b: Bubble, anywhere: boolean) => {
      b.x = rand(X0 + 4, X0 + W - 4);
      const top = BOTTOM - level * H;
      b.y = anywhere ? rand(top + 2, BOTTOM) : BOTTOM + rand(0, 6);
      b.speed = rand(4, 10);
      b.r = rand(0.3, 0.75);
      b.phase = rand(0, Math.PI * 2);
    };

    const surfaceAt = (x: number) => ys[colAt(x)];

    const draw = () => {
      /* One bad number in the surface spreads to its neighbours and never
         leaves: start the oil again from flat rather than draw NaN. */
      if (!Number.isFinite(level) || !Number.isFinite(time) || h.some((x) => !Number.isFinite(x))) {
        h.fill(0);
        v.fill(0);
        time = 0;
        level = -1;
        return;
      }
      const base = BOTTOM - level * H;
      let d = "";
      for (let i = 0; i < N; i++) {
        const u = i / (N - 1);
        const swell = reduced
          ? 0
          : FOOTER.breathe * Math.sin(u * Math.PI * 6 - time * 1.6) +
            FOOTER.breathe * 0.6 * Math.sin(u * Math.PI * 14 + time * 2.3);
        ys[i] = base - h[i] - swell;
        d += `${i ? "L" : "M"}${colX(i).toFixed(2)} ${ys[i].toFixed(2)}`;
      }
      shape.setAttribute("d", `${d}L${X0 + W} ${BOTTOM + 1}L${X0} ${BOTTOM + 1}Z`);
      line.setAttribute("d", d);
    };

    const float = (dt: number) => {
      for (const b of bubbles) {
        if (b.y < 0) spawnBubble(b, true);
        b.y -= b.speed * dt;
        b.x += Math.sin(time * 3 + b.phase) * 2 * dt;
        if (b.y - b.r < surfaceAt(b.x) + 0.6) spawnBubble(b, false);
        b.el.setAttribute("cx", b.x.toFixed(2));
        b.el.setAttribute("cy", b.y.toFixed(2));
        b.el.setAttribute("r", level > 0.06 ? b.r.toFixed(2) : "0");
      }
      for (const dr of drops) {
        if (!dr.live) continue;
        dr.vy += FOOTER.gravity * dt;
        dr.x += dr.vx * dt;
        dr.y += dr.vy * dt;
        const out = dr.x < X0 || dr.x > X0 + W || dr.y > BOTTOM + 8;
        if (out || (dr.vy > 0 && dr.y >= surfaceAt(dr.x))) {
          /* Back in, with a small ring of its own. */
          if (!out) v[colAt(dr.x)] -= 7;
          dr.live = false;
          dr.el.setAttribute("r", "0");
          continue;
        }
        dr.el.setAttribute("cx", dr.x.toFixed(2));
        dr.el.setAttribute("cy", dr.y.toFixed(2));
      }
    };

    /* A pointer moving over the letters stirs the oil near it, hardest
       at the surface; a click splashes it. */
    let px = 0;
    let py = 0;
    let pt = -1;
    const onMove = (e: PointerEvent) => {
      wake();
      const rect = mark.getBoundingClientRect();
      const toUnits = W / rect.width;
      const dtp = (e.timeStamp - pt) / 1000;
      if (pt >= 0 && dtp > 0 && dtp < 0.1) {
        const vx = ((e.clientX - px) / dtp) * toUnits;
        const vy = ((e.clientY - py) / dtp) * toUnits;
        const c = colAt(X0 + (e.clientX - rect.left) * toUnits);
        const yU = Y0 + (e.clientY - rect.top) * toUnits;
        const off = yU - ys[c];
        const prox = off > 0 ? Math.max(0.45, Math.exp(-((off / 14) ** 2))) : Math.exp(-((off / 10) ** 2));
        const push = (vy * 0.7 + Math.abs(vx) * 0.45) * FOOTER.stir * prox * dtp * 60;
        const reach = FOOTER.stirReach;
        for (let j = Math.max(0, c - reach); j <= Math.min(N - 1, c + reach); j++) {
          const g = Math.exp(-(((j - c) / (reach * 0.55)) ** 2));
          v[j] -= push * g;
        }
      }
      px = e.clientX;
      py = e.clientY;
      pt = e.timeStamp;
    };
    const onLeave = () => (pt = -1);
    /* Anywhere over the footer the oil leans toward the cursor; near the
       letters it reaches for it fully. */
    const onHover = (e: PointerEvent) => {
      wake();
      if (e.pointerType !== "mouse") return;
      const rect = mark.getBoundingClientRect();
      const f = foot.getBoundingClientRect();
      fxTarget = clamp(X0 + ((e.clientX - rect.left) / rect.width) * W, X0, X0 + W);
      const near = e.clientY > rect.top - FOOTER.followNear && e.clientY < rect.bottom + 20;
      const over = e.clientY > Math.max(f.top, 0) && e.clientY < f.bottom;
      pullTarget = near ? 1 : over ? FOOTER.followFar : 0;
    };
    const onGone = () => (pullTarget = 0);
    const onDown = (e: PointerEvent) => {
      wake();
      const rect = mark.getBoundingClientRect();
      const toUnits = W / rect.width;
      const x = X0 + (e.clientX - rect.left) * toUnits;
      const c = colAt(x);
      for (let j = Math.max(0, c - 10); j <= Math.min(N - 1, c + 10); j++) {
        v[j] -= FOOTER.splash * Math.exp(-(((j - c) / 3.2) ** 2));
      }
      let n = FOOTER.drops;
      for (const dr of drops) {
        if (dr.live || n <= 0) continue;
        n--;
        dr.live = true;
        dr.x = x + rand(-2.5, 2.5);
        dr.y = ys[c] - 0.5;
        dr.vx = rand(-26, 26);
        dr.vy = -rand(34, 78);
        dr.el.setAttribute("r", rand(0.45, 1.05).toFixed(2));
      }
    };

    /* ---- The frame --------------------------------------------------- */
    const frame = (dt: number) => {
      reveal();
      drive(dt);
      const target = FOOTER.empty + (FOOTER.full - FOOTER.empty) * easeOut(p);
      const rising = Math.abs(target - level) > 4e-4;
      if (sleeping) {
        if (!rising && Math.abs(scrollMotion().v) < 3 && pull < 0.01 && pullTarget < 0.01) return;
        wake();
      }
      if (level < 0 || reduced) level = reduced ? FOOTER.full : target;
      else level += (target - level) * (1 - Math.exp(-dt * FOOTER.levelFollow));
      if (!reduced) {
        time += dt;
        const ease = 1 - Math.exp(-dt * FOOTER.followEase);
        fx += (fxTarget - fx) * ease;
        pull += (pullTarget - pull) * ease;
        /* Two steps a frame at most 1/120 s each, for a stable spring. */
        const steps = Math.min(4, Math.ceil(dt * 120));
        for (let s = 0; s < steps; s++) step(dt / steps);
      }
      draw();
      if (!reduced) float(dt);
      /* Quiet for a third of a second and too small to show: to sleep. */
      const still =
        unitPx * FOOTER.breathe * 1.6 < 0.8 &&
        !rising &&
        peakV < 0.05 &&
        peakA < 2 &&
        Math.abs(scrollMotion().v) < 3 &&
        pull < 0.01 &&
        pullTarget < 0.01 &&
        !drops.some((d) => d.live);
      quiet = still ? quiet + 1 : 0;
      if (quiet > 20) sleeping = true;
    };

    let running = false;
    let last = -1;
    let stopScroll: (() => void) | null = null;
    const tick = (t: number) => {
      const dt = last < 0 ? 1 / 60 : Math.min(1 / 30, t - last);
      last = t;
      frame(dt);
    };
    const start = () => {
      if (running) return;
      running = true;
      last = -1;
      wake();
      stopScroll = watchScroll();
      window.addEventListener("pointermove", onHover, { passive: true });
      document.documentElement.addEventListener("pointerleave", onGone);
      gsap.ticker.add(tick);
    };
    const stop = () => {
      if (!running) return;
      running = false;
      gsap.ticker.remove(tick);
      window.removeEventListener("pointermove", onHover);
      document.documentElement.removeEventListener("pointerleave", onGone);
      pullTarget = 0;
      stopScroll?.();
      stopScroll = null;
    };

    frame(1 / 60);
    let io: IntersectionObserver | null = null;
    const onResize = () => frame(1 / 60);
    if (reduced) window.addEventListener("resize", onResize);
    else {
      mark.addEventListener("pointermove", onMove);
      mark.addEventListener("pointerleave", onLeave);
      mark.addEventListener("pointerdown", onDown);
      io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), {
        rootMargin: "200px 0px",
      });
      io.observe(foot);
    }

    return () => {
      stop();
      ro.disconnect();
      holdWatch.disconnect();
      nameWatch.disconnect();
      window.removeEventListener("resize", pick);
      probe.remove();
      delete foot.dataset.hold;
      io?.disconnect();
      window.removeEventListener("resize", onResize);
      window.clearTimeout(honkTimer);
      back?.removeEventListener("click", onBack);
      foot.removeEventListener("focusin", onFocus);
      truck.removeEventListener("click", onHonk);
      mark.removeEventListener("pointermove", onMove);
      mark.removeEventListener("pointerleave", onLeave);
      mark.removeEventListener("pointerdown", onDown);
      drops.forEach((d) => d.el.remove());
      bubbles.forEach((b) => b.el.remove());
    };
  }, []);

  return null;
}
