import type { CargoKind } from "@/lib/cargo";

/**
 * Cargo pictograms drawn in the map's own language: each silhouette is
 * filled with a hex grid of dots -- the dot field's grid, at icon scale --
 * with a few solid accents (a drip, the liquid in a flask, a pallet) so it
 * still reads at a glance. Drawn by hand as vectors, so they stay sharp at
 * any size and cost a few hundred bytes each.
 *
 * `fill` shapes take the dots, `cut` shapes are knocked out of them (the
 * hoops on a drum, the tape on a carton), `solid` shapes are flat colour.
 * Everything uses currentColor, so an icon takes the colour of its text.
 */

type Art = { fill: string[]; cut?: string[]; solid?: string[] };

const ART: Record<CargoKind, Art> = {
  molasses: {
    // A drum, two hoops, and molasses rolling over the rim
    fill: ["M30 40 a30 8 0 0 1 60 0 V100 a30 8 0 0 1 -60 0 Z"],
    cut: ["M24 60 H96 V65 H24 Z", "M24 83 H96 V88 H24 Z"],
    solid: [
      "M30 40 a30 8 0 0 1 60 0 a30 8 0 0 1 -60 0 Z M36 40 a24 5 0 0 0 48 0 a24 5 0 0 0 -48 0 Z",
      "M62 45 c8 1 11 3 11 9 v16 a5.5 5.5 0 0 1 -11 0 v-8 c0 -5 -3 -8 -7 -9 c3 -3 5 -7 7 -8 Z",
    ],
  },
  "edible-oil": {
    // A large drop with its highlight knocked out, a small drop beside it
    fill: ["M58 12 C58 12 26 52 26 76 a32 32 0 0 0 64 0 C90 52 58 12 58 12 Z"],
    cut: ["M40 78 a18 18 0 0 0 16 18 l-2 5 a23 23 0 0 1 -19 -23 Z"],
    solid: ["M98 22 c0 0 -9 11 -9 17 a9 9 0 0 0 18 0 c0 -6 -9 -17 -9 -17 Z"],
  },
  chemicals: {
    // A conical flask, the liquid in its base solid, bubbles rising
    fill: ["M46 14 H74 V21 H69 V46 L93 90 a10 10 0 0 1 -9 15 H36 a10 10 0 0 1 -9 -15 L51 46 V21 H46 Z"],
    cut: ["M55 30 a4 4 0 1 0 0.1 0 Z", "M64 38 a3 3 0 1 0 0.1 0 Z"],
    solid: ["M36.5 76 H83.5 L93 93 a8 8 0 0 1 -7 12 H34 a8 8 0 0 1 -7 -12 Z"],
  },
  "finished-goods": {
    // Three cartons on a pallet, tape knocked out down each
    fill: ["M16 56 H58 V98 H16 Z", "M62 56 H104 V98 H62 Z", "M39 12 H81 V52 H39 Z"],
    cut: ["M34 56 H40 V71 H34 Z", "M80 56 H86 V71 H80 Z", "M57 12 H63 V27 H57 Z"],
    solid: ["M10 101 H110 V107 H10 Z", "M16 107 H28 V114 H16 Z", "M54 107 H66 V114 H54 Z", "M92 107 H104 V114 H92 Z"],
  },
  "dry-cargo": {
    // A tied sack, with loose grain spilling at its foot
    fill: ["M40 30 C28 44 22 62 22 78 C22 96 36 106 56 106 S90 96 90 78 C90 62 84 44 72 30 Z"],
    cut: ["M38 30 H74 V36 H38 Z"],
    solid: [
      "M44 14 C50 20 62 20 68 14 L72 26 H40 Z",
      "M96 96 a5 3 -30 1 0 0.1 0 Z",
      "M104 104 a5 3 20 1 0 0.1 0 Z",
      "M92 108 a5 3 -10 1 0 0.1 0 Z",
    ],
  },
};

export default function CargoIcon({
  kind,
  uid,
  className,
}: {
  kind: CargoKind;
  /* Unique on the page: the pattern and mask are referenced by id. */
  uid: string;
  className?: string;
}) {
  const art = ART[kind];
  const dots = `dots-${uid}`;
  const mask = `mask-${uid}`;

  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true" focusable="false">
      <defs>
        {/* The dot field's hex grid: rows 4.5 apart, alternate rows
            shifted half a step. */}
        <pattern id={dots} width="5.2" height="9" patternUnits="userSpaceOnUse">
          <circle cx="1.3" cy="2.25" r="1.3" fill="currentColor" />
          <circle cx="3.9" cy="6.75" r="1.3" fill="currentColor" />
        </pattern>
        <mask id={mask} maskUnits="userSpaceOnUse" x="0" y="0" width="120" height="120">
          {art.fill.map((d, i) => (
            <path key={i} d={d} fill="white" />
          ))}
          {art.cut?.map((d, i) => (
            <path key={i} d={d} fill="black" />
          ))}
        </mask>
      </defs>
      <rect width="120" height="120" fill={`url(#${dots})`} mask={`url(#${mask})`} />
      {art.solid?.map((d, i) => (
        <path key={i} d={d} fill="currentColor" fillRule="evenodd" />
      ))}
    </svg>
  );
}
