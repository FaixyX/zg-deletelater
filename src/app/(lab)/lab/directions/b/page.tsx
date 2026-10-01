import { Noto_Nastaliq_Urdu, Overpass, Source_Sans_3 } from "next/font/google";

import "./b.css";
import Motion from "./Motion";

const sign = Overpass({ subsets: ["latin"], variable: "--b-sign", display: "swap" });
const body = Source_Sans_3({ subsets: ["latin"], variable: "--b-body", display: "swap" });
const nastaliq = Noto_Nastaliq_Urdu({ subsets: ["arabic"], variable: "--b-urdu", display: "swap" });

/* Karachi to Lahore, leg by leg: the roads the client confirmed. */
const EXITS = [
  { road: "M-9", from: "Port Qasim", to: "Hyderabad" },
  { road: "N-5", from: "Hyderabad", to: "Sukkur" },
  { road: "M-5", from: "Sukkur", to: "Multan" },
  { road: "M-4", from: "Multan", to: "Faisalabad" },
  { road: "M-3", from: "Faisalabad", to: "Lahore" },
];

export default function DirectionB() {
  return (
    <div className={`b ${sign.variable} ${body.variable} ${nastaliq.variable}`}>
      <Motion />
      <div className="b-lane" aria-hidden="true" />
      <header className="b-head">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/zia-goods-mark.svg" alt="Zia Goods" width={630} height={310} className="b-logo" />
        <nav aria-label="Primary" className="b-nav">
          <a href="#route">Network</a>
          <a href="#route">Services</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <main>
        <section className="b-hero" id="hero">
          <div className="b-beam" aria-hidden="true" />
          <div className="b-hang">
            <aside className="b-panel b-panel--small b-panel--l" aria-label="Route sign">
              <span className="b-chip">M-9</span>
              <b>Hyderabad</b>
              <span>Karachi corridor</span>
            </aside>

            <div className="b-panel b-panel--hero">
              <h1 className="b-h1">
                Twenty years.
                <br />
                Nationwide.
              </h1>
              <p className="b-sub">
                Food-grade oil tankers from Port Qasim to refineries and ghee mills across Pakistan. Our own fleet and
                drivers, on contract.
              </p>
              <div className="b-cta" id="contact">
                <a className="b-btn b-btn--solid" href="#contact">Request capacity</a>
                <a className="b-btn" href="#contact">Call or WhatsApp</a>
              </div>
            </div>

            <aside className="b-panel b-panel--small b-panel--r" aria-label="Route sign">
              <span className="b-chip">M-3</span>
              <b>Lahore</b>
              <span>Punjab corridor</span>
            </aside>
          </div>

          <dl className="b-stats">
            <div><dd>22</dd><dt>food-grade oil tankers</dt></div>
            <div><dd>20</dd><dt>years hauling edible oil</dt></div>
            <div><dd>14</dd><dt>motorways &amp; highways</dt></div>
            <div><dd>8</dd><dt>freight corridors</dt></div>
          </dl>
        </section>

        <section className="b-route" id="route" aria-labelledby="b-route-h">
          <h2 id="b-route-h" className="b-h2">
            Karachi to Lahore, exit by exit
          </h2>
          <ol className="b-exits">
            {EXITS.map((e, i) => (
              <li key={e.road} className="b-panel b-exit">
                <span className="b-exit-no">Exit {i + 1}</span>
                <span className="b-exit-road">{e.road}</span>
                <span className="b-exit-leg">
                  <small>from</small> {e.from}
                  <br />
                  <small>to</small> <b>{e.to}</b>
                </span>
              </li>
            ))}
          </ol>
          <p className="b-motto">
            <span className="b-motto-en">Dekh magar pyar se.</span>
            <span className="b-motto-ur" lang="ur" dir="rtl">دیکھ مگر پیار سے</span>
          </p>
        </section>
      </main>
    </div>
  );
}
