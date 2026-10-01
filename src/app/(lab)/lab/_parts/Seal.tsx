/* The round seal: ZIA GOODS · 20 YEARS · NATIONWIDE around a ring, 20 in the
   middle, one amber dot after the mark. currentColor inks it. */
export default function Seal({ id, className }: { id: string; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" role="img" aria-label="Zia Goods, 20 years, nationwide">
      <defs>
        <path id={id} d="M100,100 m-72,0 a72,72 0 1,1 144,0 a72,72 0 1,1 -144,0" />
      </defs>
      <circle cx="100" cy="100" r="95" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="100" cy="100" r="88" fill="none" stroke="currentColor" strokeWidth="0.8" />
      <circle cx="100" cy="100" r="56" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <text fill="currentColor" style={{ font: "600 13.5px var(--l-sans, sans-serif)", letterSpacing: "0.24em" }}>
        <textPath href={`#${id}`}>ZIA GOODS · 20 YEARS · NATIONWIDE ·</textPath>
      </text>
      <text x="100" y="117" textAnchor="middle" fill="currentColor" style={{ font: "400 58px var(--l-serif, serif)" }}>
        20
      </text>
      <circle cx="100" cy="146" r="3.4" fill="#b8791a" />
    </svg>
  );
}
