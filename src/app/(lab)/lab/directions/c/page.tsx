import { Barlow, Barlow_Condensed, Noto_Nastaliq_Urdu, Spectral } from "next/font/google";

import { CARGO } from "@/lib/cargo";
import map from "@/data/pakistan-map.json";

import "./c.css";
import Motion from "./Motion";

const book = Spectral({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--c-book", display: "swap" });
const body = Barlow({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--c-body", display: "swap" });
const cond = Barlow_Condensed({ subsets: ["latin"], weight: ["500", "600"], variable: "--c-cond", display: "swap" });
const nastaliq = Noto_Nastaliq_Urdu({ subsets: ["arabic"], variable: "--c-urdu", display: "swap" });

/* Karachi to Lahore, in drawing order: the legs the client confirmed. */
const LEGS = ["M-9", "N-5", "M-5", "M-4", "M-3"];
const STATIONS = ["Port Qasim", "Hyderabad", "Sukkur", "Multan", "Faisalabad", "Lahore"];
const road = (id: string) => map.roads.find((r) => r.id === id);
/* The N-5 is the whole Grand Trunk Road, Karachi to Peshawar. Only its
   Hyderabad-to-Sukkur stretch belongs to this leg: the first subpath, cut at
   Sukkur by a clip. The rest of it is drawn thin, with the other corridors. */
const N5_LEG = road("N-5")!.path.split(/(?=M)/)[0];
const OTHER_CORRIDORS = map.roads.filter((r) => r.type === "corridor" && !["M-9", "M-5", "M-4", "M-3"].includes(r.id));
const CONTEXT = map.roads.filter((r) => r.type === "context");
const node = (label: string) => map.nodes.find((n) => n.label === label)!;

export default function DirectionC() {
  return (
    <div className={`c ${book.variable} ${body.variable} ${cond.variable} ${nastaliq.variable}`}>
      <Motion />
      <div className="c-split">
        <section className="c-panel" id="hero">
          <header className="c-head">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/zia-goods-mark.svg" alt="Zia Goods" width={630} height={310} className="c-logo" />
            <nav aria-label="Primary" className="c-nav">
              <a href="#stations">Services</a>
              <a href="#contact">Contact</a>
            </nav>
          </header>

          <div className="c-copy">
            <h1 className="c-h1">
              Twenty years on the road, <em>nationwide.</em>
            </h1>
            <p className="c-sub">
              Food-grade oil tankers from Port Qasim to refineries and ghee mills across Pakistan. Our own fleet and
              drivers, on contract.
            </p>
            <div className="c-cta" id="contact">
              <a className="c-btn c-btn--solid" href="#contact">Request capacity</a>
              <a className="c-btn" href="#contact">Call or WhatsApp</a>
            </div>

            <dl className="c-legend">
              <div><dd>22</dd><dt>food-grade oil tankers</dt></div>
              <div><dd>20</dd><dt>years hauling edible oil</dt></div>
              <div><dd>14</dd><dt>motorways &amp; highways</dt></div>
              <div><dd>8</dd><dt>freight corridors</dt></div>
            </dl>

            <p className="c-motto">
              <span className="c-motto-en">Dekh magar pyar se.</span>
              <span className="c-motto-ur" lang="ur" dir="rtl">دیکھ مگر پیار سے</span>
            </p>
          </div>
        </section>

        <figure className="c-atlas" aria-label="Map of Pakistan with the Karachi to Lahore corridor">
          <svg viewBox={map.viewBox} className="c-map" role="img" aria-label="Zia Goods corridors across Pakistan">
            <g className="c-ticks" aria-hidden="true">
              {Array.from({ length: 17 }, (_, i) => (
                <path key={i} d={`M${i * 56 + 4} 0v10M${i * 56 + 4} 940v10`} />
              ))}
            </g>
            <defs>
              <clipPath id="c-n5-clip">
                <rect x="330" y="618" width="100" height="140" />
              </clipPath>
            </defs>
            <path className="c-land" d={map.outline[0]} />
            <g className="c-ctx">
              {CONTEXT.map((r) => (
                <path key={r.id} d={r.path} />
              ))}
            </g>
            <g className="c-cor2">
              {OTHER_CORRIDORS.map((r) => (
                <path key={r.id} d={r.path} />
              ))}
            </g>
            <g className="c-route">
              {LEGS.map((id, i) =>
                id === "N-5" ? (
                  <path key={id} d={N5_LEG} clipPath="url(#c-n5-clip)" pathLength={1} style={{ ["--i" as string]: i }} />
                ) : (
                  <path key={id} d={road(id)!.path} pathLength={1} style={{ ["--i" as string]: i }} />
                ),
              )}
            </g>
            <g className="c-stations">
              {STATIONS.map((s, i) => {
                const n = node(s);
                const left = s === "Faisalabad" || ("side" in n && n.side === "left");
                return (
                  <g key={s} className="c-station" style={{ ["--i" as string]: i }}>
                    <circle cx={n.x} cy={n.y} r={n.major ? 6 : 4.5} />
                    <text x={n.x + (left ? -12 : 12)} y={n.y + 5} textAnchor={left ? "end" : "start"}>
                      {s}
                    </text>
                  </g>
                );
              })}
            </g>
            <g className="c-scale" transform="translate(40 892)">
              <path d="M0 0h120M0 -6v12M60 -4v8M120 -6v12" />
              <text x="0" y="22">0</text>
              <text x="120" y="22" textAnchor="end">200 km</text>
            </g>
          </svg>
          <figcaption className="c-credit">
            Boundary: GADM, Natural Earth · Roads: © OpenStreetMap contributors
          </figcaption>
        </figure>
      </div>

      <section className="c-stations-sec" id="stations" aria-labelledby="c-st-h">
        <h2 id="c-st-h" className="c-h2">What we carry, on contract</h2>
        <ol className="c-list">
          {CARGO.map((c, i) => (
            <li key={c.kind} className="c-item">
              <span className="c-item-no">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3>{c.name}</h3>
                <p className="c-item-line">{c.line}</p>
                <p>{c.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
