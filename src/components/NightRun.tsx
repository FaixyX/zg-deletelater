import { LANES } from "@/lib/faq";
import { NIGHT } from "@/lib/motion";

import NightRunMotion from "./NightRunMotion";
import { Safe } from "./Safe";

const km = (city: string) => `${LANES.find((l) => l.city === city)!.km.toLocaleString("en-US")} km`;

/* Painted on the road, one after another as they pass under: the route
   north out of Port Qasim. */
const ROUTE = ["M-9", "N-5", "M-5", "M-4", "M-2"];

/* A line that comes in word by word. */
const words = (text: string) =>
  text.split(" ").map((w, i) => (
    <span className="nr-w" key={i}>
      {w}{" "}
    </span>
  ));

/**
 * What the flood opens onto: the motorway at night, the logo's own road
 * drawn full size -- cream lane lines, an amber centre line -- and the
 * scroll drives it. Lamps sweep overhead, route numbers pass underneath,
 * a gantry comes up with the network on it, and a ZG tanker pulls away
 * ahead toward the amber dot on the horizon as night turns to dawn and
 * the light section takes over.
 *
 * A 3D scene in CSS: the road is a plane laid back in perspective, the
 * lamps, the gantry and the tanker stand in it, and the browser sorts and
 * scales the lot. The sign and both lines are real text. Server markup;
 * NightRunMotion places everything by the scroll.
 */
export default function NightRun() {
  return (
    <section className="nr" id="night-run" aria-labelledby="nr-title">
      <div className="nr-view">
        <div className="nr-sky" aria-hidden="true" />
        <div className="nr-dawn" aria-hidden="true" />
        <div className="nr-ground" aria-hidden="true" />

        <div className="nr-stage">
          <div className="nr-road" aria-hidden="true" />
          {ROUTE.map((r) => (
            <span className="nr-paint" aria-hidden="true" key={r}>
              {r}
            </span>
          ))}
          {Array.from({ length: NIGHT.lamps * 2 }, (_, i) => (
            <i className={`nr-lamp ${i % 2 ? "nr-lamp--r" : "nr-lamp--l"}`} aria-hidden="true" key={i} />
          ))}

          {/* The gantry: the network as the road signs it. */}
          <div className="nr-gantry">
            <div className="nr-sign nr-sign--exit">
              <span className="nr-shield">N-10</span>
              <ul>
                <li>
                  Gwadar <b>{km("Gwadar")}</b>
                </li>
              </ul>
              <span className="nr-arrow" aria-hidden="true">
                ↖
              </span>
            </div>
            <div className="nr-sign">
              <span className="nr-shield">M-9</span>
              <ul>
                <li>
                  Hyderabad <b>{km("Hyderabad")}</b>
                </li>
                <li>
                  Multan <b>{km("Multan")}</b>
                </li>
                <li>
                  Lahore <b>{km("Lahore")}</b>
                </li>
              </ul>
              <span className="nr-arrow" aria-hidden="true">
                ↑
              </span>
            </div>
          </div>

          {/* A ZG tanker from behind, dressed the way the trucks on the
              GT Road are: a painted bumper, and chains that swing. */}
          <div className="nr-tanker" aria-hidden="true">
            <svg viewBox="0 0 200 290">
              <defs>
                <radialGradient id="nr-tank-end" cx="0.42" cy="0.36" r="0.7">
                  <stop offset="0" stopColor="#ffd08a" />
                  <stop offset="0.45" stopColor="#e8a33d" />
                  <stop offset="1" stopColor="#a8661a" />
                </radialGradient>
                <radialGradient id="nr-tail" cx="0.5" cy="0.5" r="0.5">
                  <stop offset="0" stopColor="#ff5a4a" stopOpacity="0.85" />
                  <stop offset="1" stopColor="#ff5a4a" stopOpacity="0" />
                </radialGradient>
              </defs>
              {/* Tail-light glow on the road. */}
              <ellipse cx="30" cy="276" rx="44" ry="10" fill="url(#nr-tail)" opacity="0.7" />
              <ellipse cx="170" cy="276" rx="44" ry="10" fill="url(#nr-tail)" opacity="0.7" />
              {/* Wheels, under the frame. */}
              <rect x="14" y="214" width="46" height="56" rx="8" fill="#050817" />
              <rect x="140" y="214" width="46" height="56" rx="8" fill="#050817" />
              {/* The tank's end, and the ring round it. */}
              <ellipse cx="100" cy="112" rx="94" ry="92" fill="#6b3f0f" />
              <ellipse cx="100" cy="112" rx="86" ry="84" fill="url(#nr-tank-end)" />
              <ellipse cx="100" cy="112" rx="62" ry="60" fill="none" stroke="#a8661a" strokeWidth="2" opacity="0.6" />
              <text x="100" y="128" textAnchor="middle" fontFamily="var(--font-display)" fontWeight="700" fontSize="46" fill="#0b1433">
                ZG
              </text>
              {/* Marker lights along the top. */}
              {[62, 100, 138].map((x) => (
                <circle key={x} cx={x} cy="18" r="4.5" fill="#ffb347" />
              ))}
              {/* The ladder. */}
              <path d="M150 40 V206 M164 36 V206 M150 62 H164 M150 86 H164 M150 110 H164 M150 134 H164 M150 158 H164 M150 182 H164" stroke="#d8e3ff" strokeWidth="3" opacity="0.8" />
              {/* Frame and bumper. */}
              <rect x="20" y="198" width="160" height="12" fill="#0b1433" />
              <rect x="4" y="210" width="192" height="30" rx="4" fill="#0b1433" />
              {/* The bumper, painted. */}
              <path d="M40 212 l8 12 l8 -12 l8 12 l8 -12 l8 12 l8 -12 l8 12 l8 -12 l8 12 l8 -12 l8 12 l8 -12 l8 12 l8 -12" fill="none" stroke="#2fbf71" strokeWidth="2.4" />
              <text x="100" y="236" textAnchor="middle" fontFamily="var(--font-mono)" fontWeight="700" fontSize="9.5" letterSpacing="0.5" fill="#f8f1e4">
                DEKH MAGAR PYAR SE
              </text>
              {/* Tail lights. */}
              <rect x="8" y="213" width="26" height="12" rx="3" fill="#ff3b30" />
              <rect x="166" y="213" width="26" height="12" rx="3" fill="#ff3b30" />
              <circle cx="21" cy="219" r="16" fill="url(#nr-tail)" />
              <circle cx="179" cy="219" r="16" fill="url(#nr-tail)" />
              {/* The chains. */}
              <g className="nr-chains" stroke="#e8a33d" strokeWidth="1.6">
                {[44, 60, 76, 92, 108, 124, 140, 156].map((x, i) => (
                  <g key={x}>
                    <path d={`M${x} 240 v${i % 2 ? 16 : 12}`} />
                    <circle cx={x} cy={240 + (i % 2 ? 17 : 13)} r="2" fill="#e8a33d" stroke="none" />
                  </g>
                ))}
              </g>
            </svg>
          </div>
        </div>

        {/* Where it is headed: the amber dot on the horizon. */}
        <div className="nr-dest" aria-hidden="true">
          <i />
        </div>
        <div className="nr-beams" aria-hidden="true" />

        <div className="nr-copy">
          <h2 className="nr-line nr-line--night" id="nr-title">
            {words("While your plant sleeps,")}
            <br />
            {words("your oil is on the M-9.")}
          </h2>
          <p className="nr-line nr-line--dawn">
            {words("Sealed at the berth.")}
            <br />
            {words("Signed for at the gate.")}
          </p>
        </div>
      </div>
      <Safe name="night run motion">
        <NightRunMotion />
      </Safe>
    </section>
  );
}
