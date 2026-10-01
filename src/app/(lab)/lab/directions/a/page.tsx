import { IBM_Plex_Mono, Newsreader, Noto_Nastaliq_Urdu, Public_Sans } from "next/font/google";

import { CARGO } from "@/lib/cargo";

import "./a.css";
import Motion from "./Motion";

const serif = Newsreader({ subsets: ["latin"], style: ["normal", "italic"], variable: "--a-serif", display: "swap" });
const sans = Public_Sans({ subsets: ["latin"], variable: "--a-sans", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400"], variable: "--a-mono", display: "swap" });
const nastaliq = Noto_Nastaliq_Urdu({ subsets: ["arabic"], variable: "--a-urdu", display: "swap" });

const STATS = [
  { n: "22", l: "food-grade oil tankers" },
  { n: "20", l: "years hauling edible oil" },
  { n: "14", l: "motorways & highways" },
  { n: "8", l: "freight corridors" },
];

export default function DirectionA() {
  return (
    <div className={`a ${serif.variable} ${sans.variable} ${mono.variable} ${nastaliq.variable}`}>
      <Motion />
      <header className="a-head">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/zia-goods-mark-ink.svg" alt="Zia Goods" width={630} height={310} className="a-logo" />
        <nav aria-label="Primary" className="a-nav">
          <a href="#cargo">Services</a>
          <a href="#hero">Network</a>
          <a href="#cargo">Contract carriage</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <main>
        <section className="a-hero" id="hero">
          <div className="a-slip" aria-label="Waybill header">
            <div><span>Consignor</span><i /></div>
            <div><span>From</span><b>Port Qasim, Karachi</b></div>
            <div><span>Road</span><b className="a-mono">M-9 · N-5 · M-5 · M-4 · M-3</b></div>
            <div><span>Seal no.</span><i /></div>
          </div>

          <div className="a-hero-grid">
            <div>
              <h1 className="a-h1">
                Twenty years on the road, <em>nationwide.</em>
              </h1>
              <p className="a-sub">
                Food-grade oil tankers from Port Qasim to refineries and ghee mills across Pakistan. Our own fleet and
                drivers, on contract.
              </p>
              <div className="a-cta" id="contact">
                <a className="a-btn a-btn--solid" href="#contact">Request capacity</a>
                <a className="a-btn" href="#contact">Call or WhatsApp</a>
              </div>
            </div>

            <svg className="a-seal" viewBox="0 0 200 200" role="img" aria-label="Zia Goods, 20 years, nationwide">
              <defs>
                <path id="a-ring" d="M100,100 m-72,0 a72,72 0 1,1 144,0 a72,72 0 1,1 -144,0" />
              </defs>
              <circle cx="100" cy="100" r="94" fill="none" stroke="currentColor" strokeWidth="3" />
              <circle cx="100" cy="100" r="58" fill="none" stroke="currentColor" strokeWidth="1.2" />
              <text className="a-seal-ring">
                <textPath href="#a-ring" startOffset="0">ZIA GOODS · 20 YEARS · NATIONWIDE ·</textPath>
              </text>
              <text x="100" y="116" textAnchor="middle" className="a-seal-num">20</text>
              <circle cx="100" cy="148" r="3.2" className="a-seal-dot" />
            </svg>
          </div>

          <dl className="a-stats">
            {STATS.map((s) => (
              <div key={s.l}>
                <dt>{s.l}</dt>
                <dd>{s.n}</dd>
              </div>
            ))}
          </dl>

          <p className="a-motto">
            <span className="a-motto-en">Dekh magar pyar se.</span>
            <span className="a-motto-ur" lang="ur" dir="rtl">دیکھ مگر پیار سے</span>
          </p>
        </section>

        <section className="a-ledger" id="cargo" aria-labelledby="a-ledger-h">
          <div className="a-ledger-head">
            <h2 id="a-ledger-h">What we carry, on contract</h2>
            <p>Five cargoes, each with its own equipment and its own way of being checked.</p>
          </div>
          <ol className="a-rows">
            {CARGO.map((c, i) => (
              <li key={c.kind} className="a-row">
                <span className="a-mono a-row-no">{String(i + 1).padStart(2, "0")}</span>
                <div className="a-row-main">
                  <h3>{c.name}</h3>
                  <p className="a-row-line">{c.line}</p>
                  <p>{c.body}</p>
                </div>
                <ul className="a-specs">
                  {c.specs.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  );
}
