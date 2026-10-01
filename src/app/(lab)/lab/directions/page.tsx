import Link from "next/link";

const DIRECTIONS = [
  { href: "/lab/directions/a", name: "A · Contract Ledger", note: "Cream paper, ink blue, a seal stamped on a waybill." },
  { href: "/lab/directions/b", name: "B · Motorway Gantry", note: "Cobalt field, cream sign panels, route numbers as type." },
  { href: "/lab/directions/c", name: "C · Survey Atlas", note: "A printed-atlas map; the route inks itself north." },
];

export default function DirectionsIndex() {
  return (
    <main style={{ font: "17px/1.5 system-ui, sans-serif", padding: "48px 24px", maxWidth: 640, margin: "0 auto", color: "#0c2467", background: "#f5eedf", minHeight: "100svh" }}>
      <h1 style={{ fontSize: 28 }}>Zia Goods: three directions</h1>
      <p style={{ margin: "8px 0 24px" }}>Throwaway lab pages. Not the site.</p>
      <ul style={{ display: "grid", gap: 16 }}>
        {DIRECTIONS.map((d) => (
          <li key={d.href}>
            <Link href={d.href} style={{ fontWeight: 700 }}>
              {d.name}
            </Link>
            <div>{d.note}</div>
          </li>
        ))}
      </ul>
    </main>
  );
}
