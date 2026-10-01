import {
  CORRIDOR_CONTEXT,
  CORRIDOR_DOT_CODE,
  CORRIDOR_LEGS,
  CORRIDOR_NODES,
  CORRIDOR_OUTLINE,
  CORRIDOR_VIEW,
} from "@/lib/corridor-map";

import { drawOn } from "@/lib/svg-path";

import CorridorMapMotion from "./CorridorMapMotion";
import { Safe } from "./Safe";
import DotField from "./DotField";

/**
 * The hero map at a smaller scale, cut to one route: Karachi to Multan.
 *
 * Same drawing, same classes -- depth-banded dots, boundary, faint context
 * roads, the amber route in bloom, halo and core -- through a window onto
 * Sindh and southern Punjab. A server component so the map data stays on
 * the server; Approach receives it as a prop and CorridorMapMotion
 * animates it by id.
 */
export default function CorridorMap() {
  const { x, y, w, h } = CORRIDOR_VIEW;
  const viewBox = `${x} ${y} ${w} ${h}`;

  return (
    <div
      className="corridor-card"
      id="corridor-map"
      data-ground="dark"
      style={{ aspectRatio: `${w} / ${h}` }}
    >
      <div className="corridor-glow" aria-hidden="true" />
      <svg viewBox={viewBox} className="absolute inset-0 h-full w-full" role="img" aria-labelledby="cm-title">
        <title id="cm-title">
          Map of the Karachi to Multan corridor: M-9 to Hyderabad, N-5 to Sukkur, M-5 to Multan
        </title>
        <DotField id="cm-dots" code={CORRIDOR_DOT_CODE} variant="map" />
        <g id="cm-outline">
          {CORRIDOR_OUTLINE.map((d, i) => (
            <path key={i} className="map-boundary" d={d} />
          ))}
        </g>
        <g id="cm-ctx">
          {CORRIDOR_CONTEXT.map((r) => (
            <path key={r.id} className="road-ctx" d={r.path} data-len={r.len} {...drawOn(r.len)} />
          ))}
        </g>
        {/* Each leg four times over, as on the hero: bloom, halo, core
            and the travelling pulse. The first three arrive hidden behind
            their own dash, measured at build, for the draw-on; data-reverse
            flags path data that runs south, so the route still unrolls
            from Karachi northward. */}
        {(["bloom", "halo", "cor", "pulse"] as const).map((layer) => (
          <g key={layer} id={`cm-${layer}`}>
            {CORRIDOR_LEGS.map((leg) => (
              <path
                key={leg.id}
                className={`road-${layer}`}
                d={leg.path}
                data-len={leg.len}
                data-reverse={leg.reverse ? "" : undefined}
                {...(layer === "pulse" ? {} : drawOn(leg.len, leg.reverse))}
              />
            ))}
          </g>
        ))}
        <g id="cm-nodes">
          {CORRIDOR_NODES.map((n) => (
            <g key={n.label}>
              {n.major ? <circle className="map-ring" cx={n.x} cy={n.y} r="7" /> : null}
              <circle className={n.major ? "core" : "core-min"} cx={n.x} cy={n.y} r={n.major ? 3.4 : 2.4} />
              <text
                className="clabel corridor-label"
                x={n.side === "left" ? n.x - 10 : n.x + 10}
                y={n.y + 4}
                textAnchor={n.side === "left" ? "end" : "start"}
              >
                {n.label}
              </text>
            </g>
          ))}
        </g>
      </svg>

      <ol className="corridor-legs" aria-hidden="true">
        {CORRIDOR_LEGS.map((leg) => (
          <li key={leg.id}>{leg.label}</li>
        ))}
      </ol>

      <Safe name="corridor map motion">
        <CorridorMapMotion />
      </Safe>
    </div>
  );
}
