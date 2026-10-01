/* A food-grade oil tanker in side elevation, drawn as technical line art:
   tractor unit facing right, a cylindrical tank on a tri-axle trailer, the ZG
   mark on the barrel. Wheels carry class "tk-wheel" so motion can spin them;
   colours come from currentColor and two CSS variables, so each direction
   can ink it differently. Server component: plain SVG. */
const WHEELS = [52, 92, 132, 300, 336, 446];

export default function Tanker({ className, mark = "/zia-goods-mark.svg" }: { className?: string; mark?: string }) {
  return (
    <svg className={className} viewBox="0 0 520 176" fill="none" role="img" aria-label="Zia Goods food-grade oil tanker">
      <g stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
        {/* walkway rail */}
        <path d="M38 24h268M54 24v12M110 24v12M166 24v12M222 24v12M278 24v12" strokeWidth="1.4" />
        {/* manhole domes */}
        <path d="M84 36v-6h26v6M160 36v-6h26v6M236 36v-6h26v6" />
        {/* the barrel */}
        <rect x="14" y="36" width="318" height="88" rx="44" fill="var(--tk-body, transparent)" />
        <path d="M58 36v88M288 36v88" strokeWidth="1.2" opacity=".55" />
        <path d="M30 80h286" strokeWidth="1" opacity=".35" />
        {/* rear ladder */}
        <path d="M22 50v70M32 46v76M22 62h10M22 76h10M22 90h10M22 104h10" strokeWidth="1.4" />
        {/* chassis and fifth wheel */}
        <path d="M18 132h338M292 124v8M330 124v8" />
        {/* tractor unit */}
        <path
          d="M352 140V62c0-4 3-7 7-7h52c5 0 9 2 12 6l26 34c2 3 3 6 3 9v36h-8M372 140h52M352 140h10"
          fill="var(--tk-cab, transparent)"
        />
        <path d="M364 66h44c3 0 5 1 7 3l20 27h-71z" strokeWidth="1.6" />
        <path d="M404 98v38M392 112h8" strokeWidth="1.4" />
        <path d="M446 104h14v26h-6" strokeWidth="1.4" />
        <path d="M456 116h8M456 122h8" strokeWidth="1.2" />
        <path d="M344 56v-30h6v30" strokeWidth="1.6" />
        <path d="M470 108h6v12h-6" strokeWidth="1.6" />
      </g>
      {/* the mark on the barrel */}
      <image href={mark} x="120" y="54" width="106" height="52" preserveAspectRatio="xMidYMid meet" />
      {/* tail lamp, the one warm light, after the mark's own amber */}
      <rect x="12" y="112" width="5" height="10" rx="1" fill="var(--tk-lamp, #e3a23f)" />
      <g stroke="currentColor" strokeWidth="2">
        {WHEELS.map((x) => (
          <g key={x} className="tk-wheel">
            <circle cx={x} cy="150" r="17" fill="var(--tk-tyre, transparent)" />
            <circle cx={x} cy="150" r="7" strokeWidth="1.4" />
            <path d={`M${x} 136v7M${x} 157v7M${x - 14} 150h7M${x + 7} 150h7`} strokeWidth="1.4" />
          </g>
        ))}
      </g>
    </svg>
  );
}
