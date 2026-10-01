import { SHADER } from "./motion";

/**
 * Runtime-tunable copies of the design constants.
 *
 * The point is the import graph. Reading values straight from a DialKit
 * hook meant every component that wanted a tunable number imported
 * `dialkit`, which put DialKit and its `motion` peer into the production
 * bundle -- 395KB and 269KB of the 838KB that visitors were downloading,
 * for a panel DialKit hides in production anyway.
 *
 * So the render paths read this object, which is seeded from motion.ts
 * and is exactly the shipped configuration. The dev panel is the only
 * thing that imports DialKit, it is loaded dynamically behind a NODE_ENV
 * check, and it writes here. Production never pulls the library in, and
 * nothing in the render path knows the panel exists.
 *
 * Mutable on purpose: the shader's draw loop reads it every frame, so a
 * change lands on the next frame with no re-render.
 */
export const LIVE = {
  shader: {
    loopSeconds: SHADER.loopDuration as number,
    intensity: 1,
  },
};
