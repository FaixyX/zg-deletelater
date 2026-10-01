import { IBM_Plex_Mono, Newsreader, Noto_Nastaliq_Urdu, Public_Sans } from "next/font/google";

import { CARGO } from "@/lib/cargo";

import SmoothScroll from "../../_motion/SmoothScroll";
import Seal from "../../_parts/Seal";
import "./ledger.css";
import Stage from "./Stage";

const serif = Newsreader({ subsets: ["latin"], style: ["normal", "italic"], variable: "--l-serif", display: "swap" });
const sans = Public_Sans({ subsets: ["latin"], variable: "--l-sans", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--l-mono", display: "swap" });
const urdu = Noto_Nastaliq_Urdu({ subsets: ["arabic"], variable: "--l-urdu", display: "swap" });

export default function Ledger() {
  return (
    <div className={`ledger ${serif.variable} ${sans.variable} ${mono.variable} ${urdu.variable}`}>
      <SmoothScroll lerp={0.085} />
      <Stage />

      <header className="l-head">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/zia-goods-mark-ink.svg" alt="Zia Goods" width={630} height={310} className="l-logo" />
        <nav className="l-nav" aria-label="Primary">
          <a href="#clauses">Services</a>
          <a href="#clauses">Contract carriage</a>
          <a href="#close">Contact</a>
        </nav>
      </header>

      {/* 1. The waybill and the promise */}
      <section className="l-hero" id="hero">
        <div className="l-coords l-in" aria-hidden="true">
          <span>24°46′N 67°20′E</span>
          <span>Port Qasim, Karachi</span>
          <span>No. 001 — Est. two decades</span>
        </div>
        <div className="l-slip">
          <div className="l-cell"><span>Consignor</span><i /></div>
          <div className="l-cell"><span>From</span><b>Port Qasim, Karachi</b></div>
          <div className="l-cell"><span>Road</span><b className="l-mono">M-9 · N-5 · M-5 · M-4 · M-3</b></div>
          <div className="l-cell"><span>Seal no.</span><i /></div>
        </div>

        <div className="l-hero-grid">
          <h1 className="l-h1">
            Twenty years on the road, <em>nationwide.</em>
          </h1>
          <div className="l-seal-wrap">
            <Seal id="l-ring-hero" className="l-seal l-seal--hero" />
          </div>
        </div>

        <div className="l-hero-foot">
          <p className="l-sub l-in">
            Food-grade oil tankers from Port Qasim to refineries and ghee mills across Pakistan. Our own fleet and
            drivers, on contract.
          </p>
          <div className="l-ctas l-in">
            <a className="l-btn l-btn--solid" href="#close">Request capacity</a>
            <a className="l-btn" href="#close">Call or WhatsApp</a>
          </div>
        </div>
      </section>

      {/* 2. The contract: five clauses, read sideways */}
      <section className="l-clauses" id="clauses" aria-labelledby="l-cl-h">
        <div className="l-pin">
          <div className="l-track">
            <div className="l-panel l-panel--intro">
              <p className="l-k">Schedule A · What we carry</p>
              <h2 id="l-cl-h" className="l-h2">
                Five cargoes. <em>Each with its own clause.</em>
              </h2>
              <p className="l-note">Equipment, handling and checks, written for the load.</p>
            </div>
            {CARGO.map((c, i) => (
              <article key={c.kind} className="l-panel l-clause">
                <span className="l-ghost" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                <p className="l-k">Clause {i + 1}</p>
                <h3>{c.name}</h3>
                <p className="l-line">{c.line}</p>
                <p className="l-body">{c.body}</p>
                <ul className="l-specs">
                  {c.specs.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </article>
            ))}
            <div className="l-panel l-panel--sealed">
              <p className="l-k">Signed and sealed</p>
              <p className="l-sealed">
                Twenty years, <em>every clause kept.</em>
              </p>
              <div className="l-stamp">
                <span className="l-stamp-ring" aria-hidden="true" />
                <Seal id="l-ring-stamp" className="l-seal l-seal--stamp" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. The record and both ways in */}
      <section className="l-close" id="close">
        <dl className="l-figs">
          {[
            ["22", "Food-grade oil tankers"],
            ["20", "Years hauling edible oil"],
            ["14", "Motorways & highways"],
            ["8", "Freight corridors"],
          ].map(([n, l]) => (
            <div key={l} className="l-fig">
              <dt>{l}</dt>
              <dd>{n}</dd>
            </div>
          ))}
        </dl>
        <div className="l-close-foot">
          <p className="l-close-h">
            Put your lane <em>on contract.</em>
          </p>
          <div className="l-ctas">
            <a className="l-btn l-btn--paper" href="#close">Request capacity</a>
            <a className="l-btn l-btn--ghost" href="#close">Call or WhatsApp</a>
          </div>
          <p className="l-motto">
            <span>Dekh magar pyar se.</span>
            <span lang="ur" dir="rtl" className="l-urdu">دیکھ مگر پیار سے</span>
          </p>
        </div>
      </section>
    </div>
  );
}
