/**
 * Stale scripts.
 *
 * The site is deployed often. A tab opened before a deploy still holds the
 * old page, and its next click asks for script files that belong to the old
 * version and are gone: the browser reports a failed chunk load, and the
 * page falls over. Nothing is wrong with the new version; the tab only
 * needs loading afresh. So the error pages (app/error.tsx, app/global-error.tsx)
 * recognise that failure and reload, once.
 */

const STALE = /ChunkLoadError|Loading chunk [\w-]+ failed|Failed to load chunk|Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed/i;

/** Whether `error` is a script the page asked for that could not be loaded. */
export const isStaleScript = (error: unknown) => {
  const e = error as { name?: unknown; message?: unknown } | null;
  return STALE.test(`${e?.name ?? ""} ${e?.message ?? ""} ${typeof error === "string" ? error : ""}`);
};

const FLAG = "zg:stale-reload";

/**
 * Loads the page afresh -- once per tab session, so a script that is
 * missing for a real reason cannot send the page round in circles. The flag
 * is cleared when a page has been up for a while (components/Alive.tsx).
 */
export function reloadOnce() {
  try {
    if (window.sessionStorage.getItem(FLAG)) return;
    window.sessionStorage.setItem(FLAG, "1");
  } catch {
    return;
  }
  window.location.reload();
}

export const clearReloadFlag = () => {
  try {
    window.sessionStorage.removeItem(FLAG);
  } catch {
    /* Nothing to clear. */
  }
};
