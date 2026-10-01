"use client";

import { DialRoot, useDialKit } from "dialkit";
import { useEffect } from "react";

import { LIVE } from "@/lib/live";
import { SHADER } from "@/lib/motion";

import "dialkit/styles.css";

/**
 * Every DialKit panel, and the one root they render into.
 *
 * This is the only module in the app that imports `dialkit`. It is
 * reached through a dynamic import behind a NODE_ENV check (see
 * DevDials), so the library and its `motion` peer stay out of the
 * production bundle entirely rather than shipping to every visitor for a
 * panel that is hidden there.
 *
 * Two kinds of target, two ways of reaching them:
 *
 *   - Values a render loop reads every frame go to LIVE, which the
 *     shader reads directly. No re-render, no plumbing.
 *   - Values the stylesheet reads go to custom properties on :root,
 *     which is the channel the CSS already uses. The map is
 *     server-rendered and cannot host a hook.
 *
 * Defaults come from motion.ts and from globals.css, never retyped, so
 * the panel opens on exactly what ships.
 */

const GLASS_DEFAULTS = { strength: 1 };
const MAP_DEFAULTS = { heightSvh: 94, insetRightVw: 4 };

/**
 * Writes a tuned value to :root, or clears it when it is back at the
 * default.
 *
 * An inline style on documentElement outranks every rule in the
 * stylesheet, media queries included -- so setting --map-h
 * unconditionally would pin the map to one size at every breakpoint just
 * by having the panel mounted. Clearing the property hands control back
 * to the stylesheet, which is where the responsive behaviour lives.
 */
function applyVar(prop: string, value: number, fallback: number, format: (v: number) => string) {
  const root = document.documentElement.style;
  if (value === fallback) root.removeProperty(prop);
  else root.setProperty(prop, format(value));
}

export default function DevPanels() {
  const field = useDialKit("Gradient field", {
    loopSeconds: [SHADER.loopDuration, 8, 120, 1],
    intensity: [1, 0, 1, 0.01],
  });

  const glass = useDialKit("Glass", {
    strength: [GLASS_DEFAULTS.strength, 0, 1, 0.01],
  });

  const map = useDialKit("Map", {
    heightSvh: [MAP_DEFAULTS.heightSvh, 60, 130, 1],
    insetRightVw: [MAP_DEFAULTS.insetRightVw, 0, 12, 0.5],
  });

  /* Mutating a shared object rather than setting state: the shader's draw
     loop reads LIVE every frame, so the change lands on the next one.
     In an effect rather than in render -- writing to module state during
     render runs twice under StrictMode and is the kind of thing that
     bites later even when it is idempotent today. */
  useEffect(() => {
    Object.assign(LIVE.shader, {
      loopSeconds: field.loopSeconds,
      intensity: field.intensity,
    });
  }, [field]);

  useEffect(() => {
    applyVar("--glass-strength", glass.strength, GLASS_DEFAULTS.strength, String);
  }, [glass.strength]);

  useEffect(() => {
    applyVar("--map-h", map.heightSvh, MAP_DEFAULTS.heightSvh, (v) => `${v}svh`);
    applyVar("--map-inset-right", map.insetRightVw, MAP_DEFAULTS.insetRightVw, (v) => `${v}vw`);
  }, [map.heightSvh, map.insetRightVw]);

  /* Bottom-right, clear of the header. */
  return <DialRoot position="bottom-right" theme="dark" />;
}
