/**
 * The map's dot field, packed for the trip to the browser.
 *
 * Rendered as server markup, the field cost more than everything else on
 * the page put together: 4,388 map dots and 2,194 preloader dots came to
 * 421KB of <circle> tags, and React then carried every one of them a
 * second time in its hydration payload and walked each on hydration --
 * 1.37MB of HTML in total, most of it the same dots twice.
 *
 * Every dot sits exactly on the hex grid the generator laid out (see
 * scripts/build-pakistan-map-data.py), so a dot is fully described by
 * its row, its column and its depth band. The server packs the field into
 * a few kilobytes of those; DotField expands them into the same circles
 * in the browser, before HeroMotion looks for them. The dots are opacity 0
 * until GSAP reveals them anyway, so the page looks the same at every
 * point -- only the payload and the hydration work change.
 *
 * This module never imports the map JSON. It only defines the format, so
 * the client bundle can carry the decoder without the 160KB data file.
 */

/** The generator's hex grid: odd rows are shifted half a column right. */
const DOT_GRID = { dx: 7.6, dy: 6.6, pad: 26 } as const;

/** A dot with no depth band draws in the farthest one, as it always has. */
const DEFAULT_DEPTH = 7;

type Dot = [number, number, number?];

const rowOf = (y: number) => Math.round((y - DOT_GRID.pad) / DOT_GRID.dy);
const colOf = (x: number, row: number) =>
  Math.round((x - DOT_GRID.pad - (row % 2 ? DOT_GRID.dx / 2 : 0)) / DOT_GRID.dx);

/**
 * `row:col=depths,col=depths;row:...` -- one digit per dot, and a new run
 * wherever a row has a gap. Rows and columns are written in ascending
 * order, which is also the order of the source array, so the reveal's
 * top-to-bottom sweep reads the same sequence it always did.
 */
export function encodeDots(dots: readonly Dot[]): string {
  const rows = new Map<number, [number, number][]>();
  for (const [x, y, depth] of dots) {
    const row = rowOf(y);
    const col = colOf(x, row);
    let cells = rows.get(row);
    if (!cells) rows.set(row, (cells = []));
    cells.push([col, depth ?? DEFAULT_DEPTH]);
  }

  return [...rows.keys()]
    .sort((a, b) => a - b)
    .map((row) => {
      const cells = rows.get(row)!.sort((a, b) => a[0] - b[0]);
      const runs: string[] = [];
      let start = cells[0][0];
      let prev = start - 1;
      let digits = "";
      for (const [col, depth] of cells) {
        if (col !== prev + 1) {
          runs.push(`${start}=${digits}`);
          start = col;
          digits = "";
        }
        digits += depth;
        prev = col;
      }
      runs.push(`${start}=${digits}`);
      return `${row}:${runs.join(",")}`;
    })
    .join(";");
}

/** The two fields drawn from the one grid. */
export type DotVariant = "map" | "pre";

/**
 * The preloader draws half the field, on a checkerboard.
 *
 * It shows the whole country in a 414px-wide box on a 1440px viewport --
 * a 0.46 scale, which puts the full field's dots at 1.56px across and
 * 3.5px apart, finer than the screen resolves. Checkerboard rather than
 * whole rows or columns: dropping rows leaves visible horizontal striping,
 * and dropping every other row AND column thins it to a quarter, which
 * visibly weakens the silhouette. Alternating on row+col parity removes
 * half the dots while keeping coverage even in both axes.
 *
 * The map's depth ladder (see .dot--d0 in globals.css) steps its colour
 * and strength in the stylesheet and its size here: a dot's radius is
 * part of its path, so it lives with the geometry. The nearest band is
 * the largest, the farthest the smallest.
 */
const VARIANTS = {
  map: {
    rowClass: "dot-row",
    keep: () => true,
    band: (d: number) => d,
    className: (d: number) => `dot dot--d${d}`,
    r: (d: number) => [1.9, 1.84, 1.79, 1.74, 1.7, 1.66, 1.62, 1.58][d] ?? 1.58,
  },
  pre: {
    rowClass: "pre-row",
    keep: (row: number, col: number) => (row + col) % 2 === 0,
    band: () => 0,
    className: () => "pre-dot",
    r: () => 1.7,
  },
} as const;

/* Two decimals at most: 26 + 81 * 7.6 is 641.5999999999999 in floating
   point, and the drawing should say 641.6. */
const fixed = (v: number) => String(Math.round(v * 100) / 100);

/* One dot as a path: a pen move to its left edge, then two half-circle
   arcs round and back. The pen ends where it started, so the next dot is
   a move relative to this one. */
const disc = (r: number) => `a${r} ${r} 0 1 0 ${fixed(2 * r)} 0a${r} ${r} 0 1 0 ${fixed(-2 * r)} 0`;

/**
 * SVG markup for a whole field: one <g> per grid row, and in each row one
 * <path> per depth band carrying all of that band's dots.
 *
 * Rows rather than loose dots because the reveal fades them. Faded one
 * at a time, 4,388 circles meant hundreds mid-fade in any frame, each its
 * own paint effect for the browser to layerize and paint -- most of the
 * per-frame main-thread work during the reveal. A row's dots all started
 * within 0.04s of each other anyway, so fading the row looks the same; in
 * a trace of the reveal it cut layerize time about 5x and style
 * recalculation about 10x.
 *
 * Paths rather than <circle>s because every element costs the browser
 * style, layout and hit-testing whether it moves or not: as circles the
 * two fields came to some 6,600 elements, two thirds of the whole page.
 * As paths they are a few hundred, drawn exactly the same.
 *
 * Each row carries `data-i`: the position of its first dot in the field's
 * original sequence, which is exactly when that dot used to start. The
 * reveal staggers rows by it, so every row begins when it always did.
 */
export function dotFieldMarkup(code: string, variant: DotVariant): string {
  const v = VARIANTS[variant];
  const { dx, dy, pad } = DOT_GRID;
  let html = "";
  let index = 0;

  for (const rowSpec of code.split(";")) {
    const [rowStr, runs] = rowSpec.split(":");
    const row = Number(rowStr);
    const y = pad + row * dy;
    const shift = row % 2 ? dx / 2 : 0;
    const first = index;
    /* Per band: its path data so far, and where its pen was left. */
    const bands = new Map<number, { d: string; x: number }>();

    for (const run of runs.split(",")) {
      const [colStr, depths] = run.split("=");
      let col = Number(colStr);
      for (const depth of depths) {
        if (v.keep(row, col)) {
          const band = v.band(Number(depth));
          const r = v.r(band);
          const left = pad + col * dx + shift - r;
          const pen = bands.get(band);
          if (pen) {
            pen.d += `m${fixed(left - pen.x)} 0${disc(r)}`;
            pen.x = left;
          } else bands.set(band, { d: `M${fixed(left)} ${fixed(y)}${disc(r)}`, x: left });
          index++;
        }
        col++;
      }
    }

    if (!bands.size) continue;
    let paths = "";
    for (const [band, { d }] of bands) paths += `<path class="${v.className(band)}" d="${d}"/>`;
    html += `<g class="${v.rowClass}" data-i="${first}">${paths}</g>`;
  }

  return html;
}
