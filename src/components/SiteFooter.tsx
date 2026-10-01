import Link from "next/link";

import { CARGO } from "@/lib/cargo";
import { WORDMARK } from "@/lib/wordmark";

import CtaOil from "./CtaOil";
import FooterClock from "./FooterClock";
import FooterMotion from "./FooterMotion";
import { Safe } from "./Safe";

/**
 * The end of the line. The page lifts off the footer, which waits
 * underneath; as it is uncovered a tanker drives the corridor from
 * Gwadar to Peshawar, and the name at the bottom -- a tank the size of the
 * page -- fills with oil. Scroll pushes the oil about, a pointer stirs
 * it, a click splashes it. Karachi's time is on a split-flap board, and
 * the return trip goes back to the top.
 *
 * Markup only, rendered on the server; FooterMotion drives it and
 * FooterClock keeps the time. Without script it is a plain footer with
 * the letters a third full.
 */

const PAGES = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Contract carriage", href: "/services#contract-carriage" },
  { label: "FAQ", href: "/#faq" },
  { label: "Request capacity", href: "/contact" },
];

/* The corridor, coast to north, as the map draws it: each stop and the
   road on to the next. Gwadar comes in along the Makran coast by the N-10;
   Multan to Lahore runs the M-4 to Abdul Hakeem, then the M-3. */
const STOPS: { city: string; road?: string }[] = [
  { city: "Gwadar", road: "N-10" },
  { city: "Port Qasim", road: "M-9" },
  { city: "Hyderabad", road: "N-5" },
  { city: "Sukkur", road: "M-5" },
  { city: "Multan", road: "M-3" },
  { city: "Lahore", road: "M-2" },
  { city: "Islamabad", road: "N-5" },
  { city: "Peshawar" },
];

/* The oil's surface as the server draws it: flat, a third of the way up
   the letters. FooterMotion takes over from here. */
const REST_Y = WORDMARK.y + WORDMARK.h * (1 - 0.34);
const REST_SHAPE = `M${WORDMARK.x} ${REST_Y}H${WORDMARK.x + WORDMARK.w}V${WORDMARK.y + WORDMARK.h}H${WORDMARK.x}Z`;
const REST_LINE = `M${WORDMARK.x} ${REST_Y}H${WORDMARK.x + WORDMARK.w}`;

export default function SiteFooter() {
  return (
    <footer className="zf" id="site-footer" data-ground="dark">
      <div className="zf-shade" aria-hidden="true" />
      <div className="zf-inner">
        <div className="zf-veil" aria-hidden="true" />

        <div className="zf-top">
          <section className="zf-pitch" aria-labelledby="zf-title">
            <p className="zf-eyebrow" data-eyebrow="ZG">
              <i />
              End of the line
            </p>
            <h2 className="zf-title" id="zf-title">
              Got a load?
              <br />
              <em>Let&apos;s move it.</em>
            </h2>
            <p className="zf-lede">
              Edible oil, molasses, chemicals, finished goods and dry cargo, carried on contract
              from Port Qasim to every major refining and industrial city in Pakistan.
            </p>
            <div className="zf-actions">
              <Link className="glass glass--cta glass--primary zf-cta text-navy no-underline" href="/contact">
                <Safe name="CTA oil">
                  <CtaOil />
                </Safe>
                Get a quote
              </Link>
              <Link className="glass glass--cta zf-cta text-cream no-underline" href="/#faq">
                Read the FAQ
              </Link>
            </div>
          </section>

          <div className="zf-side">
            <Safe name="footer clock">
              <FooterClock />
            </Safe>

            <nav className="zf-cols" aria-label="Footer">
              <div>
                <p className="zf-col-head">Pages</p>
                <ul>
                  {PAGES.map((p) => (
                    <li key={p.href}>
                      <Link className="zf-link" href={p.href}>
                        {p.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="zf-col-head">Cargoes</p>
                <ul>
                  {CARGO.map((c) => (
                    <li key={c.kind}>
                      <Link className="zf-link" href={`/services#svc-${c.kind}`}>
                        {c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>
          </div>
        </div>

        {/* ---- The corridor, and the tanker that drives it ------------- */}
        <div className="zf-road">
          <ol
            className="zf-stops"
            aria-label="The corridor, Gwadar to Peshawar"
            style={{ "--legs": STOPS.length - 1 } as React.CSSProperties}
          >
            {STOPS.map((s, i) => (
              <li
                className="zf-stop"
                key={s.city}
                style={{ "--at": i / (STOPS.length - 1) } as React.CSSProperties}
              >
                <i className="zf-stop-dot" aria-hidden="true" />
                <span className="zf-stop-city">{s.city}</span>
                {s.road && (
                  <span className="zf-stop-road" aria-label={`then the ${s.road}`}>
                    {s.road}
                  </span>
                )}
              </li>
            ))}
          </ol>
          <span className="zf-lane" aria-hidden="true" />
          <span className="zf-stamp" aria-hidden="true">
            Delivered
          </span>

          <button type="button" className="zf-truck" aria-label="ZG tanker: sound the horn" data-cursor="Honk">
            <span className="zf-honk" aria-hidden="true">
              Paam paam!
            </span>
            <span className="zf-truck-face" aria-hidden="true">
              <svg className="zf-truck-svg" viewBox="0 0 136 64">
                <defs>
                  <linearGradient id="zf-tank" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#ffd08a" />
                    <stop offset="0.35" stopColor="#e8a33d" />
                    <stop offset="1" stopColor="#b8741f" />
                  </linearGradient>
                </defs>
                <g className="zf-truck-body">
                  {/* The crown over the cab, as the trucks on the GT Road
                      wear it: scalloped, studded, and never plain. */}
                  <path
                    className="zf-crown"
                    d="M98 17 L98 11 Q101 5 104 11 Q107 3 110 11 Q113 1 116 11 Q119 3 122 11 Q125 5 128 11 L128 17 Z"
                  />
                  <circle className="zf-stud" cx="104" cy="13" r="1" />
                  <circle className="zf-stud" cx="110" cy="12.5" r="1" />
                  <circle className="zf-stud" cx="116" cy="12" r="1.2" />
                  <circle className="zf-stud" cx="122" cy="12.5" r="1" />
                  {/* The tank. */}
                  <rect className="zf-tank" x="6" y="18" width="88" height="28" rx="14" />
                  <path className="zf-tank-shine" d="M18 23 H82" />
                  <path className="zf-tank-rib" d="M34 19 V45 M66 19 V45" />
                  <text className="zf-tank-mark" x="50" y="37" textAnchor="middle">
                    ZG
                  </text>
                  {/* The cab. */}
                  <path className="zf-cab" d="M97 17 H121 Q126 17 128 22 L132 33 V48 H97 Z" />
                  <path className="zf-window" d="M112 21 H120 Q123 21 124.5 24 L127.5 32 H112 Z" />
                  <path className="zf-cab-stripe" d="M97 38 H132" />
                  {/* The chassis, and the chains that swing from the
                      bumper. */}
                  <rect className="zf-chassis" x="3" y="46" width="131" height="4" rx="1.5" />
                  <g className="zf-chains">
                    <path d="M106 50 v5 M110 50 v6 M114 50 v5 M118 50 v6 M122 50 v5 M126 50 v6 M130 50 v5" />
                    <circle cx="106" cy="55.5" r="0.9" />
                    <circle cx="110" cy="56.5" r="0.9" />
                    <circle cx="114" cy="55.5" r="0.9" />
                    <circle cx="118" cy="56.5" r="0.9" />
                    <circle cx="122" cy="55.5" r="0.9" />
                    <circle cx="126" cy="56.5" r="0.9" />
                    <circle cx="130" cy="55.5" r="0.9" />
                  </g>
                </g>
                {[22, 40, 114].map((cx) => (
                  <g key={cx}>
                    <circle className="zf-tyre" cx={cx} cy="52" r="7" />
                    <g className="zf-wheel" style={{ transformOrigin: `${cx}px 52px` }}>
                      <circle className="zf-hub" cx={cx} cy="52" r="3.2" />
                      <path className="zf-spoke" d={`M${cx - 3} 52 H${cx + 3} M${cx} 49 V55`} />
                    </g>
                  </g>
                ))}
              </svg>
            </span>
          </button>
        </div>

        {/* ---- The name, as a tank ------------------------------------- */}
        <div className="zf-mark">
          <svg className="zf-mark-svg" viewBox={WORDMARK.viewBox} role="img" aria-label="Zia Goods" data-cursor="Stir">
            <defs>
              <clipPath id="zf-letters">
                <path d={WORDMARK.d} />
              </clipPath>
              <linearGradient id="zf-oil" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#f6c170" />
                <stop offset="0.4" stopColor="#e8a33d" />
                <stop offset="1" stopColor="#b56f1c" />
              </linearGradient>
              {/* Halftone, as everywhere else on the site: a hex grid of
                  dots, dim in the empty tank and dark in the oil. */}
              <pattern id="zf-dots-dim" width="1.6" height="2.77" patternUnits="userSpaceOnUse">
                <circle cx="0.4" cy="0.4" r="0.3" />
                <circle cx="1.2" cy="1.785" r="0.3" />
              </pattern>
              <pattern id="zf-dots-oil" width="1.6" height="2.77" patternUnits="userSpaceOnUse">
                <circle cx="0.4" cy="0.4" r="0.34" />
                <circle cx="1.2" cy="1.785" r="0.34" />
              </pattern>
              <path id="zf-oil-shape" className="zf-oil-shape" d={REST_SHAPE} />
            </defs>
            <g clipPath="url(#zf-letters)">
              <rect className="zf-tank-empty" x={WORDMARK.x} y={WORDMARK.y} width={WORDMARK.w} height={WORDMARK.h} />
              <rect fill="url(#zf-dots-dim)" className="zf-tank-dots" x={WORDMARK.x} y={WORDMARK.y} width={WORDMARK.w} height={WORDMARK.h} />
              <use href="#zf-oil-shape" fill="url(#zf-oil)" />
              <use href="#zf-oil-shape" fill="url(#zf-dots-oil)" className="zf-oil-dots" />
              <g className="zf-bubbles" />
              <path className="zf-oil-line" d={REST_LINE} />
            </g>
            <path className="zf-mark-outline" d={WORDMARK.d} />
            <g className="zf-drops" />
          </svg>
        </div>

        <div className="zf-base">
          <span>
            © 2026 Zia Goods.<span className="zf-tagline"> Contract carriage, nationwide.</span>
          </span>
          <span className="zf-motto" lang="ur-Latn" title="As painted on the back of the trucks: look, but with love.">
            Dekh magar pyar se.
          </span>
          <button type="button" className="zf-return">
            Return trip
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M8 13 V3 M3.5 7.5 L8 3 L12.5 7.5" />
            </svg>
          </button>
        </div>
      </div>

      <Safe name="footer motion">
        <FooterMotion />
      </Safe>
    </footer>
  );
}
