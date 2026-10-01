/**
 * Ship to shelf, as a chain of five stations: the ship, the berth, our
 * tanker, the refinery gate and the shelf. The stretch from berth to
 * gate -- ours -- is drawn as amber chain links; the sea before it and
 * the market after it are plain dashed line. A drop of oil runs the
 * chain as the page is read, and each station lights as it arrives
 * (Approach drives it through --p and data-lit).
 *
 * Markup only. On a phone the chain stands on its end down the left.
 */

type Station = { key: string; tag: string; title: string; body: string; ours?: boolean };

const STATIONS: Station[] = [
  { key: "ship", tag: "01 · At sea", title: "The ship", body: "Palm, soybean and canola oil arrive by sea at Port Qasim." },
  { key: "berth", tag: "02 · Port Qasim", title: "The berth", body: "Pumped ship-side into the bulk liquid terminals." },
  { key: "tanker", tag: "03 · Zia Goods", title: "Our tanker", body: "Loaded, sealed and weighed, then driven by our own crew.", ours: true },
  { key: "gate", tag: "04 · Your gate", title: "The refinery", body: "Discharged in your window and signed for at the gate." },
  { key: "shelf", tag: "05 · Every city", title: "The shelf", body: "Ghee and cooking oil in kitchens from Karachi to Peshawar." },
];

/* Line icons on a 48 grid, drawn in currentColor. */
const ICONS: Record<string, React.ReactNode> = {
  ship: (
    <>
      <path d="M5 29h38l-5.5 9h-27z" />
      <path d="M11 29v-7h9v7M23 29v-4h15v4" />
      <path d="M14 22v-5h3v5" />
      <path d="M4 43c2.5-1.6 5-1.6 7.5 0s5 1.6 7.5 0 5-1.6 7.5 0 5 1.6 7.5 0 5-1.6 7.5 0" />
    </>
  ),
  berth: (
    <>
      <rect x="7" y="17" width="14" height="21" rx="2" />
      <rect x="25" y="11" width="16" height="27" rx="2" />
      <path d="M7 22h14M25 17h16" />
      <path d="M3 38h42M14 38v4M33 38v4" />
    </>
  ),
  tanker: (
    <>
      <rect x="4" y="17" width="27" height="12" rx="6" />
      <path d="M33 16h6l4.5 6.5V29H33z" />
      <path d="M36 19h3l2 3h-5z" />
      <circle cx="11" cy="32" r="3" />
      <circle cx="23" cy="32" r="3" />
      <circle cx="38" cy="32" r="3" />
      <path d="M17.5 21v4" />
    </>
  ),
  gate: (
    <>
      <path d="M9 40V16M16 40V22" />
      <path d="M9 12c-1.5-2 0-4 1.5-6 .8 2 2.5 3 1.5 6" />
      <rect x="21" y="24" width="21" height="16" rx="1.5" />
      <path d="M16 30h5M26 29h11M26 34h11" />
      <path d="M4 40h42" />
    </>
  ),
  shelf: (
    <>
      <path d="M5 21h38M5 39h38" />
      <rect x="9" y="10" width="7" height="11" rx="1.5" />
      <rect x="19" y="8" width="7" height="13" rx="1.5" />
      <rect x="29" y="11" width="9" height="10" rx="1.5" />
      <rect x="10" y="28" width="10" height="11" rx="2" />
      <rect x="23" y="26" width="7" height="13" rx="1.5" />
      <rect x="33" y="29" width="7" height="10" rx="1.5" />
    </>
  ),
};

export default function ShipToShelf() {
  return (
    <div className="sts" aria-labelledby="sts-title" role="group">
      <p className="sts-title" id="sts-title">
        Five hands between the ship and the shelf. <b>We are the one that holds.</b>
      </p>

      <div className="sts-chain">
        {/* The line under the stations: sea, our chain, market. Drawn twice
            -- faint, then full -- and the full one revealed to --p. */}
        <div className="sts-track" aria-hidden="true">
          {(["base", "fill"] as const).map((layer) => (
            <div className={`sts-line sts-line--${layer}`} key={layer}>
              <i className="sts-seg sts-seg--sea" />
              <i className="sts-seg sts-seg--ours" />
              <i className="sts-seg sts-seg--market" />
            </div>
          ))}
          <span className="sts-label">The link that can&apos;t break</span>
          <div className="sts-drop-run">
            <i className="sts-drop" />
          </div>
        </div>

        <ol className="sts-stations">
          {STATIONS.map((s) => (
            <li className={`sts-station${s.ours ? " sts-station--ours" : ""}`} key={s.key}>
              <span className="sts-icon" aria-hidden="true">
                <svg viewBox="0 0 48 48">{ICONS[s.key]}</svg>
              </span>
              <span className="sts-tag">{s.tag}</span>
              <h3 className="sts-name">{s.title}</h3>
              <p className="sts-body">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
