/**
 * The light page.
 *
 * Some pages are too much for a device: a phone that runs out of memory
 * closes the tab, and the browser loads it again, and it runs out again --
 * a visitor's "it keeps crashing". The watchdog in app/layout.tsx counts
 * how often the page has started without ever settling (see Alive.tsx);
 * after the third, it marks the document `data-lite` for half an hour.
 * Also marked, always: a device that reports 2GB of memory or less.
 * `?lite=1` turns it on for a day, `?lite=0` turns it off, so either can
 * be tried from a link.
 *
 * Light means the page's own reduced-motion version: nothing scrubbed by
 * the scroll, no smooth-scroll, short preloaders, stills for the scenes
 * (prefersReducedMotion() in lib/motion.ts reads this too), and none of the
 * heaviest pieces -- the night run's 3D road and the WebGL fields -- are
 * built at all (the `html[data-lite]` rules in globals.css). The page, its
 * words and its links are all there.
 */

export const isLite = () => typeof document !== "undefined" && document.documentElement.hasAttribute("data-lite");

/* Three starts inside this many milliseconds, none of them lasting, is a
   crash loop. */
export const LOOP_WINDOW = 90_000;
/* A page that has been up this long has not crashed: the count is cleared. */
export const SETTLED_AFTER = 10_000;
export const BOOTS_KEY = "zg:boots";
