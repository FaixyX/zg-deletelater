"use client";

import { animated, useSpring } from "@react-spring/web";
import { useCallback, useEffect, useRef, useState } from "react";

import { CARGO } from "@/lib/cargo";
import { onCargoSelect, showCargo } from "@/lib/liquid";
import { COVERFLOW, SPRING, prefersReducedMotion, scrollToY } from "@/lib/motion";

import CargoFill, { useTankSlosh } from "./CargoFill";
import CargoIcon from "./CargoIcon";

/**
 * The five cargoes as a cover flow: the current card faces the viewer,
 * the others turn away to either side. Swipe or drag sideways, use the
 * arrow buttons or the keyboard's arrow keys, or click a card or a name
 * below to bring it to the centre. Nothing here is tied to the scroll.
 *
 * Every card's pose comes from one number, the row's position in cards
 * -- fractional while a drag is under way -- held in a single spring
 * (react-spring, SPRING in lib/motion.ts). A drag writes the position
 * straight to the cards with no React render per move; a release hands
 * the spring the hand's own speed, so the row carries on from the flick
 * and settles on a card rather than restarting from rest. A new target
 * mid-flight retargets the same spring.
 *
 * Each card holds its cargo (CargoFill), rocked by that same spring: a
 * flick sloshes every load in the row. The card at the centre is told to
 * the rest of the page (lib/liquid.ts) -- the tank behind takes its
 * colour -- and the intro's chips can ask for a card from there.
 */

const N = CARGO.length;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/* The pose of a card `d` places from the centre (negative: to the left). */
function pose(d: number) {
  const ad = Math.abs(d);
  const sgn = Math.sign(d);
  const near = Math.min(ad, 1); // 0 at the centre, 1 from the first side place on
  const far = Math.max(0, ad - 1); // how far past the first side place
  const x = sgn * (near * COVERFLOW.firstGap + far * COVERFLOW.nextGap);
  const angle = -sgn * near * COVERFLOW.sideAngle;
  const z = -near * COVERFLOW.sideDepth - far * 40;
  const scale = 1 - near * (1 - COVERFLOW.sideScale);
  return {
    transform: `translateX(${x * 100}%) translateZ(${z}px) rotateY(${angle}deg) scale(${scale})`,
    opacity: clamp(1 - (ad - COVERFLOW.visible), 0, 1),
    zIndex: 100 - Math.round(ad * 10),
    shade: Math.min(0.5, near * 0.3 + far * 0.1),
  };
}

export default function CargoCoverflow() {
  const [active, setActive] = useState(0);
  const [dragging, setDragging] = useState(false);
  const gesture = useRef<{ id: number; x: number; from: number; w: number; moved: boolean; vx: number; lx: number; lt: number } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [{ pos }, spring] = useSpring(() => ({ pos: 0, config: SPRING.snap }));
  useTankSlosh(pos, rootRef);

  /* The row settles on the current card: from a click, a key, an arrow
     or the end of a drag. A drag's release sets its velocity first (see
     onPointerEnd), and the spring takes it from there. */
  const settleOn = useCallback(
    (i: number, velocity = 0) => {
      spring.start({ pos: i, immediate: prefersReducedMotion(), config: { ...SPRING.snap, velocity } });
    },
    [spring]
  );

  const go = useCallback(
    (i: number, velocity = 0) => {
      const to = clamp(i, 0, N - 1);
      setActive(to);
      settleOn(to, velocity);
    },
    [settleOn]
  );

  /* Mounted on the first card, not sprung to it. */
  useEffect(() => {
    spring.set({ pos: 0 });
  }, [spring]);

  useEffect(() => {
    showCargo(CARGO[active].kind);
  }, [active]);

  /* A chip in the intro asked for a cargo: bring it forward, and the
     cover flow into view if it isn't. */
  useEffect(
    () =>
      onCargoSelect((kind) => {
        const i = CARGO.findIndex((c) => c.kind === kind);
        if (i >= 0) go(i);
        const el = rootRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        /* Room above it for the header: its scroll-margin (.cf). */
        if (r.top < 0 || r.bottom > window.innerHeight)
          scrollToY(r.top + window.scrollY - parseFloat(getComputedStyle(el).scrollMarginTop));
      }),
    [go]
  );

  /* Where a drag has taken the row, in cards: one card per `dragPerCard`
     of a card's width from wherever the row was when it was caught --
     mid-flight included, so grabbing a moving row doesn't jump it. Past
     either end it gives only a third as much, so the row resists being
     pulled away from its first and last card. */
  const dragTo = (dx: number, w: number, from: number) => {
    const at = from - dx / (w * COVERFLOW.dragPerCard);
    if (at < 0) return at / 3;
    if (at > N - 1) return N - 1 + (at - (N - 1)) / 3;
    return at;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const card = stageRef.current?.querySelector<HTMLElement>(".cf-card");
    gesture.current = {
      id: e.pointerId,
      x: e.clientX,
      from: pos.get(),
      w: card?.offsetWidth ?? 400,
      moved: false,
      vx: 0,
      lx: e.clientX,
      lt: e.timeStamp,
    };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    const dx = e.clientX - g.x;
    if (!g.moved) {
      if (Math.abs(dx) < 6) return;
      g.moved = true;
      /* Captured only once it is a real drag, so a plain click still
         reaches the card it was on. */
      stageRef.current?.setPointerCapture(e.pointerId);
      setDragging(true);
    }
    /* The hand's speed over the last move, smoothed, for the release. */
    const dt = e.timeStamp - g.lt;
    if (dt > 0) g.vx = 0.6 * ((e.clientX - g.lx) / dt) + 0.4 * g.vx;
    g.lx = e.clientX;
    g.lt = e.timeStamp;
    /* Straight to the cards: no render, no easing, under the finger. */
    spring.start({ pos: dragTo(dx, g.w, g.from), immediate: true });
  };
  const onPointerEnd = (e: React.PointerEvent) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    gesture.current = null;
    if (!g.moved) return;
    const dx = e.clientX - g.x;
    /* A pointer that stopped before letting go has no speed left. */
    const velocity = e.timeStamp - g.lt > 80 ? 0 : g.vx;
    const at = dragTo(dx, g.w, g.from);
    let to = Math.round(at);
    /* A flick moves one card even if it didn't travel far. */
    if (to === active && Math.abs(velocity) > COVERFLOW.flickVelocity) to = active - Math.sign(dx);
    setDragging(false);
    /* The spring starts at the hand's speed, in cards per ms. Only while
       the row is inside its ends: past them the drag was resisted, and
       the pull back should start from rest. */
    const inside = at >= 0 && at <= N - 1;
    go(to, inside ? -velocity / (g.w * COVERFLOW.dragPerCard) : 0);
    /* Swallow the click that follows a drag, so ending a drag on a side
       card doesn't also jump to it. */
    const stage = stageRef.current;
    if (stage) {
      const stop = (ev: Event) => ev.stopPropagation();
      stage.addEventListener("click", stop, { capture: true, once: true });
      setTimeout(() => stage.removeEventListener("click", stop, { capture: true }), 0);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const to = { ArrowLeft: active - 1, ArrowRight: active + 1, Home: 0, End: N - 1 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    go(to);
  };

  return (
    <div
      className="cf"
      ref={rootRef}
      role="region"
      aria-roledescription="carousel"
      aria-label="Cargoes we carry"
      onKeyDown={onKeyDown}
    >
      <div className="cf-head">
        <div>
          <p className="svc-eyebrow" data-eyebrow="05">
            <i />
            Services
          </p>
          <p className="cf-count" aria-live="polite">
            <span className="cf-count-now">{String(active + 1).padStart(2, "0")}</span>
            <span className="cf-count-of"> / {String(N).padStart(2, "0")}</span>
            <span className="sr-only">: {CARGO[active].name}</span>
          </p>
        </div>
        <div className="cf-arrows">
          <button type="button" className="cf-arrow" onClick={() => go(active - 1)} disabled={active === 0} aria-label="Previous cargo">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 5 L8 12 L15 19" />
            </svg>
          </button>
          <button type="button" className="cf-arrow" onClick={() => go(active + 1)} disabled={active === N - 1} aria-label="Next cargo">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 5 L16 12 L9 19" />
            </svg>
          </button>
        </div>
      </div>

      <div
        className="cf-stage"
        ref={stageRef}
        data-dragging={dragging ? "" : undefined}
        tabIndex={0}
        data-cursor="Drag"
        aria-label="Cargo cards. Use the left and right arrow keys to move between them."
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
      >
        {CARGO.map((c, i) => (
          <animated.article
            key={c.kind}
            className="cf-card svc-cargo"
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${N}: ${c.name}`}
            aria-hidden={i !== active}
            style={{
              transform: pos.to((p) => pose(i - p).transform),
              opacity: pos.to((p) => pose(i - p).opacity),
              zIndex: pos.to((p) => pose(i - p).zIndex),
            }}
            onClick={() => i !== active && go(i)}
          >
            <div className="svc-cargo-head">
              <span>{String(i + 1).padStart(2, "0")}</span>
              <span>Contract carriage</span>
            </div>
            <CargoIcon kind={c.kind} uid={`cf-${c.kind}`} className="svc-cargo-icon" />
            <h3 className="svc-cargo-name">{c.name}</h3>
            <p className="svc-cargo-line">{c.line}</p>
            <p className="svc-cargo-body">{c.body}</p>
            <ul className="svc-cargo-specs">
              {c.specs.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <CargoFill kind={c.kind} active={i === active} />
            <animated.div
              className="svc-cargo-shade"
              aria-hidden="true"
              style={{ opacity: pos.to((p) => pose(i - p).shade) }}
            />
          </animated.article>
        ))}
      </div>

      <ol className="cf-names">
        {CARGO.map((c, i) => (
          <li key={c.kind}>
            <button type="button" onClick={() => go(i)} aria-current={i === active ? "true" : undefined}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              {c.name}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
