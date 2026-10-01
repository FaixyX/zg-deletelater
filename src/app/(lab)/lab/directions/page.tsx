import Link from "next/link";

const DIRECTIONS = [
  { href: "/lab/directions/run", name: "1 · The Run", note: "Scroll drives a tanker from Port Qasim to Lahore, leg by leg, with the real route drawing as you go." },
  { href: "/lab/directions/ledger", name: "2 · Ledger in Motion", note: "Cream paper and ink. The contract is written, its five clauses slide past, and the seal stamps as you scroll." },
  { href: "/lab/directions/atlas", name: "3 · Cobalt Atlas", note: "A camera over the real road network: zoom into Port Qasim, fly the corridor north, pull back to all eight." },
];

export default function DirectionsIndex() {
  return (
    <main style={{ font: "17px/1.5 system-ui, sans-serif", padding: "48px 24px", maxWidth: 680, margin: "0 auto", color: "#0b1440", background: "#f3ecdd", minHeight: "100svh" }}>
      <h1 style={{ fontSize: 30 }}>Zia Goods: three directions, round 2</h1>
      <p style={{ margin: "8px 0 28px" }}>Throwaway lab pages. Scroll each one: the motion is the point.</p>
      <ul style={{ display: "grid", gap: 20 }}>
        {DIRECTIONS.map((d) => (
          <li key={d.href}>
            <Link href={d.href} style={{ fontWeight: 700, fontSize: 20 }}>
              {d.name}
            </Link>
            <div>{d.note}</div>
          </li>
        ))}
      </ul>
    </main>
  );
}
