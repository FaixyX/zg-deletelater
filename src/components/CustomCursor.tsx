"use client";

import { gsap } from "gsap";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { CURSOR, prefersReducedMotion } from "@/lib/motion";

/**
 * The site's cursor: a drop of oil. An amber point sits exactly under the
 * hand; a drop glides after it, stretching a little along the way it is
 * flung and rounding up again as it settles. It takes its colour from
 * whatever is under it (a difference blend), so it reads on the navy and
 * the cream alike.
 *
 * What it is over changes it:
 * - a link or a control: the drop swells;
 * - a button: the drop lets go of the point and wraps the button,
 *   outline to outline, and the button leans toward the hand;
 * - something marked data-cursor: the drop fills and says what to do
 *   there -- Drag, Stir, Honk;
 * - a text field: it steps aside for the text cursor.
 * A press squeezes it; letting go throws a ring of amber off the point.
 *
 * Only for a mouse (hover and a fine pointer); touch, pens and reduced
 * motion keep the system cursor. Renders the pieces; all movement is one
 * GSAP ticker callback writing transforms, with no React renders.
 */

const ACTIVE = "a, button, [role='button'], label, summary, select, [data-cursor]";
const MAGNET = ".glass, .cf-arrow, .zf-return, [data-cursor-magnet]";
const TEXT = "input:not([type='checkbox']):not([type='radio']):not([type='submit']):not([type='button']), textarea, [contenteditable='true']";
/* Moved by other things already (the nav's own highlight, the tanker's
   drive), so they are never pulled. */
const NO_PULL = ".site-nav, .zf-truck";

type Mode = "rest" | "link" | "wrap" | "label" | "text";

export default function CustomCursor() {
  const root = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const reset = useRef<() => void>(() => {});

  /* A page change leaves whatever the cursor was wrapping behind. */
  useEffect(() => reset.current(), [pathname]);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!fine.matches || prefersReducedMotion()) return;
    const drop = el.querySelector<HTMLElement>(".zc-drop")!;
    const dot = el.querySelector<HTMLElement>(".zc-dot")!;
    const label = el.querySelector<HTMLElement>(".zc-label")!;
    const html = document.documentElement;

    const hand = { x: -100, y: -100 };
    const pos = { x: -100, y: -100, vx: 0, vy: 0 };
    let seen = false;
    let mode: Mode = "rest";
    let target: HTMLElement | null = null;
    let pulled: HTMLElement | null = null;
    let down = false;
    let frame = 0;
    const lastPull = { x: 0, y: 0 };
    /* The wrapped button's corner radius, read once as the drop takes
       hold of it, and the drop's size as last written: a button's shape
       doesn't change under the hand, so neither is touched per frame. */
    let wrapRadius = 0;
    let wrapSize = "";

    const setMode = (m: Mode, t: HTMLElement | null) => {
      if (t === target && m === mode) return;
      if (pulled && pulled !== t) {
        gsap.to(pulled, { translate: "0px 0px", duration: CURSOR.letGo, ease: "elastic.out(1, 0.45)", overwrite: "auto" });
        pulled = null;
      }
      mode = m;
      target = t;
      el.dataset.mode = m;
      const text = m === "label" ? (t?.dataset.cursor ?? "") : "";
      if (label.textContent !== text) label.textContent = text;
      wrapSize = "";
      if (m === "wrap" && t) wrapRadius = parseFloat(getComputedStyle(t).borderTopLeftRadius) || 0;
      else {
        drop.style.width = "";
        drop.style.height = "";
        drop.style.borderRadius = "";
      }
    };

    /* What is under the hand, and what the cursor should become there. */
    const read = (under: Element | null) => {
      if (!under) return setMode("rest", null);
      if (under.closest(TEXT)) return setMode("text", null);
      const hit = under.closest<HTMLElement>(ACTIVE);
      if (!hit) return setMode("rest", null);
      if (hit.dataset.cursor) {
        /* Small things would vanish under a full drop: the word rides
           beside the point instead, as a tag. */
        const r = hit.getBoundingClientRect();
        el.toggleAttribute("data-tag", r.width < CURSOR.tagBelow || r.height < CURSOR.tagBelow);
        return setMode("label", hit);
      }
      if (hit.matches(MAGNET)) {
        const r = hit.getBoundingClientRect();
        if (r.width <= CURSOR.wrapMax.w && r.height <= CURSOR.wrapMax.h) return setMode("wrap", hit);
      }
      setMode("link", hit);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      hand.x = e.clientX;
      hand.y = e.clientY;
      if (!seen) {
        seen = true;
        pos.x = hand.x;
        pos.y = hand.y;
        el.dataset.on = "";
      }
      read(e.target as Element);
    };
    const onLeave = () => {
      seen = false;
      delete el.dataset.on;
      setMode("rest", null);
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      down = true;
      el.dataset.down = "";
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || !down) return;
      down = false;
      delete el.dataset.down;
      /* A ring of amber thrown off the point. */
      const ring = document.createElement("span");
      ring.className = "zc-splash";
      ring.style.transform = `translate3d(${hand.x}px, ${hand.y}px, 0)`;
      el.appendChild(ring);
      ring.addEventListener("animationend", () => ring.remove(), { once: true });
    };

    let last = -1;
    const tick = (t: number) => {
      const dt = last < 0 ? 1 / 60 : Math.min(1 / 30, t - last);
      last = t;
      if (!seen) return;

      /* The page can scroll a new thing under a still hand. */
      if (++frame % 6 === 0) read(document.elementFromPoint(hand.x, hand.y));

      /* Where the drop is headed: the hand, or the middle of the button it
         is wrapping, drawn a little toward the hand. */
      let tx = hand.x;
      let ty = hand.y;
      if (mode === "label" && el.hasAttribute("data-tag")) {
        tx += CURSOR.tagOffset;
        ty -= CURSOR.tagOffset;
      }
      if (mode === "wrap" && target) {
        const r = target.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = hand.x - cx;
        const dy = hand.y - cy;
        tx = cx + dx * CURSOR.wrapGive;
        ty = cy + dy * CURSOR.wrapGive;
        const w = r.width + CURSOR.wrapPad * 2;
        const h = r.height + CURSOR.wrapPad * 2;
        const size = `${w.toFixed(1)} ${h.toFixed(1)}`;
        if (size !== wrapSize) {
          wrapSize = size;
          drop.style.width = `${w}px`;
          drop.style.height = `${h}px`;
          drop.style.borderRadius = `${Math.min(wrapRadius + CURSOR.wrapPad, h / 2)}px`;
        }
        /* And the button leans toward the hand. */
        if (!target.closest(NO_PULL)) {
          const px = gsap.utils.clamp(-CURSOR.pull, CURSOR.pull, dx * CURSOR.pullGive);
          const py = gsap.utils.clamp(-CURSOR.pull, CURSOR.pull, dy * CURSOR.pullGive);
          if (target !== pulled || Math.abs(px - lastPull.x) > 0.3 || Math.abs(py - lastPull.y) > 0.3) {
            gsap.to(target, { translate: `${px}px ${py}px`, duration: 0.35, ease: "power3.out", overwrite: "auto" });
            lastPull.x = px;
            lastPull.y = py;
          }
          pulled = target;
        }
      }

      /* Eased, not sprung: it glides after the point and settles on it
         without ever passing it, at the same pace whatever the frame
         rate. Its speed, for the stretch, is how far it moved. */
      const ease = 1 - Math.exp(-dt * CURSOR.ease);
      const nx = pos.x + (tx - pos.x) * ease;
      const ny = pos.y + (ty - pos.y) * ease;
      pos.vx += ((nx - pos.x) / dt - pos.vx) * 0.25;
      pos.vy += ((ny - pos.y) / dt - pos.vy) * 0.25;
      pos.x = nx;
      pos.y = ny;

      /* Stretched along the way it is going, the faster the more; not
         while wrapping a button or holding a word. */
      const speed = Math.hypot(pos.vx, pos.vy);
      const free = mode === "rest" || mode === "link";
      const s = free ? Math.min(CURSOR.stretchMax, speed * CURSOR.stretch) : 0;
      /* A stretched drop turns to face its travel; a round one, or one
         wrapping a button or holding a word, stays square to the page. */
      const angle = free ? Math.atan2(pos.vy, pos.vx) * (180 / Math.PI) : 0;
      drop.style.transform =
        `translate3d(${pos.x.toFixed(1)}px, ${pos.y.toFixed(1)}px, 0) rotate(${angle.toFixed(1)}deg) ` +
        `scale(${(1 + s).toFixed(3)}, ${(1 - s * 0.45).toFixed(3)})`;
      dot.style.transform = `translate3d(${hand.x}px, ${hand.y}px, 0)`;
    };

    reset.current = () => setMode("rest", null);
    html.classList.add("zc-on");
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    html.addEventListener("pointerleave", onLeave);
    gsap.ticker.add(tick);
    return () => {
      html.classList.remove("zc-on");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      html.removeEventListener("pointerleave", onLeave);
      gsap.ticker.remove(tick);
      setMode("rest", null);
      reset.current = () => {};
    };
  }, []);

  return (
    <div className="zc" ref={root} aria-hidden="true">
      <div className="zc-drop">
        <span className="zc-label" />
      </div>
      <div className="zc-dot" />
    </div>
  );
}
