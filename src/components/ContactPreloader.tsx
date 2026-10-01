"use client";

import { useEffect, useRef } from "react";

/**
 * The /contact preloader: the centre line of the road, opening.
 *
 * An amber dot lights in the middle of the screen and the road's dashed
 * centre line runs out from it to both edges. Then the screen parts along
 * that line, as two lanes, and the form is there. About 2.2 seconds.
 *
 * It is here to be short, not to wait. The page is server-rendered and
 * already complete under it, so nothing is being loaded: this is a
 * handshake, and it is built so it can never hold up the form.
 *
 *   - Pure CSS (.ctp in globals.css): it paints with the first HTML and
 *     ends itself, before and without the page's script. Transforms and
 *     opacity only, so it runs off the main thread while the page hydrates.
 *   - Every visit, like the other pages' preloaders: a first visit, a
 *     refresh, a way back from another page. It is short enough not to
 *     need remembering.
 *   - A tap or a key skips it.
 *   - Reduced motion: not shown at all.
 *
 * All this component adds is the skip, and taking the overlay out of the
 * page once it has finished.
 */
export default function ContactPreloader() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;

    /* On a slow device hydration can land after the run has ended, and its
       animationend with it: the stylesheet has already hidden the overlay,
       so all that is left is to take it out. */
    if (getComputedStyle(el).visibility === "hidden") {
      el.hidden = true;
      return;
    }

    /* A skip is the stylesheet's quick fade (.ctp[data-skip]); its end,
       like the full run's, arrives as this one animationend. */
    const skip = () => {
      el.dataset.skip = "";
    };
    const ended = (e: AnimationEvent) => {
      if (e.target === el) el.hidden = true;
    };

    el.addEventListener("pointerdown", skip);
    window.addEventListener("keydown", skip);
    el.addEventListener("animationend", ended);
    return () => {
      el.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", skip);
      el.removeEventListener("animationend", ended);
    };
  }, []);

  return (
    <div id="ctp" className="ctp" ref={root} aria-hidden="true">
      <div className="ctp-half ctp-half--top" />
      <div className="ctp-half ctp-half--bottom">
        {/* On the lower lane, so the words leave with it. */}
        <p className="ctp-lbl">
          <span>OPENING DISPATCH LINE</span>
          <span>LINE OPEN</span>
        </p>
      </div>
      <i className="ctp-node" />
      <i className="ctp-head ctp-head--l" />
      <i className="ctp-head ctp-head--r" />
    </div>
  );
}
