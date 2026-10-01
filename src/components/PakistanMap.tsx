import mapData from "@/data/pakistan-map.json";
import { MAP_DOT_CODE } from "@/lib/map-dots";
import { corridorLegs } from "@/lib/corridor-routes";
import { compactPath, dashLength, drawOn } from "@/lib/svg-path";

import DotField from "./DotField";

type Road = { id: string; label: string; path: string; type: string };
type Node = {
  label: string;
  x: number;
  y: number;
  major?: number;
  /* Which side of the marker the label sits on. Labels default to the
     right, which puts them across the corridor wherever the route leaves
     a city eastward -- Peshawar being the obvious one. Set "left" in the
     node data for those. */
  side?: "left" | "right";
};

const data = mapData as unknown as {
  viewBox: string;
  outline: string[];
  roads: Road[];
  nodes: Node[];
};
const { viewBox, nodes } = data;

/* Relative path data, about half the bytes of the source's absolute
   coordinates and the same drawing: see lib/svg-path.ts. */
const outline = data.outline.map(compactPath);

/* Every road is drawn on as the map comes up (HeroMotion), so each is
   measured here, at build, and arrives hidden behind its own dash: the
   browser never has to measure a path. */
const measured = (r: { id: string; path: string }) => ({
  id: r.id,
  path: compactPath(r.path),
  len: dashLength(r.path),
});

/* The corridor as one clean line per leg, city marker to city marker,
   rebuilt from the traced roads (see lib/corridor-routes.ts): no doubled
   strands, no ends stopping short of a city. */
const corridorRoads = corridorLegs(
  data.roads.filter((r) => r.type === "corridor"),
  nodes
).map(measured);
const contextRoads = data.roads.filter((r) => r.type === "context").map(measured);

/* The travelling pulse's dash, in map units. */
const PULSE_DASH = 40;

/* Where a label needs to move off the line it would otherwise sit on:
   which side of its marker, and how far up or down. Faisalabad's label
   ran into Lahore's to its right; Islamabad's, Multan's and Gwadar's sat
   across the routes leaving them. */
const LABEL: Record<string, { side?: "left" | "right"; dy?: number }> = {
  Faisalabad: { side: "left", dy: -9 },
  Islamabad: { dy: -8 },
  Multan: { dy: 12 },
  "Port Qasim": { dy: 9 },
  Gwadar: { dy: 14 },
};

/**
 * Server component on purpose: the map data is ~160KB and every element
 * below is static, so it renders to HTML at build time and none of the
 * JSON reaches the browser. HeroMotion animates these by id afterwards.
 *
 * The exception is the dot field. As server markup its 4,388 circles were
 * most of the page's weight twice over -- once as HTML, once in React's
 * hydration payload -- so it travels as a few kilobytes of grid positions
 * and DotField draws it in the browser. See lib/dot-grid.ts.
 */
export default function PakistanMap() {
  return (
    <div
      className="map-layer pointer-events-none absolute inset-0 z-[1] flex items-center justify-end pr-[var(--map-inset-right)] max-[900px]:justify-center max-[900px]:pr-0"
      aria-hidden="true"
    >
      {/* Soft amber wash sitting under the corridor. A single radial on
          its own element rather than a filter on the route, so the glow
          reads through the dot field instead of only around the stroke. */}
      <div className="map-glow pointer-events-none absolute inset-0" />

      {/* Sized to show the whole country, not a crop: the eyebrow claims
          nationwide coverage, so the silhouette has to back it up. Sits
          right, opposite the copy, and bleeds a little past the viewport
          edge rather than floating inside it.

          Two SVGs on one frame, drawn over each other on the same viewBox.
          The first holds everything that stays still once the intro has
          played; the second, the corridor pulse and the city markers,
          whose rings pulse on a loop. As one drawing, every frame of that
          movement repainted the 4,388 dots under it -- see .map-live.

          On a phone the frame spans the screen's width. The svg used to
          ask for 150%, but as a flex item it was shrunk back to 100%, so
          full width is what shipped and what this keeps. */}
      <div
        className="map-art relative h-[var(--map-h)] w-[var(--map-w)] shrink-0 translate-y-[2%]
          max-[900px]:aspect-[900/950] max-[900px]:h-auto max-[900px]:w-full"
      >
        <svg id="map" viewBox={viewBox} className="absolute inset-0 h-full w-full">
          {/* The one part of the map built in the browser: see DotField. */}
          <DotField id="m-dots" code={MAP_DOT_CODE} variant="map" />
          <g id="m-outline">
            {outline.map((d, i) => (
              <path key={i} className="map-boundary" d={d} />
            ))}
          </g>
          <g id="m-ctx">
            {contextRoads.map((r) => (
              <path key={r.id} className="road-ctx" d={r.path} {...drawOn(r.len)} />
            ))}
          </g>
          <g id="m-bloom">
            {corridorRoads.map((r) => (
              <path key={r.id} className="road-bloom" d={r.path} {...drawOn(r.len)} />
            ))}
          </g>
          <g id="m-halo">
            {corridorRoads.map((r) => (
              <path key={r.id} className="road-halo" d={r.path} {...drawOn(r.len)} />
            ))}
          </g>
          <g id="m-cor">
            {corridorRoads.map((r) => (
              <path key={r.id} className="road-cor" d={r.path} {...drawOn(r.len)} />
            ))}
          </g>
        </svg>

        <svg viewBox={viewBox} className="map-live absolute inset-0 h-full w-full">
          <g id="m-pulse">
            {/* One short dash per road, parked at its start until the
                pulse runs it along (HeroMotion). */}
            {corridorRoads.map((r) => (
              <path
                key={r.id}
                className="road-pulse"
                d={r.path}
                data-len={r.len}
                strokeDasharray={`${PULSE_DASH} ${r.len - PULSE_DASH}`}
                strokeDashoffset={r.len}
              />
            ))}
          </g>
          <g id="m-nodes">
            {nodes.map((n) => {
              const side = LABEL[n.label]?.side ?? n.side;
              const dy = LABEL[n.label]?.dy ?? 0;
              return (
                <g key={n.label}>
                  {n.major ? <circle className="map-ring" cx={n.x} cy={n.y} r="9" /> : null}
                  <circle
                    className={n.major ? "core" : "core-min"}
                    cx={n.x}
                    cy={n.y}
                    r={n.major ? 3.8 : 2.8}
                  />
                  <text
                    className={n.major ? "clabel clabel--major" : "clabel"}
                    x={side === "left" ? n.x - 11 : n.x + 11}
                    y={n.y + 5 + dy}
                    textAnchor={side === "left" ? "end" : "start"}
                  >
                    {n.label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}
