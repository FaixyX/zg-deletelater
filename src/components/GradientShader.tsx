"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { useRef } from "react";

import { LIVE } from "@/lib/live";
import { isLite } from "@/lib/lite";
import { EASE, SHADER, onHeroFlag, onRevealed, prefersReducedMotion } from "@/lib/motion";

/* Fullscreen triangle rather than a quad: three vertices instead of six,
   one triangle instead of two, and no seam down the diagonal where the
   two halves of a quad meet. The parts hanging outside the viewport are
   clipped for free. */
const VERT = `
attribute vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

/* A mesh gradient: four large, soft pools of colour drifting slowly on
   circles, blended over the navy. No noise, no lines, nothing that
   answers the pointer -- a background, and nothing more. A handful of
   exp() a pixel, drawn at a fraction of the screen's resolution, which
   a field this soft can't show.

   Colours are the brand's: the pools sit between navy-deep and a lifted
   blue and never touch amber, which stays the corridors' alone. All
   hold the ground's channel ratio -- red near nothing, blue dominant --
   so they read as depth, not as a haze laid over the page. */
const FRAG = `
precision mediump float;

uniform vec2  uRes;
uniform vec4  uPool[4]; // centre (0-1 of height, x scaled by aspect), radius, strength
uniform float uIntensity;

const vec3 C_DEEP = vec3(0.004, 0.059, 0.231);
const vec3 C_BASE = vec3(0.004, 0.122, 0.482);
const vec3 C_LIFT = vec3(0.012, 0.200, 0.722);
const vec3 C_EDGE = vec3(0.020, 0.302, 0.941);

float pool(vec2 p, vec4 k) {
  vec2 d = p - k.xy;
  return exp(-dot(d, d) / (k.z * k.z)) * k.w;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = vec2(uv.x * uRes.x / uRes.y, uv.y);

  vec3 col = C_BASE;
  col = mix(col, C_DEEP, pool(p, uPool[0]));
  col = mix(col, C_LIFT, pool(p, uPool[1]));
  col = mix(col, C_DEEP, pool(p, uPool[2]));
  col = mix(col, C_EDGE, pool(p, uPool[3]) * 0.45);

  /* A whisper of dither, so the long soft ramps don't band. */
  col += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 255.0;

  /* Settle out of flat navy, so the first painted frame matches the
     page background exactly and the field arrives rather than pops. */
  gl_FragColor = vec4(mix(C_BASE, col, uIntensity), 1.0);
}
`;

/* The four pools, in the field's units (1 = the screen's height; x is
   a share of the width): where each circles, how wide it circles, how
   big and how strong it is, and how many turns it makes a loop. Two
   deepen the navy, one lifts it, one catches a little light. */
const POOLS = [
  { x: 0.1, y: 0.15, orbit: 0.12, r: 0.75, k: 0.7, turns: 1, from: 0 }, // deep, low left, under the copy
  { x: 0.78, y: 0.62, orbit: 0.16, r: 0.6, k: 0.55, turns: 1, from: 2.1 }, // lift, behind the map
  { x: 0.95, y: 1.05, orbit: 0.1, r: 0.55, k: 0.6, turns: 2, from: 4.0 }, // deep, top right corner
  { x: 0.55, y: 0.3, orbit: 0.2, r: 0.45, k: 0.5, turns: 1, from: 1.2 }, // light, drifting through
];

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

/**
 * The animated gradient field behind the hero.
 *
 * One GSAP tween runs a phase from 0 to 1 on repeat; the ticker turns
 * that phase into uniforms and draws. Nothing here runs its own clock,
 * so pausing or scrubbing GSAP pauses or scrubs the background too.
 *
 * The loop is seamless rather than wrapping: every animated value is a
 * point on a circle travelled a whole number of times per cycle, so
 * phase 1 and phase 0 describe the same field exactly.
 *
 * Degrades in two directions. If WebGL is missing or the program fails
 * to build, the canvas is removed from the paint entirely and the navy
 * page background shows through -- which is the shader's own base
 * colour, so the fallback is the field's floor rather than a different
 * design. Under reduced motion it paints one frame at full intensity
 * and stops.
 */
export default function GradientShader() {
  const ref = useRef<HTMLCanvasElement>(null);

  /* Tunable values are read from LIVE, not from a hook. That keeps
     `dialkit` out of this module's imports and so out of the production
     bundle; the dev panel writes to LIVE instead. LIVE is seeded from
     SHADER, so what renders here is the shipped configuration. */

  useGSAP(() => {
    const canvas = ref.current;
    if (!canvas) return;

    /* A WebGL canvas with alpha:false that never gets drawn to composites
       as opaque black, so bailing out halfway would paint a black slab
       over the hero -- worse than not being here at all. Every failure
       path below goes through this first.

       Cleared on every setup rather than only set on failure, so a mount
       that succeeds after one that bailed shows the canvas again. */
    const bail = () => {
      canvas.style.display = "none";
    };
    canvas.style.display = "";
    /* The light page has no WebGL (lib/lite.ts): the navy floor it would
       have been drawn over is the field's own base colour. */
    if (isLite()) return bail();

    const gl =
      (canvas.getContext("webgl", { antialias: false, alpha: false }) as
        | WebGLRenderingContext
        | null) ??
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
    if (!gl) return bail();

    /* A phone takes the GPU back when it is short of memory or the tab has
       been away, and the context is lost. Drawn to after that, it would
       only throw GL errors; shown, an alpha:false canvas is an opaque black
       slab. So the field goes, and the navy under it shows. */
    let lost = false;
    const onLost = (e: Event) => {
      e.preventDefault();
      lost = true;
      bail();
    };
    canvas.addEventListener("webglcontextlost", onLost);

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return bail();

    const prog = gl.createProgram();
    if (!prog) return bail();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return bail();
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "uRes");
    const uPool = gl.getUniformLocation(prog, "uPool");
    const uIntensity = gl.getUniformLocation(prog, "uIntensity");
    const pools = new Float32Array(16);

    /* The one object GSAP writes to. Two numbers drive the whole field. */
    const u = { phase: 0, intensity: 0 };

    /* Deliberately not called from the ticker: reading clientWidth forces
       a style and layout flush, and doing that every frame to re-learn a
       number that only changes when the window does is the most
       expensive thing this component could do. A ResizeObserver delivers
       it instead. */
    const resize = () => {
      const scale =
        Math.min(window.devicePixelRatio || 1, SHADER.maxPixelRatio) * SHADER.renderScale;
      const cap = SHADER.maxEdge;
      let w = canvas.clientWidth * scale;
      let h = canvas.clientHeight * scale;
      const over = Math.max(w, h) / cap;
      if (over > 1) {
        w /= over;
        h /= over;
      }
      w = Math.max(1, Math.round(w));
      h = Math.max(1, Math.round(h));
      if (canvas.width === w && canvas.height === h) return;
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    };

    const TAU = Math.PI * 2;

    /* Each pool rides its own circle, a whole number of turns a loop, so
       at phase 1 every one is back where it began and the loop is
       seamless. The trig is per frame on the CPU, not per pixel. */
    const draw = () => {
      if (lost) return;
      const aspect = canvas.width / canvas.height;
      const a = TAU * u.phase;
      POOLS.forEach((k, i) => {
        const t = a * k.turns + k.from;
        pools[i * 4] = (k.x + k.orbit * Math.cos(t)) * aspect;
        pools[i * 4 + 1] = k.y + k.orbit * 0.7 * Math.sin(t);
        pools[i * 4 + 2] = k.r;
        pools[i * 4 + 3] = k.k;
      });
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform4fv(uPool, pools);
      gl.uniform1f(uIntensity, u.intensity * LIVE.shader.intensity);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    resize();

    if (prefersReducedMotion()) {
      /* One frame, held. Still the full field -- reduced motion means no
         movement, not a blank background. */
      u.intensity = 1;
      draw();
      return;
    }

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    /* The loop. Linear, because any easing here would make the field
       visibly slow down and speed up once per cycle and give the repeat
       away. Created paused: it runs only while the field is being drawn,
       so a field that stops off-screen picks up exactly where it left
       off when it comes back. */
    const loop = gsap.to(u, {
      phase: 1,
      duration: SHADER.loopDuration,
      ease: EASE.hold,
      repeat: -1,
      paused: true,
    });
    const fadeIn = gsap.to(u, {
      intensity: 1,
      duration: SHADER.fadeInDuration,
      ease: EASE.settle,
    });

    /* Loop speed rides timeScale rather than the tween's duration, so
       dragging the slider retimes the cycle in place instead of killing
       and rebuilding the tween -- which would jump the phase and break
       the seam the whole loop is built around. */
    const retime = () => {
      const want = LIVE.shader.loopSeconds;
      if (want > 0) loop.timeScale(SHADER.loopDuration / want);
    };
    /* Only the dev panel can change the loop length, and it doesn't exist
       in production -- so neither does the per-frame check for it. */
    const tuning = process.env.NODE_ENV !== "production";
    if (tuning) gsap.ticker.add(retime);

    /* Drawn only when it is the thing being looked at: after the
       preloader has handed off, and only while the hero is at rest. See
       section 8 of lib/motion.ts for what drawing behind the preloader was
       costing. The moment the hero starts to leave the field holds its
       frame, like the map's pulses: a new WebGL frame per scroll frame is
       GPU work the phone needs for the scroll itself, and the drift of a
       40-second loop over a second of scrolling is too slow to see stop.
       One frame now, though, so the canvas holds the field's flat navy
       floor rather than the opaque black an undrawn alpha:false canvas
       composites as. */
    draw();
    /* Every other frame: a drift this slow can't be seen at 60 frames a
       second rather than 30, and the GPU keeps half the work. */
    let skip = false;
    const paint = () => {
      skip = !skip;
      if (!skip) draw();
    };
    const hero = canvas.closest<HTMLElement>("#hero");
    let revealed = !hero;
    let covered = false;
    let leaving = false;
    let running = false;
    const sync = () => {
      const want = revealed && !covered && !leaving;
      if (want === running) return;
      running = want;
      if (want) {
        gsap.ticker.add(paint);
        loop.resume();
      } else {
        gsap.ticker.remove(paint);
        loop.pause();
      }
    };
    const stopReveal = hero
      ? onRevealed(hero, () => {
          revealed = true;
          sync();
        })
      : () => {};
    const stopCover = hero
      ? onHeroFlag(hero, "covered", (c) => {
          covered = c;
          sync();
        })
      : () => {};
    const stopLeaving = hero
      ? onHeroFlag(hero, "leaving", (l) => {
          leaving = l;
          sync();
        })
      : () => {};
    sync();

    return () => {
      canvas.removeEventListener("webglcontextlost", onLost);
      stopReveal();
      stopCover();
      stopLeaving();
      ro.disconnect();
      gsap.ticker.remove(paint);
      if (tuning) gsap.ticker.remove(retime);
      loop.kill();
      fadeIn.kill();

      /* Free the GL objects, but never loseContext() here. getContext()
         hands back the same context for the life of the canvas element,
         and React reuses that element across a remount -- StrictMode in
         development remounts every component once on purpose. Losing the
         context on the first teardown left the second setup linking
         against a dead context, which failed and bailed, so the field was
         simply gone in `next dev` while production was fine. */
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="pointer-events-none absolute inset-0 z-0 h-full w-full"
      aria-hidden="true"
    />
  );
}
