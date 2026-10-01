"use client";

import { useLayoutEffect, useRef } from "react";

import { type DotVariant, dotFieldMarkup } from "@/lib/dot-grid";

/**
 * An empty <g> on the server, filled with the dot field in the browser.
 *
 * The dots are written with innerHTML rather than rendered by React. As
 * React children, 4,388 of them would be serialised into the hydration
 * payload and walked one by one on hydration -- which is exactly the cost
 * this component exists to remove. React owns only the empty group and,
 * with no children of its own to reconcile, never touches what is put
 * inside it.
 *
 * A layout effect so the dots exist before HeroMotion's useGSAP --
 * also a layout effect, and later in the tree -- goes looking for them.
 */
export default function DotField({ id, code, variant }: { id: string; code: string; variant: DotVariant }) {
  const ref = useRef<SVGGElement>(null);

  useLayoutEffect(() => {
    const g = ref.current;
    /* Built once. StrictMode re-runs effects in development, and the
       field is the same both times. */
    if (!g || g.firstChild) return;
    g.innerHTML = dotFieldMarkup(code, variant);
  }, [code, variant]);

  return <g id={id} ref={ref} />;
}
