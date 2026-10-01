import mapData from "@/data/pakistan-map.json";

import { encodeDots } from "./dot-grid";

/**
 * The packed dot field, computed once at build.
 *
 * Server components only. This module imports the 160KB map JSON, so
 * pulling it into a client component would ship the whole data file to
 * every visitor -- the thing lib/dot-grid.ts exists to avoid. Client code
 * receives the packed string as a prop instead.
 */
export const MAP_DOT_CODE = encodeDots(
  (mapData as unknown as { dots: [number, number, number?][] }).dots
);
