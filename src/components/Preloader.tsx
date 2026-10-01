import mapData from "@/data/pakistan-map.json";
import { MAP_DOT_CODE } from "@/lib/map-dots";

import DotField from "./DotField";

const { viewBox } = mapData as unknown as { viewBox: string };

/**
 * The dot field lights up in place and then hands the same coordinates
 * over to the hero map, so both read from pakistan-map.json.
 */
export default function Preloader() {
  return (
    <div
      id="pre"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-navy"
    >
      <svg
        id="pre-svg"
        viewBox={viewBox}
        aria-hidden="true"
        className="h-auto max-h-[62vh] w-[min(52vw,46vh)]"
      >
        {/* Half the field on a checkerboard, built in the browser from the
            same packed grid as the map. See lib/dot-grid.ts. */}
        <DotField id="pre-dots" code={MAP_DOT_CODE} variant="pre" />
      </svg>

      <div id="pre-read" className="mt-[calc(26*var(--u))] flex items-baseline gap-[calc(14*var(--u))]">
        <span
          id="pre-num"
          className="font-mono text-[length:calc(44*var(--u))] font-medium tracking-[-0.02em] text-cream tabular-nums"
        >
          00
        </span>
        <span id="pre-lbl" className="font-mono text-[length:calc(11*var(--u))] tracking-[0.2em] text-amber">
          MAPPING NETWORK
        </span>
      </div>

      <div id="pre-bar" className="relative mt-[calc(16*var(--u))] h-px w-[min(280*var(--u),54vw)] bg-rule">
        <i id="pre-fill" className="absolute inset-y-0 left-0 right-full block bg-amber" />
      </div>
    </div>
  );
}
