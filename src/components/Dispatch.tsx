"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { memo, useCallback, useEffect, useRef, useState } from "react";

import { CARGO } from "@/lib/cargo";
import { DISPATCH, DUR, EASE, LIFT_Y, STAGGER, START, onRevealed, prefersReducedMotion, scrollToY, withMotion } from "@/lib/motion";
import { CHAPTERS, CONTRACT_STEPS } from "@/lib/services";

import CargoIcon from "./CargoIcon";
import CargoGlass from "./CargoGlass";
import { Safe } from "./Safe";
import SplitFlap from "./SplitFlap";

/**
 * /services as a dispatch office.
 *
 *   board  ── a split-flap departures board: the five cargoes, each a row
 *   glass  ── a sight glass, sticky, showing each cargo's own physics
 *             while its chapter scrolls past
 *   road   ── how a contract runs, as kilometre posts
 *   band   ── the five names running past, and the sign-off
 *
 * The board flips once the manifest preloader has lifted (#svc-page is
 * marked revealed); everything below is driven by the scroll.
 */

const N = CHAPTERS.length;
const pad = (n: number) => String(n).padStart(2, "0");
const nameOf = (i: number) => CARGO.find((c) => c.kind === CHAPTERS[i].kind)!.name;

/* ---- The board's rows, as runs of tiles -------------------------- */
const HEAD_CELLS = 14;
const cell = (s: string, w: number) => s.toUpperCase().slice(0, w).padEnd(w, " ");
/* [colour tile] [no] [cargo] [from] [to] [equipment] [status], one blank
   tile between each. Head labels sit over the column's first tile. */
const ROW = {
  wide: {
    cells: 67,
    accentFrom: 56,
    text: (i: number, status: string) => {
      const c = CHAPTERS[i];
      return [" ", pad(i + 1), cell(nameOf(i), 14), cell(c.board.from, 11), cell(c.board.to, 11), cell(c.board.equipment, 11), cell(status, 11)].join(" ");
    },
    head: [["No", 2], ["Cargo", 5], ["From", 20], ["To", 32], ["Equipment", 44], ["Status", 56]] as [string, number][],
  },
  narrow: {
    cells: 19,
    text: (i: number) => [" ", pad(i + 1), cell(nameOf(i), 14)].join(" "),
    head: [["No", 2], ["Cargo", 5]] as [string, number][],
  },
};

/* What a row's status can read, in the order a load goes through them. */
const STATUSES = ["ON CONTRACT", "LOADING", "IN TRANSIT", "DISCHARGING", "DELIVERED"];

/* Karachi's time, read in the browser: the server can't know it at the
   moment the page is read. */
function Clock() {
  const [now, setNow] = useState("--:--");
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Karachi", hour: "2-digit", minute: "2-digit" });
    const read = () => setNow(fmt.format(new Date()));
    read();
    const id = setInterval(read, DISPATCH.clockEvery * 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="dsp-clock">{now}</span>;
}

/* The departures board. Its own component because it owns the live
   status: each tick re-renders these rows, never the rest of the page. */
const Board = memo(function Board({ revealed, go }: { revealed: boolean; go: (i: number) => (e: React.MouseEvent) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<string[]>(() => CHAPTERS.map(() => STATUSES[0]));

  /* A live board: every so often one row moves its load on a stage.
     Only while the board is on screen, and never under reduced motion. */
  useEffect(() => {
    const board = ref.current;
    if (!revealed || !board || prefersReducedMotion()) return;
    let id = 0;
    const io = new IntersectionObserver(([e]) => {
      window.clearInterval(id);
      if (!e.isIntersecting) return;
      id = window.setInterval(() => {
        setStatus((prev) => {
          const next = [...prev];
          const r = Math.floor(Math.random() * next.length);
          next[r] = STATUSES[(STATUSES.indexOf(next[r]) + 1) % STATUSES.length];
          return next;
        });
      }, DISPATCH.statusEvery * 1000);
    });
    io.observe(board);
    return () => {
      io.disconnect();
      window.clearInterval(id);
    };
  }, [revealed]);

  return (
    <div className="dsp-board" ref={ref}>
      <div className="dsp-board-head">
        <span>
          <i className="dsp-led" /> Zia Goods dispatch
        </span>
        <span className="dsp-board-kind">
          Departures<span className="dsp-board-kind-more"> · contract carriage</span>
        </span>
        <span>
          Karachi <Clock />
        </span>
      </div>

      {/* The board's caption is part of the heading: what the page is
          about, in the words people search for, above the tiles. */}
      <h1 className="dsp-title" id="dsp-title">
        <span className="dsp-title-kicker">Freight &amp; tanker transport in Pakistan</span>{" "}
        <SplitFlap
          text="FIVE CARGOES"
          width={HEAD_CELLS}
          chips={{ 12: CHAPTERS[0].tone, 13: CHAPTERS[1].tone }}
          fit
          play={revealed}
          label="Five cargoes,"
        />
        <SplitFlap
          text="ONE FLEET"
          width={HEAD_CELLS}
          chips={{ 11: CHAPTERS[2].tone, 12: CHAPTERS[3].tone, 13: CHAPTERS[4].tone }}
          fit
          play={revealed}
          delay={0.25}
          label="one fleet."
        />
      </h1>

      {/* One continuous run of tiles per row, as on a Solari board:
          the columns are cells of the same grid, so they line up by
          construction. Phones get a shorter row. */}
      <div className="dsp-rows" role="list" aria-label="Services">
        {(["wide", "narrow"] as const).map((size) => (
          <div className={`dsp-cols dsp-cols--${size}`} aria-hidden="true" key={size} style={{ "--n": ROW[size].cells } as React.CSSProperties}>
            {ROW[size].head.map(([label, at]) => (
              <span key={label} style={{ gridColumnStart: at + 1 }}>
                {label}
              </span>
            ))}
          </div>
        ))}
        {CHAPTERS.map((c, i) => (
          <a className="dsp-line" role="listitem" key={c.kind} href={`#svc-${c.kind}`} onClick={go(i)}>
            <SplitFlap
              text={ROW.wide.text(i, status[i])}
              chips={{ 0: c.tone }}
              accentFrom={ROW.wide.accentFrom}
              fit
              play={revealed}
              delay={0.5 + i * DISPATCH.flapRowStagger}
              label={`${nameOf(i)}: ${c.board.from} to ${c.board.to}, ${c.board.equipment}, ${status[i]}`}
              className="dsp-line--wide"
            />
            <SplitFlap
              text={ROW.narrow.text(i)}
              chips={{ 0: c.tone }}
              fit
              play={revealed}
              delay={0.5 + i * DISPATCH.flapRowStagger}
              label={nameOf(i)}
              className="dsp-line--narrow"
            />
          </a>
        ))}
      </div>
    </div>
  );
});

/* The sticky sight glass and its readout. Its own component because it
   owns which chapter is in view: a chapter change re-renders the glass,
   not the board's thousand-odd flap tiles. */
function FleetStage() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useGSAP(() => {
    const chapters = ref.current?.parentElement?.querySelector<HTMLElement>(".fl-chapters");
    if (!chapters) return;
    /* The sight glass shows whichever cargo's chapter holds the middle of
       the chapters' scroll; it runs its own clock from there, so only the
       switch is tied to the scroll. Set only on a change, not per frame. */
    let shown = 0;
    ScrollTrigger.create({
      trigger: chapters,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        const i = Math.round(self.progress * (N - 1));
        if (i !== shown) setActive((shown = i));
      },
    });
  }, []);

  return (
    <div className="fl-stage" ref={ref}>
      <div className="fl-stage-head">
        <span className="fl-count">
          {pad(active + 1)}
          <em> / {pad(N)}</em>
        </span>
        <SplitFlap text={nameOf(active)} width={14} className="fl-name" />
      </div>
      <Safe name="cargo glass">
        <CargoGlass kind={CHAPTERS[active].kind} className="fl-canvas" />
      </Safe>
      <div className="fl-read" aria-live="polite">
        <p className="fl-read-note">{CHAPTERS[active].glass.behaviour}</p>
        <dl>
          {CHAPTERS[active].glass.readings.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </div>
      <ol className="fl-ticks" aria-hidden="true">
        {CHAPTERS.map((c, i) => (
          <li key={c.kind} data-on={i === active ? "" : undefined} />
        ))}
      </ol>
    </div>
  );
}

export default function Dispatch() {
  const root = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  /* The board waits for the preloader, which marks #svc-page revealed. */
  useEffect(() => {
    const page = root.current?.closest<HTMLElement>("#svc-page");
    if (page) return onRevealed(page, () => setRevealed(true));
  }, []);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      withMotion(() => {
        /* ---- Chapter copy rises as each arrives ------------------- */
        gsap.utils.toArray<HTMLElement>(".fl-chapter", el).forEach((ch) => {
          gsap.from(ch.querySelectorAll(".fl-rise"), {
            autoAlpha: 0,
            y: LIFT_Y,
            duration: DUR.settle,
            ease: EASE.lift,
            stagger: STAGGER,
            scrollTrigger: { trigger: ch, start: START },
          });
        });

        /* ---- The road draws, and the posts come up along it ------- */
        const road = el.querySelector<HTMLElement>(".km-road")!;
        gsap
          .timeline({ scrollTrigger: { trigger: road, start: DISPATCH.postsStart } })
          .from(road.querySelector(".km-line"), { scaleX: 0, scaleY: 0, duration: DISPATCH.roadDraw, ease: EASE.carry })
          .from(
            road.querySelectorAll(".km-post"),
            { autoAlpha: 0, y: LIFT_Y, duration: DUR.settle, ease: EASE.lift, stagger: DISPATCH.postStagger },
            "<0.2"
          );

        /* ---- The sign-off ----------------------------------------- */
        gsap.from(el.querySelectorAll(".dsp-end .fl-rise"), {
          autoAlpha: 0,
          y: LIFT_Y,
          duration: DUR.settle,
          ease: EASE.lift,
          stagger: STAGGER,
          scrollTrigger: { trigger: el.querySelector(".dsp-end"), start: START },
        });
      });
    },
    { scope: root }
  );

  const go = useCallback((i: number) => (e: React.MouseEvent) => {
    const target = document.getElementById(`svc-${CHAPTERS[i].kind}`);
    if (!target) return;
    e.preventDefault();
    /* On a phone the vehicle rides stuck to the top of the screen, so
       the chapter has to land below it rather than under it. */
    const stage = root.current?.querySelector<HTMLElement>(".fl-stage");
    const under = window.matchMedia("(max-width: 900px)").matches && stage ? stage.offsetHeight : 0;
    scrollToY(target.getBoundingClientRect().top + window.scrollY - under);
  }, []);

  return (
    <div className="dsp" ref={root}>
      {/* ---- The board ---------------------------------------------- */}
      <section className="dsp-hero" id="contract-carriage" aria-labelledby="dsp-title">
        <Board revealed={revealed} go={go} />

        <div className="dsp-hero-foot">
          <p>
            Contract freight for Pakistan&apos;s industries, from Port Qasim to every major city.
            Five cargoes, each on equipment kept for it, and one team keeping the road link in
            your supply chain unbroken. Pick a line on the board, or scroll to see each cargo in
            the glass.
          </p>
          <span className="dsp-scroll" aria-hidden="true">
            Scroll <i />
          </span>
        </div>
      </section>

      {/* ---- The fleet ---------------------------------------------- */}
      <section className="fl" id="services" aria-label="Our services">
        <FleetStage />

        <div className="fl-chapters">
          {CHAPTERS.map((c, i) => (
            <article className="fl-chapter" id={`svc-${c.kind}`} key={c.kind} aria-labelledby={`svc-${c.kind}-h`}>
              <p className="fl-rise fl-kicker" data-eyebrow={pad(i + 1)}>
                <i />
                <CargoIcon kind={c.kind} uid={`fl-${c.kind}`} className="fl-kicker-icon" />
                {nameOf(i)}
              </p>
              <h2 className="fl-rise fl-headline" id={`svc-${c.kind}-h`}>
                {c.headline}
              </h2>
              <p className="fl-rise fl-lede">{c.lede}</p>
              {c.body.map((p) => (
                <p className="fl-rise fl-body" key={p.slice(0, 24)}>
                  {p}
                </p>
              ))}
              <div className="fl-rise fl-how">
                <p className="fl-how-title">How we carry it</p>
                <ol>
                  {c.practice.map((p, j) => (
                    <li key={p}>
                      <span>{pad(j + 1)}</span>
                      {p}
                    </li>
                  ))}
                </ol>
              </div>
              <dl className="fl-rise fl-plate">
                {c.plate.map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
                <i className="fl-rivet" />
                <i className="fl-rivet" />
                <i className="fl-rivet" />
                <i className="fl-rivet" />
              </dl>
            </article>
          ))}
        </div>
      </section>

      {/* ---- The road ----------------------------------------------- */}
      <section className="km" aria-labelledby="km-title">
        <div className="km-head">
          <p className="svc-eyebrow" data-eyebrow={pad(CHAPTERS.length + 1)}>
            <i />
            On contract
          </p>
          <h2 className="km-title" id="km-title">
            How contract carriage works.
          </h2>
        </div>
        <ol className="km-road">
          <i className="km-line" aria-hidden="true" />
          {CONTRACT_STEPS.map((s, i) => (
            <li className="km-post" key={s.km}>
              <span className="km-stone" aria-hidden="true">
                <span className="km-cap">ZG</span>
                <span className="km-num">{s.km}</span>
              </span>
              <span className="km-step">Step {pad(i + 1)}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---- The band and the sign-off ------------------------------ */}
      <section className="dsp-end" aria-label="In short">
        <div className="dsp-band" aria-hidden="true">
          <div className="dsp-band-track">
            {[0, 1].map((copy) => (
              <span key={copy}>
                {CARGO.map((c) => (
                  <span key={c.kind}>
                    {c.name}
                    <i />
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
        <p className="fl-rise dsp-end-line">
          One fleet.
          <br />
          Five cargoes.
          <br />
          <em>On contract, nationwide.</em>
        </p>
      </section>
    </div>
  );
}
