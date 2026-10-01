"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef, useState } from "react";

import { CARGO, type CargoKind } from "@/lib/cargo";
import { DUR, EASE, LIFT_Y, MANIFEST, STAGGER, lockScroll, markRevealed, scrollToY, typeEase, withMotion } from "@/lib/motion";

/**
 * The /services preloader: a bill of lading, printed.
 *
 * A dot-matrix printer sits under the middle of the screen and feeds a
 * sheet of continuous stationery out of its slot a line at a time. Each
 * line is typed as it reaches the print head: the header, the fields,
 * the route, then one row per cargo, each ticked LOADED as the counter
 * below climbs. The rows take the counter to 90; the last 10 wait on the
 * page having really loaded (fonts and all), so the manifest can't clear
 * before the page is ready. Then it is signed, stamped CLEARED, torn off
 * along the perforation and tossed away, and the page rises in beneath.
 *
 * Everything that moves is a transform, an opacity, a clip or a custom
 * property: nothing reflows once it starts. Positions are measured once,
 * lazily, as each feed begins. A click or a key plays the rest faster.
 *
 *   #bl ── ground (fades last, uncovering the page)
 *       ├─ stack ── feed (clips the sheet at the slot) ── sheet
 *       │        └─ printer
 *       └─ readout: counter, label, bar
 */

/* What each cargo travels on, as the manifest's EQUIPMENT column. */
const EQUIPMENT: Record<CargoKind, string> = {
  "edible-oil": "Food-grade tanker",
  molasses: "Bulk tanker",
  chemicals: "Placarded tanker",
  "finished-goods": "Closed-body truck",
  "dry-cargo": "Flatbed / container",
};

/* A barcode for the corner of the sheet: fixed, so the server and the
   browser draw the same one. Widths from a small LCG, seeded. */
const BARS = (() => {
  let seed = 0x5a1a;
  let x = 0;
  const bars: { x: number; w: number }[] = [];
  while (x < 116) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const w = 1 + (seed % 3);
    const gap = 1 + ((seed >> 4) % 2);
    bars.push({ x, w });
    x += w + gap;
  }
  return bars;
})();

/* The document number and date are today's, set in the browser once it
   has mounted. Both are fixed-width, so the placeholders the server
   renders take exactly the same room. */
const pad = (n: number) => String(n).padStart(2, "0");
const DOC_NO = (d: Date) => `NO. ZG-${d.getFullYear()}-${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
const DOC_DATE = (d: Date) => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
const PLACEHOLDER = new Date(2026, 0, 1);

/* A line of type. It is laid out in full from the start and clipped to
   its first --c characters, with a block caret riding the edge -- so
   typing changes one custom property and never the layout. */
function T({ text, className, slot }: { text: string; className?: string; slot?: string }) {
  return (
    <span className={`bl-t ${className ?? ""}`} style={{ "--n": text.length } as React.CSSProperties} data-slot={slot}>
      <span className="bl-t-text">{text}</span>
      <span className="bl-t-caret">
        <i />
      </span>
    </span>
  );
}

export default function ManifestPreloader() {
  const root = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const q = <T extends HTMLElement>(sel: string) => el.querySelector<T>(sel)!;
      const qa = (sel: string, scope: ParentNode = el) => Array.from(scope.querySelectorAll<HTMLElement>(sel));

      const page = document.getElementById("svc-page");
      const pageRise = page ? qa(".svc-rise", page) : [];

      const ground = q(".bl-ground");
      const feed = q(".bl-feed");
      const sheet = q(".bl-sheet");
      const printer = q(".bl-printer");
      const readout = q(".bl-readout");
      const num = q(".bl-num");
      const label = q(".bl-lbl");
      const fill = q(".bl-fill");
      const track = q<HTMLElement>(".bl-route-track");
      const truck = q(".bl-route-truck");
      const rule = q(".bl-route-done");
      const sign = el.querySelector<SVGPathElement>(".bl-sign-path")!;
      const stamp = q(".bl-stamp");
      const lines = {
        head: q(".bl-head"),
        fields: q(".bl-fields"),
        route: q(".bl-route"),
        thead: q(".bl-thead"),
        foot: q(".bl-foot"),
      };
      const rows = qa(".bl-row");

      /* Today's paperwork. */
      const today = new Date();
      q("[data-slot=no] .bl-t-text").textContent = DOC_NO(today);
      q("[data-slot=date] .bl-t-text").textContent = DOC_DATE(today);

      /* The page holds still at the top until it is uncovered. */
      lockScroll(true);
      scrollToY(0, { immediate: true });

      /* Real load: fonts and every resource on the page, or give up after
         gateMax so a stalled image can't hold the manifest forever. */
      const loaded = new Promise<void>((resolve) => {
        if (document.readyState === "complete") resolve();
        else window.addEventListener("load", () => resolve(), { once: true });
      });
      const ready = Promise.race([
        Promise.all([document.fonts?.ready, loaded]),
        new Promise((r) => setTimeout(r, MANIFEST.gateMax * 1000)),
      ]);

      /* ---- The counter, the bar and the truck share one number ------- */
      const prog = { p: 0 };
      let shown = -1;
      const setFill = gsap.quickSetter(fill, "scaleX");
      const setRule = gsap.quickSetter(rule, "scaleX");
      const setTruck = gsap.quickSetter(truck, "x", "px");
      let trackW = 0;
      const render = () => {
        const p = prog.p;
        const whole = Math.round(p);
        if (whole !== shown) {
          shown = whole;
          num.textContent = whole >= 100 ? "100" : pad(whole);
        }
        setFill(p / 100);
        setRule(p / 100);
        setTruck((p / 100) * trackW);
      };
      const say = (text: string) => () => {
        label.textContent = text;
      };

      const finish = () => {
        lockScroll(false);
        if (page) {
          gsap.set([page, ...pageRise], { clearProps: "transform,opacity,visibility" });
          markRevealed(page);
        }
        setDone(true);
        /* The page was measured while it sat lower and smaller. */
        ScrollTrigger.refresh();
      };

      /* Reduced motion: the finished, stamped sheet, shown for a moment
         once the page is ready, then a plain fade. */
      const showFinished = () => {
        gsap.set(sheet, { y: 0 });
        qa(".bl-t").forEach((t) => gsap.set(t, { "--c": t.style.getPropertyValue("--n") }));
        gsap.set(qa(".bl-ok"), { autoAlpha: 1 });
        gsap.set(stamp, { autoAlpha: 1, rotation: MANIFEST.stampTilt });
        gsap.set(qa(".bl-rule"), { scaleX: 1 });
        prog.p = 100;
        render();
        label.textContent = "CLEARED FOR SERVICES";
        el.dataset.state = "cleared";
        ready.then(() =>
          gsap.to(el, { autoAlpha: 0, duration: DUR.settle, ease: EASE.veil, delay: MANIFEST.reducedHold, onComplete: finish })
        );
      };

      const tl = withMotion(() => {
        /* The sheet starts wholly inside the printer. From here on it is
           moved in pixels, so the stylesheet's percentage is dropped. */
        sheet.style.translate = "none";
        gsap.set(sheet, { y: () => sheet.offsetHeight });
        /* The signature is drawn on by its dash: one dash the length of
           the stroke, offset out of sight and brought home. */
        const signLen = sign.getTotalLength();
        gsap.set(sign, { strokeDasharray: signLen, strokeDashoffset: signLen });
        gsap.set(stamp, { autoAlpha: 0, scale: MANIFEST.stampFrom, rotation: MANIFEST.stampTilt + 6 });
        gsap.set(qa(".bl-ok"), { autoAlpha: 0, scale: MANIFEST.tickFrom });
        if (page) {
          gsap.set(page, { y: () => (window.innerHeight * MANIFEST.riseFrom) / 100, scale: MANIFEST.riseScale, transformOrigin: "50% 0%" });
          if (pageRise.length) gsap.set(pageRise, { autoAlpha: 0, y: LIFT_Y });
        }

        /* Where the sheet must sit for a line to be at the print head:
           that line's bottom edge just clear of the slot. Measured as the
           feed begins, when the fonts have had every chance to land. */
        const HEAD = 10;
        const at = (line: HTMLElement) => () => {
          const top = sheet.getBoundingClientRect().top;
          return sheet.offsetHeight - (line.getBoundingClientRect().bottom - top) - HEAD;
        };
        const feedTo = (line: HTMLElement, pos?: gsap.Position) =>
          t.to(sheet, { y: at(line), duration: MANIFEST.feed, ease: MANIFEST.feedEase }, pos);

        /* One pass of the print head over a line: its cells typed left to
           right, the caret travelling with each. */
        const type = (cells: HTMLElement[], step: number) => {
          const pass = gsap.timeline();
          cells.forEach((cell) => {
            const n = Number(cell.style.getPropertyValue("--n"));
            const caret = cell.querySelector(".bl-t-caret");
            pass
              .set(caret, { autoAlpha: 1 })
              .to(cell, { "--c": n, duration: n * step, ease: typeEase(n) })
              .set(caret, { autoAlpha: 0 });
          });
          return pass;
        };
        const cellsOf = (line: HTMLElement) => qa(".bl-t", line);

        const t = gsap.timeline({ defaults: { ease: EASE.settle }, onComplete: finish });

        /* ---- Power on --------------------------------------------- */
        t.from([printer, readout], { autoAlpha: 0, y: LIFT_Y, duration: MANIFEST.groundIn, stagger: STAGGER })
          .call(say("PRINTING MANIFEST"))
          .call(() => {
            trackW = track.offsetWidth;
          });

        /* The head starts on a line while the paper is still settling
           from the feed: a platen's jerk is mostly over in its first half. */
        const settle = `-=${MANIFEST.feed * MANIFEST.feedOverlap}`;

        /* ---- Header, fields, route -------------------------------- */
        feedTo(lines.head, `-=${MANIFEST.groundIn / 2}`);
        t.add(type(cellsOf(lines.head), MANIFEST.headStep), settle);
        feedTo(lines.fields);
        t.add(type(cellsOf(lines.fields), MANIFEST.headStep), settle);
        feedTo(lines.route);
        t.add(type(cellsOf(lines.route), MANIFEST.headStep), settle);
        /* Rules are drawn inside their line's pass, never past its end. */
        t.fromTo(qa(".bl-rule", lines.route), { scaleX: 0 }, { scaleX: 1, duration: MANIFEST.feed, ease: EASE.carry }, "<");
        feedTo(lines.thead);
        t.add(type(cellsOf(lines.thead), MANIFEST.headStep), settle);
        t.fromTo(qa(".bl-rule", lines.thead), { scaleX: 0 }, { scaleX: 1, duration: MANIFEST.feed, ease: EASE.carry }, "<");

        /* ---- One row per cargo ------------------------------------ */
        /* Each line feed starts as the last LOADED pops, not after it. */
        rows.forEach((row, i) => {
          feedTo(row, i ? `-=${MANIFEST.tick}` : undefined);
          t.call(say(`LOADING · ${CARGO[i].name.toUpperCase()}`), undefined, "<");
          t.add(type(cellsOf(row), MANIFEST.typeStep), settle);
          t.to(qa(".bl-ok", row), { autoAlpha: 1, scale: 1, duration: MANIFEST.tick, ease: EASE.snap });
          t.to(prog, { p: ((i + 1) * MANIFEST.rowShare) / rows.length, duration: MANIFEST.count, onUpdate: render }, "<");
        });

        /* ---- The gate: the rest of the count is the real load ------- */
        feedTo(lines.foot);
        t.call(say("CHECKING LOAD"), undefined, "<");
        t.call(() => {
          t.pause();
          ready.then(() => t.resume());
        });
        t.to(prog, { p: 100, duration: MANIFEST.count, onUpdate: render });

        /* ---- Signed, and the whole sheet out ---------------------- */
        t.to(sheet, { y: 0, duration: MANIFEST.feed, ease: MANIFEST.feedEase }, "<");
        t.add(type(cellsOf(lines.foot), MANIFEST.headStep), "<");
        t.to(sign, { strokeDashoffset: 0, duration: MANIFEST.sign, ease: EASE.carry }, "<");

        /* ---- Stamped ---------------------------------------------- */
        t.add("stamp", `-=${MANIFEST.sign / 2}`);
        t.call(say("CLEARED FOR SERVICES"), undefined, "stamp");
        t.call(() => {
          el.dataset.state = "cleared";
        }, undefined, "stamp");
        t.to(stamp, {
          autoAlpha: 1,
          scale: 1,
          rotation: MANIFEST.stampTilt,
          duration: MANIFEST.stamp,
          ease: MANIFEST.thump,
        }, "stamp");
        /* The paper gives under it, and springs back. */
        t.to(sheet, { y: MANIFEST.thud, duration: MANIFEST.stamp / 3, ease: EASE.snap, yoyo: true, repeat: 1 }, `<${MANIFEST.stamp * 0.25}`);
        t.to({}, { duration: MANIFEST.hold });

        /* ---- Torn off, and tossed away ---------------------------- */
        t.add("tear");
        t.set(feed, { clipPath: "none" }, "tear");
        t.to(sheet, {
          rotation: MANIFEST.tearTilt,
          y: -MANIFEST.thud * 3,
          transformOrigin: "100% 100%",
          duration: MANIFEST.tear,
          ease: EASE.snap,
        }, "tear");
        t.to(printer, { y: MANIFEST.thud, duration: MANIFEST.tear / 2, yoyo: true, repeat: 1, ease: EASE.snap }, "tear");

        t.add("toss");
        t.to(sheet, {
          y: () => -window.innerHeight * 1.25,
          xPercent: MANIFEST.tossDrift,
          rotation: MANIFEST.tossTilt,
          rotationX: MANIFEST.tossTip,
          transformPerspective: MANIFEST.tossDepth,
          duration: MANIFEST.toss,
          ease: MANIFEST.tossEase,
        }, "toss");
        t.to([printer, readout], { y: LIFT_Y * 4, autoAlpha: 0, duration: MANIFEST.toss * 0.8, ease: EASE.veil, stagger: STAGGER }, `toss+=${MANIFEST.toss * 0.15}`);

        /* ---- The page comes up beneath ---------------------------- */
        t.add("rise", `toss+=${MANIFEST.toss * 0.35}`);
        t.to(ground, { autoAlpha: 0, duration: MANIFEST.rise * 0.7, ease: EASE.veil }, "rise");
        if (page) t.call(() => markRevealed(page), undefined, "rise");
        if (page) {
          t.to(page, { y: 0, scale: 1, duration: MANIFEST.rise, ease: EASE.settle }, "rise");
          if (pageRise.length) t.to(pageRise, { autoAlpha: 1, y: 0, duration: DUR.settle, ease: EASE.lift, stagger: STAGGER }, `rise+=${MANIFEST.rise * 0.3}`);
        }
        return t;
      }, showFinished);

      /* A click or a key: the rest, played faster. It still waits for
         the page if the page isn't ready. */
      const hurry = () => tl?.timeScale(MANIFEST.skipSpeed);
      el.addEventListener("pointerdown", hurry);
      window.addEventListener("keydown", hurry);
      return () => {
        el.removeEventListener("pointerdown", hurry);
        window.removeEventListener("keydown", hurry);
        lockScroll(false);
      };
    },
    { scope: root }
  );

  if (done) return null;

  return (
    <div id="bl" className="bl" ref={root} role="status" aria-live="polite">
      <span className="sr-only">Loading services</span>
      <div className="bl-ground" aria-hidden="true" />

      <div className="bl-stack" aria-hidden="true">
        <div className="bl-feed">
          <article className="bl-sheet">
            <header className="bl-head">
              <div>
                <p className="bl-kicker">
                  <T text="ZIA GOODS · CONTRACT CARRIAGE" />
                </p>
                <p className="bl-title">
                  <T text="BILL OF LADING" />
                </p>
              </div>
              <div className="bl-ref">
                <svg className="bl-code" viewBox="0 0 118 22" preserveAspectRatio="none">
                  {BARS.map((b) => (
                    <rect key={b.x} x={b.x} width={b.w} height="22" />
                  ))}
                </svg>
                <T text={DOC_NO(PLACEHOLDER)} slot="no" />
              </div>
            </header>

            <dl className="bl-fields">
              {[
                ["SHIPPER", "ON CONTRACT", undefined],
                ["CARRIER", "ZIA GOODS", undefined],
                ["TERMS", "SCHEDULED", undefined],
                ["DATE", DOC_DATE(PLACEHOLDER), "date"],
              ].map(([k, v, slot]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>
                    <T text={v!} slot={slot} />
                  </dd>
                </div>
              ))}
            </dl>

            <div className="bl-route">
              <T text="PORT QASIM" />
              <span className="bl-route-track">
                <i className="bl-rule bl-route-dots" />
                <i className="bl-route-done" />
                <i className="bl-route-truck" />
              </span>
              <T text="NATIONWIDE" />
            </div>

            <div className="bl-thead">
              <T text="#" />
              <T text="CARGO" />
              <T text="EQUIPMENT" className="bl-equip-h" />
              <T text="STATUS" />
              <i className="bl-rule" />
            </div>

            {CARGO.map((c, i) => (
              <div className="bl-row" key={c.kind}>
                <T text={pad(i + 1)} className="bl-no" />
                <T text={c.name.toUpperCase()} className="bl-cargo" />
                <T text={EQUIPMENT[c.kind].toUpperCase()} className="bl-equip" />
                <span className="bl-ok">
                  <svg viewBox="0 0 12 12">
                    <path d="M2 6.4 L4.8 9 L10 3" />
                  </svg>
                  LOADED
                </span>
              </div>
            ))}

            <footer className="bl-foot">
              <div className="bl-sign">
                <svg viewBox="0 0 170 46" className="bl-sign-art">
                  <path
                    className="bl-sign-path"
                    d="M8 30 C 14 12, 26 6, 24 22 C 22 34, 14 38, 18 30 C 24 20, 34 18, 36 28 C 38 36, 44 34, 48 24 C 51 17, 55 19, 54 27 C 53 33, 60 32, 64 24 C 69 14, 75 14, 76 22 C 77 30, 71 34, 70 28 C 69 22, 80 18, 88 22 C 96 26, 98 34, 104 26 C 110 17, 116 14, 118 20 C 120 27, 124 30, 132 24 M 12 40 C 50 35, 104 37, 160 31"
                  />
                </svg>
                <T text="RECEIVED FOR CARRIAGE" className="bl-sign-cap" />
              </div>
              <div className="bl-total">
                <T text="05 LOADS · 01 FLEET" />
              </div>
            </footer>

            <div className="bl-stamp">
              CLEARED
              <small>FOR SERVICES</small>
            </div>
          </article>
        </div>

        <div className="bl-printer">
          <span className="bl-printer-vents" />
          <span className="bl-printer-name">ZG-01 · MANIFEST</span>
          <i className="bl-led" />
        </div>
      </div>

      <div className="bl-readout" aria-hidden="true">
        <div className="bl-read">
          <span className="bl-num">00</span>
          <span className="bl-lbl">WARMING UP</span>
        </div>
        <div className="bl-bar">
          <i className="bl-fill" />
        </div>
      </div>
    </div>
  );
}
