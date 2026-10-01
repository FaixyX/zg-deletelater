import { Libre_Caslon_Display, Noto_Nastaliq_Urdu, Schibsted_Grotesk } from "next/font/google";

import map from "@/data/pakistan-map.json";

import route from "../../_data/route.json";
import SmoothScroll from "../../_motion/SmoothScroll";
import "./atlas.css";
import Stage from "./Stage";

const caslon = Libre_Caslon_Display({ subsets: ["latin"], weight: "400", variable: "--n-caslon", display: "swap" });
const grotesk = Schibsted_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--n-sans", display: "swap" });
const urdu = Noto_Nastaliq_Urdu({ subsets: ["arabic"], variable: "--n-urdu", display: "swap" });

const CONTEXT = map.roads.filter((r) => r.type === "context");
const CORRIDORS = map.roads.filter((r) => r.type === "corridor");
const lonlat = (label: string) => map.nodes.find((n) => n.label === label)!;
const dms = (v: number, pos: string, neg: string) => {
  const a = Math.abs(v);
  const d = Math.floor(a);
  const m = Math.round((a - d) * 60);
  return `${d}°${String(m).padStart(2, "0")}′${v >= 0 ? pos : neg}`;
};

/* One line per stop, from the road names in the brief. */
const LINES: Record<string, string> = {
  "Port Qasim": "Where every load starts: the storage terminals at Port Qasim, Karachi.",
  Hyderabad: "M-9 · the Karachi–Hyderabad motorway, the first leg inland.",
  Sukkur: "N-5 · the Grand Trunk Road, north through Sindh.",
  Multan: "M-5 · the Multan–Sukkur motorway into Punjab.",
  Faisalabad: "M-4 · the Pindi Bhattian–Multan motorway.",
  Lahore: "M-3 · and into Lahore, to the refinery gate.",
};

export default function Atlas() {
  return (
    <div className={`atlas ${caslon.variable} ${grotesk.variable} ${urdu.variable}`}>
      <SmoothScroll lerp={0.08} />
      <Stage stations={route.stations.map((s) => ({ at: s.at, x: s.x, y: s.y }))} />

      <header className="n-head">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/zia-goods-mark.svg" alt="Zia Goods" width={630} height={310} className="n-logo" />
        <nav className="n-nav" aria-label="Primary">
          <a href="#scene">Network</a>
          <a href="#close">Services</a>
          <a className="n-pill" href="#close">Request capacity</a>
        </nav>
      </header>

      <section className="n-scene" id="scene" aria-labelledby="n-h1">
        <div className="n-stage">
          <div className="n-frame" aria-hidden="true">
            <span className="n-readout" data-readout>
              24°47′N · 67°20′E
            </span>
            <span className="n-scale">
              <i />0 — 200 km
            </span>
          </div>

          <svg className="n-map" viewBox={map.viewBox} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
            <g className="n-cam">
              <path className="n-land" d={map.outline[0]} />
              <g className="n-ctx">
                {CONTEXT.map((r) => (
                  <path key={r.id} d={r.path} />
                ))}
              </g>
              <g className="n-cor">
                {CORRIDORS.map((r) => (
                  <path key={r.id} d={r.path} />
                ))}
              </g>
              <path className="n-route" d={route.path} />
              <g className="n-stations">
                {route.stations.map((s) => (
                  <g key={s.name} className="n-st" data-x={s.x} data-y={s.y}>
                    <circle cx={s.x} cy={s.y} r="4.5" />
                    <text x={s.name === "Faisalabad" ? s.x - 10 : s.x + 10} y={s.y + 4} textAnchor={s.name === "Faisalabad" ? "end" : "start"}>
                      {s.name}
                    </text>
                  </g>
                ))}
              </g>
            </g>
          </svg>

          <div className="n-copy">
            <p className="n-k">Bulk edible-oil freight · Pakistan</p>
            <h1 id="n-h1" className="n-h1">
              Twenty years, nationwide.
            </h1>
            <p className="n-sub">
              Food-grade oil tankers from Port Qasim to refineries and ghee mills across Pakistan. Our own fleet and
              drivers, on contract.
            </p>
            <div className="n-ctas">
              <a className="n-btn n-btn--solid" href="#close">Request capacity</a>
              <a className="n-btn" href="#close">Call or WhatsApp</a>
            </div>
          </div>

          <ol className="n-cards">
            {route.stations.map((s, i) => {
              const n = lonlat(s.name);
              return (
                <li key={s.name} className="n-card">
                  <span className="n-card-k">
                    Stop {String(i + 1).padStart(2, "0")} / 06 · {dms(n.lat, "N", "S")} {dms(n.lon, "E", "W")}
                  </span>
                  <h2 className="n-card-h">{s.name}</h2>
                  <p>{LINES[s.name]}</p>
                </li>
              );
            })}
          </ol>

          <div className="n-final">
            <p className="n-final-h">Nationwide.</p>
            <dl className="n-figs">
              {[
                ["22", "food-grade oil tankers"],
                ["20", "years hauling edible oil"],
                ["14", "motorways & highways"],
                ["8", "freight corridors"],
              ].map(([v, l]) => (
                <div key={l}>
                  <dd>{v}</dd>
                  <dt>{l}</dt>
                </div>
              ))}
            </dl>
          </div>

          <p className="n-credit">Boundary: GADM, Natural Earth · Roads: © OpenStreetMap contributors</p>
        </div>
      </section>

      <section className="n-close" id="close">
        <p className="n-close-h">
          Name the lane. We&rsquo;ll draw the line.
        </p>
        <div className="n-close-row">
          <div className="n-ctas">
            <a className="n-btn n-btn--ink" href="#close">Request capacity</a>
            <a className="n-btn n-btn--inkline" href="#close">Call or WhatsApp</a>
          </div>
          <p className="n-motto">
            <span>Dekh magar pyar se.</span>
            <span lang="ur" dir="rtl" className="n-urdu">دیکھ مگر پیار سے</span>
          </p>
        </div>
      </section>
    </div>
  );
}
