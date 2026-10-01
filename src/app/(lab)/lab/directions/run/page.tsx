import { Big_Shoulders, Hanken_Grotesk, Martian_Mono, Noto_Nastaliq_Urdu } from "next/font/google";

import map from "@/data/pakistan-map.json";

import route from "../../_data/route.json";
import SmoothScroll from "../../_motion/SmoothScroll";
import Tanker from "../../_parts/Tanker";
import "./run.css";
import Stage from "./Stage";

const display = Big_Shoulders({ subsets: ["latin"], weight: ["700", "800", "900"], variable: "--r-display", display: "swap" });
const body = Hanken_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--r-body", display: "swap" });
const mono = Martian_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--r-mono", display: "swap" });
const urdu = Noto_Nastaliq_Urdu({ subsets: ["arabic"], variable: "--r-urdu", display: "swap" });

const CORRIDORS = map.roads.filter((r) => r.type === "corridor");
/* The legs, in order: the gantry sign, the road and the stretch it covers. */
const LEGS = route.stations.slice(1).map((s, i) => ({
  to: s.name,
  from: route.stations[i].name,
  road: route.stations[i].road!,
  at: s.at,
}));

export default function TheRun() {
  return (
    <div className={`run ${display.variable} ${body.variable} ${mono.variable} ${urdu.variable}`}>
      <SmoothScroll lerp={0.09} />
      <Stage stations={route.stations.map((s) => s.at)} />

      <header className="r-head">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/zia-goods-mark.svg" alt="Zia Goods" width={630} height={310} className="r-logo" />
        <nav className="r-nav" aria-label="Primary">
          <a href="#run">Network</a>
          <a href="#close">Services</a>
          <a className="r-pill" href="#close">Request capacity</a>
        </nav>
      </header>

      {/* 1. Hero: the promise, set as large as the road allows. */}
      <section className="r-hero" id="hero">
        <p className="r-kicker r-in">
          <span>Edible-oil and bulk freight</span>
          <span>Port Qasim → every refinery gate</span>
        </p>
        <h1 className="r-h1">
          <span className="r-line"><span>Twenty years.</span></span>
          <span className="r-line r-line--2"><span>Nationwide.</span></span>
        </h1>
        <div className="r-hero-foot">
          <p className="r-sub r-in">
            Food-grade oil tankers from Port Qasim to refineries and ghee mills across Pakistan. Our own fleet and
            drivers, on contract.
          </p>
          <div className="r-ctas r-in">
            <a className="r-btn r-btn--solid" href="#close">Request capacity</a>
            <a className="r-btn" href="#close">Call or WhatsApp</a>
          </div>
        </div>
        <div className="r-ground" aria-hidden="true">
          <div className="r-dashes" />
        </div>
        <Tanker className="r-tanker r-tanker--hero" />
        <p className="r-scrollcue" aria-hidden="true">Scroll to drive the corridor</p>
      </section>

      {/* 2. The run: scroll drives the tanker from Port Qasim to Lahore. */}
      <section className="r-run" id="run" aria-labelledby="r-run-h">
        <div className="r-stage">
          <div className="r-left">
          <h2 id="r-run-h" className="r-run-h">
            Karachi to Lahore, <em>leg by leg.</em>
          </h2>

          <div className="r-hud" aria-hidden="true">
            <div className="r-hud-row">
              <span className="r-hud-k">Leg</span>
              <span className="r-hud-v"><b data-hud="leg">01</b> / 05</span>
            </div>
            <div className="r-hud-road" data-hud="road">M-9</div>
            <div className="r-hud-row">
              <span className="r-hud-v" data-hud="span">Port Qasim → Hyderabad</span>
            </div>
            <div className="r-legs">
              {LEGS.map((l) => (
                <i key={l.road}><b /></i>
              ))}
            </div>
          </div>
          </div>

          <svg className="r-mini" viewBox={route.viewBox} aria-hidden="true">
            <path className="r-mini-land" d={map.outline[0]} />
            {CORRIDORS.map((r) => (
              <path key={r.id} className="r-mini-cor" d={r.path} />
            ))}
            <path className="r-mini-route" d={route.path} id="r-route" />
            {route.stations.map((s) => (
              <circle key={s.name} className="r-mini-st" cx={s.x} cy={s.y} r="5" />
            ))}
            <circle
              className="r-mini-dot"
              r="9"
              cx="0"
              cy="0"
              transform={`translate(${route.stations[0].x} ${route.stations[0].y})`}
            />
          </svg>

          <div className="r-cities" aria-hidden="true">
            {route.stations.map((s) => (
              <span key={s.name} className="r-city">{s.name}</span>
            ))}
          </div>

          <div className="r-world" aria-hidden="true">
            <div className="r-horizon" />
            <div className="r-poles" />
            <div className="r-road">
              <div className="r-lane r-lane--edge" />
              <div className="r-lane r-lane--mid" />
            </div>
            {LEGS.map((l, i) => (
              <div key={l.road} className="r-sign" style={{ ["--i" as string]: i }}>
                <span className="r-sign-road">{l.road}</span>
                <span className="r-sign-to">{l.to}</span>
                <span className="r-sign-from">from {l.from}</span>
              </div>
            ))}
          </div>

          <Tanker className="r-tanker r-tanker--run" />

          {/* The same journey as a plain list: what reduced motion and
              screen readers get instead of the drive. */}
          <ol className="r-legs-list">
            {LEGS.map((l, i) => (
              <li key={l.road}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <b>{l.road}</b> {l.from} → {l.to}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 3. Arrival: the record, and both ways to reach a person. */}
      <section className="r-close" id="close">
        <p className="r-close-k">Arrived · Lahore</p>
        <h2 className="r-close-h">
          <span className="r-line"><span>Every leg,</span></span>
          <span className="r-line"><span>every load,</span></span>
          <span className="r-line"><span>on contract.</span></span>
        </h2>
        <dl className="r-figs">
          {[
            ["22", "food-grade oil tankers, our own"],
            ["20", "years hauling edible oil"],
            ["14", "motorways & highways run"],
            ["08", "freight corridors"],
          ].map(([n, l]) => (
            <div key={l} className="r-fig">
              <dd>{n}</dd>
              <dt>{l}</dt>
            </div>
          ))}
        </dl>
        <div className="r-close-foot">
          <div className="r-ctas">
            <a className="r-btn r-btn--cream" href="#close">Request capacity</a>
            <a className="r-btn r-btn--ghost" href="#close">Call or WhatsApp</a>
          </div>
          <p className="r-motto">
            <span>Dekh magar pyar se.</span>
            <span lang="ur" dir="rtl" className="r-urdu">دیکھ مگر پیار سے</span>
          </p>
        </div>
      </section>
    </div>
  );
}
