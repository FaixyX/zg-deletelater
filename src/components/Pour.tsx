"use client";

import { gsap } from "gsap";
import { useRef } from "react";

import { TONE, cargoInView, scrollMotion, watchScroll } from "@/lib/liquid";
import { isLite } from "@/lib/lite";
import { EASE, LIFT_Y, POUR, SERVICES, STAGGER, prefersReducedMotion, useIdleGSAP } from "@/lib/motion";

/**
 * "Now loading.": the services stage as a tank being filled.
 *
 * An amber stream pours in from the top and the liquid rises with the
 * scroll, drawn in the map's hex dots: faint empty glass above the
 * surface, amber below it, deepening through burnt orange to the navy
 * the contract carriage section is made of -- so that section surfaces
 * inside the tank instead of being dealt over it, and the bubbles keep
 * rising behind it.
 *
 * The surface is one formula, evaluated twice: by the shader for every
 * pixel, and here for the handful of points the page needs -- the edge
 * where the words turn cream, the gauge riding the surface, and the
 * line the header reads to know what colour it is over. So the words
 * change colour exactly where the liquid is, wave for wave.
 *
 * Scroll decides the level; the clock runs the stream, the waves and
 * the bubbles; the scroll's acceleration (lib/liquid.ts) sloshes it.
 * Without WebGL a plain gradient panel rises in its place, flat.
 * Reduced motion: one still frame, part-filled, and no hold.
 */

const VERT = `
attribute vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FRAG = `
#define RIPPLE_SPEED ${POUR.rippleSpeed.toFixed(1)}
#define RIPPLE_WIDTH ${POUR.rippleWidth.toFixed(1)}
#define RIPPLE_WIDEN ${POUR.rippleWiden.toFixed(1)}
#define RIPPLE_DECAY ${POUR.rippleDecay.toFixed(2)}
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2  uRes;     // device px
uniform float uDpr;
uniform float uTime;
uniform float uPitch;   // CSS px, as is every length below
uniform float uW;
uniform float uLevel;   // the resting surface, from the top
uniform float uDepth;   // surface to fully deep
uniform vec4  uAmp;
uniform vec4  uPhase;
uniform vec4  uCycles;
uniform float uTilt;
uniform vec3  uImpact;  // x, depth of the dip, width
uniform vec4  uPoke[4]; // ripples from a pointer: x, age, strength, unused
uniform vec4  uStream;  // x, tail, head, half-width
uniform float uWobble;
uniform vec3  uTint;
uniform float uTintAmt;
uniform float uAir;     // the empty glass, faded in as the stage arrives
uniform float uClear;   // the deep's specks and bubbles, settling out as the deck ends
uniform float uLife;    // bubbles, spray and shimmer: 0 under reduced motion

const float TAU = 6.2831853;
const vec3 CREAM = vec3(0.973, 0.945, 0.894);
const vec3 NAVY  = vec3(0.004, 0.122, 0.482);
const vec3 DEEP  = vec3(0.043, 0.078, 0.200);
const vec3 HIGH  = vec3(1.000, 0.906, 0.741);
const vec3 SPOUT = vec3(0.949, 0.698, 0.306);

/* The liquid between the dots, and the dots: light gaps under dark dots
   near the surface, where light comes through; dark gaps under bright
   dots in the depths, like specks catching what light is left. Both
   arrive at the page's deep navy, the dots only just lighter. */
vec3 body(float t) {
  vec3 a = vec3(0.953, 0.733, 0.361);
  vec3 b = vec3(0.890, 0.604, 0.208);
  vec3 c = vec3(0.576, 0.263, 0.102);
  vec3 d = vec3(0.114, 0.078, 0.149);
  if (t < 0.18) return mix(a, b, t / 0.18);
  if (t < 0.45) return mix(b, c, (t - 0.18) / 0.27);
  if (t < 0.75) return mix(c, d, (t - 0.45) / 0.30);
  return mix(d, DEEP, clamp((t - 0.75) / 0.25, 0.0, 1.0));
}
vec3 speck(float t) {
  vec3 a = vec3(0.835, 0.549, 0.173);
  vec3 b = vec3(0.784, 0.455, 0.122);
  vec3 c = vec3(0.804, 0.490, 0.220);
  vec3 d = vec3(0.227, 0.133, 0.192);
  vec3 e = vec3(0.071, 0.110, 0.290);
  if (t < 0.18) return mix(a, b, t / 0.18);
  if (t < 0.45) return mix(b, c, (t - 0.18) / 0.27);
  if (t < 0.75) return mix(c, d, (t - 0.45) / 0.30);
  return mix(d, e, clamp((t - 0.75) / 0.25, 0.0, 1.0));
}

float hash(float n) {
  return fract(sin(n * 127.1) * 43758.5453);
}
float hash2(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash2(i), hash2(i + vec2(1.0, 0.0)), u.x),
             mix(hash2(i + vec2(0.0, 1.0)), hash2(i + vec2(1.0, 1.0)), u.x), u.y);
}

float surfaceAt(float x) {
  float u = x / uW * TAU;
  float y = uLevel + uTilt * (x / uW - 0.5) + dot(uAmp, sin(u * uCycles + uPhase));
  float d = (x - uImpact.x) / uImpact.z;
  y += uImpact.y * exp(-d * d);
  /* Each ripple: two humps running out either way from where the
     pointer broke the surface, spreading and dying as they go. */
  for (int i = 0; i < 4; i++) {
    vec4 k = uPoke[i];
    float spread = RIPPLE_SPEED * k.y;
    float w = RIPPLE_WIDTH + k.y * RIPPLE_WIDEN;
    float a = (x - (k.x - spread)) / w;
    float b = (x - (k.x + spread)) / w;
    y += k.z * exp(-k.y * RIPPLE_DECAY) * (exp(-a * a) + exp(-b * b));
  }
  return y;
}

float streamX(float y) {
  return uStream.x + sin(uTime * 4.2 + y * 0.021) * uWobble * clamp(y / 600.0, 0.0, 1.0);
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uDpr;
  float viewH = uRes.y / uDpr;
  float aa = 0.8 / uDpr;

  /* The hex grid: odd rows shifted half a pitch, as on the map. */
  float dx = uPitch;
  float dy = uPitch * 0.8660254;
  float row = floor(p.y / dy + 0.5);
  float shift = mod(row, 2.0) * 0.5 * dx;
  float col = floor((p.x - shift) / dx + 0.5);
  vec2 c = vec2(col * dx + shift, row * dy);
  float dist = length(p - c);

  /* The liquid's edge is smooth, per pixel; each dot takes one colour,
     from its centre. */
  float sf = surfaceAt(p.x);
  float zf = p.y - sf;
  float sc = surfaceAt(c.x);
  float zc = c.y - sc;
  float tf = clamp(zf / uDepth, 0.0, 1.0);
  float tc = clamp(zc / uDepth, 0.0, 1.0);

  /* The active cargo's colour, glowing low in the deep. */
  vec2 g = (p - vec2(uW * 0.5, viewH * 0.92)) / vec2(uW * 0.62, viewH * 0.7);
  float glow = exp(-dot(g, g) * 1.6) * uTintAmt * smoothstep(0.6, 1.0, tf) * uClear;

  /* Light from above, filtering down through the deep in slow shafts. */
  float shaft = smoothstep(0.55, 0.95, noise(vec2(p.x * 0.0042 + p.y * 0.0016, uTime * 0.045)))
              * smoothstep(0.6, 1.0, tf) * (1.0 - p.y / viewH) * uClear * uLife;

  float wet = smoothstep(-aa, aa, zf);
  vec3 ground = mix(CREAM, body(tf) + uTint * glow + vec3(0.03, 0.05, 0.1) * shaft, wet);

  /* A soft light just under the surface, and the meniscus on it. */
  ground = mix(ground, HIGH, 0.35 * exp(-max(zf, 0.0) / 7.0) * wet);

  /* The stream: a solid core, from its tail down to the surface. */
  float bottom = min(uStream.z, sf);
  float inFall = step(uStream.y, p.y) * step(p.y, bottom);
  float core = inFall * (1.0 - smoothstep(uStream.w - aa, uStream.w + aa, abs(p.x - streamX(p.y))));
  ground = mix(ground, SPOUT, core);

  vec3 dotCol = mix(CREAM, NAVY, 0.075 * uAir);
  float r = 0.18 * dx;

  if (zc > 0.0) {
    dotCol = speck(tc) + uTint * glow * 1.6;
    /* Full dots in the amber, thinning in the deep so the navy there
       is the page's own, only just textured. */
    r = mix(0.37, 0.42, smoothstep(0.1, 0.5, tc)) * mix(1.0, 0.7 * uClear, smoothstep(0.7, 1.0, tc)) * dx;

    /* Shimmer in the bright band: light bent by the moving surface. */
    float n = noise(c * 0.011 + vec2(uTime * 0.16, -uTime * 0.09))
            + noise(c * 0.023 - vec2(uTime * 0.11, uTime * 0.07));
    float shimmer = smoothstep(1.05, 1.5, n) * (1.0 - smoothstep(0.05, 0.4, tc)) * uLife;
    dotCol = mix(dotCol, HIGH, shimmer * 0.7);
    r += shimmer * 0.04 * dx;

    /* The surface row. */
    if (zc < dy * 1.05) {
      dotCol = HIGH;
      r = 0.42 * dx;
    }

    /* Bubbles: one dot to a column, climbing a row at a time and gone
       at the surface, as in the sight glass. */
    float h = hash(col * 1.7 + 3.1);
    if (h < 0.085 && zc > dy * 2.0) {
      float speed = mix(38.0, 92.0, hash(col + 11.0));
      float span = viewH + 160.0;
      float by = viewH + 80.0 - mod(uTime * speed + hash(col + 23.0) * 4000.0, span);
      float lit = step(abs(c.y - by), dy * 0.5) * uLife * uClear;
      dotCol = mix(dotCol, mix(HIGH, vec3(0.847, 0.890, 1.0), smoothstep(0.3, 0.9, tc)), lit * mix(1.0, 0.55, tc));
      r = mix(r, 0.3 * dx, lit);
    }
  } else {
    /* In the stream. */
    float sx = streamX(c.y);
    if (c.y > uStream.y && c.y < min(uStream.z, sc) && abs(c.x - sx) < uStream.w) {
      dotCol = c.x < sx ? HIGH : speck(0.1);
      r = 0.4 * dx;
    }
    /* Spray where it lands. */
    if (uImpact.y < -0.5 && abs(c.x - uImpact.x) < dx * 4.5 && zc > -dy * 3.2) {
      float s = hash2(vec2(col * 3.1 + row * 7.7, floor(uTime * 12.0)));
      if (s > 0.83) {
        dotCol = HIGH;
        r = 0.3 * dx * uLife;
      }
    }
  }

  float m = 1.0 - smoothstep(r - aa, r + aa, dist);
  vec3 outc = mix(ground, dotCol, m);

  float lip = 1.0 - smoothstep(0.4, 1.4, abs(zf - 0.6));
  outc = mix(outc, HIGH, lip * 0.9);

  gl_FragColor = vec4(outc, 1.0);
}
`;

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

const TAU = Math.PI * 2;
/* Points along the edge where the words turn cream. */
const EDGE_POINTS = 32;

/**
 * The words on the stage. Drawn twice: navy, and a cream copy on top
 * that is clipped to the liquid below the switch line, so the headline
 * reads wherever the surface happens to be crossing it. Only the first
 * is a heading; the copy is a picture of it, so it isn't counted twice.
 */
function Ink({ sub }: { sub?: boolean }) {
  const Title = sub ? "p" : "h2";
  return (
    <div className={`pour-ink${sub ? " pour-ink--sub" : ""}`} aria-hidden={sub || undefined}>
      <p className="pour-eyebrow pour-fade" data-eyebrow="03">
        <i />
        What we carry
      </p>
      <Title className="pour-title pour-fade" id={sub ? undefined : "pour-title"}>
        <span className="pour-line">
          <span>Now</span>
        </span>
        <span className="pour-line">
          <span>loading.</span>
        </span>
      </Title>
      <p className="pour-caption pour-fade">
        Every cargo rides in equipment kept for it alone, sealed at the loading bay and checked
        at your gate.
      </p>
      <div className="pour-ruler pour-fade" aria-hidden="true">
        {[100, 75, 50, 25, 0].map((n) => (
          <span key={n} style={{ top: `${100 - n}%` }}>
            {n}
          </span>
        ))}
      </div>
      <b className="pour-mark pour-fade" aria-hidden="true" />
      <p className="pour-read pour-fade" aria-hidden="true">
        <span className="pour-read-level">000%</span>
        <span className="pour-read-status">Standby</span>
      </p>
    </div>
  );
}

export default function Pour() {
  const root = useRef<HTMLDivElement>(null);

  useIdleGSAP(
    () => {
      const el = root.current;
      const stage = el?.closest<HTMLElement>(".svc-stage");
      const deck = el?.closest<HTMLElement>(".svc-deck");
      if (!el || !stage || !deck) return;
      const canvas = el.querySelector<HTMLCanvasElement>(".pour-canvas")!;
      const fallback = el.querySelector<HTMLElement>(".pour-fallback")!;
      const ground = el.querySelector<HTMLElement>(".pour-ground")!;
      const inks = Array.from(el.querySelectorAll<HTMLElement>(".pour-ink"));
      const sub = el.querySelector<HTMLElement>(".pour-ink--sub")!;
      const marks = Array.from(el.querySelectorAll<HTMLElement>(".pour-mark"));
      const reads = Array.from(el.querySelectorAll<HTMLElement>(".pour-read"));
      const levels = Array.from(el.querySelectorAll<HTMLElement>(".pour-read-level"));
      const statuses = Array.from(el.querySelectorAll<HTMLElement>(".pour-read-status"));
      const spacer = deck.querySelector<HTMLElement>(".svc-spacer");
      const card = deck.querySelector<HTMLElement>(".svc-card");
      const reduced = prefersReducedMotion();

      /* ---- GL, or the flat fallback -------------------------------- */
      let gl: WebGLRenderingContext | null = null;
      let prog: WebGLProgram | null = null;
      let vs: WebGLShader | null = null;
      let fs: WebGLShader | null = null;
      let buf: WebGLBuffer | null = null;
      const U: Record<string, WebGLUniformLocation | null> = {};
      /* The GPU taken back from a phone that is short of memory, or from a
         tab that has been away: the context is lost, and what is left to
         draw to only throws. The flat fallback takes over instead. */
      const onLost = (e: Event) => {
        e.preventDefault();
        gl = null;
        canvas.style.display = "none";
        fallback.style.display = "";
      };
      const setupGL = () => {
        /* The light page has no WebGL (lib/lite.ts). */
        if (isLite()) return false;
        const ctx =
          (canvas.getContext("webgl", { antialias: false, alpha: false }) as WebGLRenderingContext | null) ??
          (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
        if (!ctx) return false;
        vs = compile(ctx, ctx.VERTEX_SHADER, VERT);
        fs = compile(ctx, ctx.FRAGMENT_SHADER, FRAG);
        if (!vs || !fs) return false;
        prog = ctx.createProgram();
        if (!prog) return false;
        ctx.attachShader(prog, vs);
        ctx.attachShader(prog, fs);
        ctx.linkProgram(prog);
        if (!ctx.getProgramParameter(prog, ctx.LINK_STATUS)) return false;
        ctx.useProgram(prog);
        buf = ctx.createBuffer();
        ctx.bindBuffer(ctx.ARRAY_BUFFER, buf);
        ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), ctx.STATIC_DRAW);
        const loc = ctx.getAttribLocation(prog, "aPos");
        ctx.enableVertexAttribArray(loc);
        ctx.vertexAttribPointer(loc, 2, ctx.FLOAT, false, 0, 0);
        for (const n of [
          "uRes", "uDpr", "uTime", "uPitch", "uW", "uLevel", "uDepth", "uAmp", "uPhase", "uCycles",
          "uTilt", "uImpact", "uPoke", "uStream", "uWobble", "uTint", "uTintAmt", "uAir", "uClear", "uLife",
        ])
          U[n] = ctx.getUniformLocation(prog, n);
        gl = ctx;
        canvas.addEventListener("webglcontextlost", onLost);
        return true;
      };
      const hasGL = setupGL();
      canvas.style.display = hasGL ? "" : "none";
      fallback.style.display = hasGL ? "none" : "";

      /* ---- What the scroll sets ------------------------------------ */
      const st = { enter: reduced ? 1 : 0, fill: reduced ? POUR.reducedFill : 0, clear: 1 };

      /* ---- Geometry, measured on resize only ---------------------- */
      let W = 1;
      let H = 1;
      let pitch: number = POUR.pitch;
      let narrow = false;
      let gaugeX = 0;
      let readX = 0;
      /* The drawing buffer's resolution: the screen's, up to maxDpr, and
         never more pixels than the budget -- a 5K display would otherwise
         ask the shader for eleven million a frame. `quality` steps it down
         further on a device that can't keep up (see the tick); the shader
         reads its scale from the buffer, so a coarser buffer is only a
         softer picture, never a different one. */
      let quality = 1;
      const sizeBuffer = () => {
        if (!gl) return;
        const budget = Math.sqrt(POUR.pixelBudget / (W * H));
        const dpr = Math.min(window.devicePixelRatio || 1, POUR.maxDpr, budget) * quality;
        canvas.width = Math.max(1, Math.round(W * dpr));
        canvas.height = Math.max(1, Math.round(H * dpr));
        gl.viewport(0, 0, canvas.width, canvas.height);
      };
      const resize = () => {
        W = stage.clientWidth || 1;
        H = stage.clientHeight || 1;
        narrow = W < 900;
        pitch = narrow ? POUR.pitchNarrow : POUR.pitch;
        sizeBuffer();
        /* Where the gauge's mark and readout sit across the stage, read
           off the navy copy (both copies are laid out identically). */
        const m = marks[0].getBoundingClientRect();
        const r = reads[0].getBoundingClientRect();
        const s = stage.getBoundingClientRect();
        gaugeX = m.left - s.left + m.width / 2;
        readX = r.left - s.left + r.width / 2;
        setLevel();
        draw();
      };

      /* ---- The surface --------------------------------------------- */
      const amp = [0, 0, 0, 0];
      const phase = [0, 1.3, 2.9, 4.4];
      const energy = [0, 0, 0, 0];
      let tilt = 0;
      let tiltV = 0;
      const impact = { x: 0, dip: 0 };
      /* Ripples from the pointer: [x, age, strength] each, oldest
         replaced first. */
      const pokes = Array.from({ length: 4 }, () => ({ x: 0, age: 99, k: 0 }));
      const pokeData = new Float32Array(16);
      let level = H * POUR.start;
      /* The resting surface, from the fill: just below the fold at 0, the
         deep over the whole screen at 1. */
      const setLevel = () => {
        level = H * POUR.start + (-POUR.over * POUR.depth * H - H * POUR.start) * st.fill;
      };
      const surfaceAt = (x: number) => {
        const u = (x / W) * TAU;
        let y = level + tilt * (x / W - 0.5);
        for (let i = 0; i < 4; i++) y += amp[i] * Math.sin(u * POUR.waveCycles[i] + phase[i]);
        const d = (x - impact.x) / POUR.impactWidth;
        y += impact.dip * Math.exp(-d * d);
        for (const p of pokes) {
          if (p.age > POUR.rippleLife) continue;
          const spread = POUR.rippleSpeed * p.age;
          const w = POUR.rippleWidth + p.age * POUR.rippleWiden;
          const a = (x - (p.x - spread)) / w;
          const b = (x - (p.x + spread)) / w;
          y += p.k * Math.exp(-p.age * POUR.rippleDecay) * (Math.exp(-a * a) + Math.exp(-b * b));
        }
        return y;
      };

      /* ---- The stream: open, falling, flowing, closing ------------- */
      const stream = { state: "off" as "off" | "falling" | "flowing" | "closing", head: 0, headV: 0, tail: 0, tailV: 0 };
      let first = true;

      /* ---- Tint ---------------------------------------------------- */
      const tint = [...TONE[cargoInView()]];

      let time = 0;
      let last = -1;
      let lastEdge = "";
      let lastPct = -1;
      let lastStatus = "";
      let covered = false;

      const step = (dt: number) => {
        setLevel();
        const life = reduced ? 0 : 1;

        /* Slosh: the scroll's push pumps the waves; they breathe at rest. */
        const m = scrollMotion();
        const decay = Math.exp(-dt / POUR.waveDecay);
        let total = 0;
        for (let i = 0; i < 4; i++) {
          energy[i] = energy[i] * decay + Math.abs(m.a) * POUR.waveGain[i] * dt * 60 * life;
          amp[i] = (POUR.waveIdle[i] * life + energy[i]) * H;
          total += amp[i];
          phase[i] += POUR.waveSpeed[i] * dt;
        }
        if (total > POUR.waveMax * H) {
          const k = (POUR.waveMax * H) / total;
          for (let i = 0; i < 4; i++) amp[i] *= k;
        }
        const tMax = POUR.tiltMax * H;
        const target = Math.max(-tMax, Math.min(tMax, m.v * POUR.tiltPerVelocity)) * life;
        tiltV += ((target - tilt) * POUR.tiltStiffness - tiltV * POUR.tiltDamping) * dt;
        tilt += tiltV * dt;

        /* The valve follows the fill; the stream's ends fall freely. */
        impact.x = W * (narrow ? POUR.streamXNarrow : POUR.streamX);
        const open = st.fill > POUR.valveOpen && st.fill < POUR.valveClose;
        const land = surfaceAt(impact.x);
        if (open && (stream.state === "off" || stream.state === "closing")) {
          stream.state = first || reduced || stream.state === "closing" ? "flowing" : "falling";
          stream.head = stream.state === "flowing" ? 1e5 : 0;
          stream.headV = 0;
          stream.tail = 0;
        } else if (!open && (stream.state === "falling" || stream.state === "flowing")) {
          stream.state = first || reduced ? "off" : "closing";
          stream.tail = 0;
          stream.tailV = 0;
        }
        if (stream.state === "falling") {
          stream.headV += POUR.gravity * dt;
          stream.head += stream.headV * dt;
          if (stream.head >= land) {
            stream.state = "flowing";
            stream.head = 1e5;
            /* The splash as it lands. */
            energy[2] += 0.004;
            energy[3] += 0.004;
          }
        } else if (stream.state === "closing") {
          stream.tailV += POUR.gravity * dt;
          stream.tail += stream.tailV * dt;
          if (stream.tail >= land) stream.state = "off";
        }
        const pressing = stream.state === "flowing" && land > 0;
        const want = pressing ? -POUR.impactDip * (1 + 0.25 * Math.sin(time * 11)) : 0;
        impact.dip += (want - impact.dip) * (1 - Math.exp(-dt * 8));
        first = false;
        for (const p of pokes) p.age += dt;

        /* The cargo in view tints the deep. */
        const tone = TONE[cargoInView()];
        const k = 1 - Math.exp(-dt * POUR.tintEase);
        for (let i = 0; i < 3; i++) tint[i] += (tone[i] - tint[i]) * k;
      };

      const draw = () => {
        const D = POUR.depth * H;
        if (gl) {
          gl.uniform2f(U.uRes, canvas.width, canvas.height);
          gl.uniform1f(U.uDpr, canvas.width / W);
          gl.uniform1f(U.uTime, time);
          gl.uniform1f(U.uPitch, pitch);
          gl.uniform1f(U.uW, W);
          gl.uniform1f(U.uLevel, level);
          gl.uniform1f(U.uDepth, D);
          gl.uniform4f(U.uAmp, amp[0], amp[1], amp[2], amp[3]);
          gl.uniform4f(U.uPhase, phase[0], phase[1], phase[2], phase[3]);
          gl.uniform4f(U.uCycles, ...(POUR.waveCycles as unknown as [number, number, number, number]));
          gl.uniform1f(U.uTilt, tilt);
          gl.uniform3f(U.uImpact, impact.x, impact.dip, POUR.impactWidth);
          pokes.forEach((p, i) => {
            pokeData[i * 4] = p.x;
            pokeData[i * 4 + 1] = p.age;
            pokeData[i * 4 + 2] = p.age > POUR.rippleLife ? 0 : p.k;
          });
          gl.uniform4fv(U.uPoke, pokeData);
          const hw = (POUR.streamWidth * pitch) / 2;
          if (stream.state === "off") gl.uniform4f(U.uStream, impact.x, -10, -10, hw);
          else gl.uniform4f(U.uStream, impact.x, stream.tail, stream.head, hw);
          gl.uniform1f(U.uWobble, reduced ? 0 : POUR.streamWobble);
          gl.uniform3f(U.uTint, tint[0], tint[1], tint[2]);
          gl.uniform1f(U.uTintAmt, POUR.tintAmount * Math.max(0, Math.min(1, (st.fill - 0.7) / 0.3)));
          gl.uniform1f(U.uAir, st.enter);
          gl.uniform1f(U.uClear, st.clear);
          gl.uniform1f(U.uLife, reduced ? 0 : 1);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
        } else {
          fallback.style.transform = `translate3d(0, ${level}px, 0)`;
        }

        /* Where the words turn cream: the surface, a band lower. */
        const off = POUR.inkSwitch * D;
        const pts: string[] = [];
        for (let i = 0; i <= EDGE_POINTS; i++) {
          const x = (W * i) / EDGE_POINTS;
          pts.push(`${x.toFixed(1)}px ${(surfaceAt(x) + off).toFixed(1)}px`);
        }
        const edge = `polygon(${pts.join(",")},${W}px ${H + 20}px,0px ${H + 20}px)`;
        if (edge !== lastEdge) {
          sub.style.clipPath = edge;
          lastEdge = edge;
        }

        /* The gauge rides the surface, and stops at the top. */
        const top = H * 0.14;
        const markY = Math.max(top, Math.min(H - 12, surfaceAt(gaugeX)));
        const readY = Math.max(top, Math.min(H - 12, surfaceAt(readX)));
        for (const mk of marks) mk.style.transform = `translate3d(0, ${markY.toFixed(1)}px, 0)`;
        /* On a phone the headline spans the width, so the readout holds
           still under the eyebrow and only the mark rides. */
        for (const rd of reads) rd.style.transform = narrow ? "" : `translate3d(0, ${readY.toFixed(1)}px, 0)`;
        const pct = Math.max(0, Math.min(100, Math.round(((H - level) / H) * 100)));
        if (pct !== lastPct) {
          const txt = `${String(pct).padStart(3, "0")}%`;
          for (const l of levels) l.textContent = txt;
          lastPct = pct;
        }
        const status = pct <= 0 ? "Standby" : pct >= 100 ? "Sealed" : "Loading";
        if (status !== lastStatus) {
          for (const s of statuses) s.textContent = status;
          el.dataset.status = status.toLowerCase();
          lastStatus = status;
        }

        /* The header reads this to know it's over the dark. */
        const dark = level + off;
        ground.style.transform = `translate3d(0, ${Math.max(-1, dark).toFixed(1)}px, 0)`;
        const cov = dark <= 0;
        if (cov !== covered) {
          stage.classList.toggle("svc-stage--covered", cov);
          covered = cov;
        }
      };

      /* How often frames have been arriving late, as a running share,
         after a short warm-up (the first frames include the shader's
         compile). Past the limit the buffer drops a step: a slightly
         softer tank that keeps up beats a sharp one that stutters. */
      let late = 0;
      let warm = 0;
      const tick = (t: number) => {
        const raw = last < 0 ? 1 / 60 : t - last;
        const dt = Math.min(0.05, raw);
        last = t;
        if (gl && ++warm > POUR.warmFrames) {
          late += ((raw > POUR.lateFrame ? 1 : 0) - late) * 0.05;
          if (late > POUR.lateShare && quality > POUR.minQuality) {
            quality = Math.max(POUR.minQuality, quality * 0.8);
            late = 0;
            warm = 0;
            sizeBuffer();
          }
        }
        time += dt;
        step(dt);
        draw();
      };

      const ro = new ResizeObserver(resize);
      ro.observe(stage);
      resize();

      if (reduced) {
        /* One still frame; settled, with the stream frozen mid-pour. */
        step(1 / 60);
        draw();
        return () => ro.disconnect();
      }

      /* ---- Scroll -------------------------------------------------- */
      const lines = gsap.utils.toArray<HTMLElement>(el.querySelectorAll(".pour-line > span"));
      const faders = gsap.utils.toArray<HTMLElement>(el.querySelectorAll(".pour-fade"));

      /* The stage arriving: the empty glass fades up and the headline
         rises into its masks, so it is standing by the time the page
         holds. */
      gsap.set(lines, { yPercent: 110 });
      const enter = gsap
        .timeline({
          defaults: { ease: EASE.hold },
          scrollTrigger: { trigger: deck, start: "top bottom", end: "top top", scrub: SERVICES.scrub },
        })
        .to(st, { enter: 1, duration: 1 }, 0)
        .to(lines, { yPercent: 0, duration: 0.45, ease: EASE.lift, stagger: STAGGER }, 0.45);

      /* The fill: over the hold, and a little past it, so the screen is
         the deep colour by the time the section is up. */
      const fill = gsap.to(st, {
        fill: 1,
        ease: EASE.hold,
        scrollTrigger: {
          trigger: deck,
          start: "top top",
          end: () => `+=${(spacer?.offsetHeight ?? 0) + POUR.overrun * window.innerHeight}`,
          scrub: SERVICES.scrub,
          invalidateOnRefresh: true,
        },
      });

      /* The words sink out of the way as the section rises: clear of
         the screen's middle before the section's own title gets there. */
      const out = card
        ? gsap.to(faders, {
            opacity: 0,
            y: LIFT_Y,
            ease: EASE.hold,
            scrollTrigger: { trigger: card, start: "top bottom", end: "top 75%", scrub: SERVICES.scrub },
          })
        : null;

      /* Leaving: the specks and bubbles settle out of the deep as the
         last of the deck goes by, so the tank meets the FAQ's lip as the
         same plain navy. */
      const clear = gsap.to(st, {
        clear: 0,
        ease: EASE.hold,
        scrollTrigger: { trigger: deck, start: "bottom 135%", end: "bottom bottom", scrub: SERVICES.scrub },
      });

      /* A mouse drawn through the surface breaks it: a ripple runs out
         either way from the spot, harder the faster the hand. Mouse
         only: on a touch screen the same gesture is a scroll. */
      let lastPoke = 0;
      let lastPY = 0;
      const onMove = (e: PointerEvent) => {
        if (e.pointerType !== "mouse") return;
        const r = stage.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        const dy = y - lastPY;
        lastPY = y;
        if (Math.abs(y - surfaceAt(x)) > POUR.rippleReach || time - lastPoke < POUR.rippleEvery) return;
        lastPoke = time;
        const p = pokes.reduce((o, q) => (q.age > o.age ? q : o));
        p.x = x;
        p.age = 0;
        p.k = Math.max(-POUR.rippleMax, Math.min(POUR.rippleMax, 3 + dy * POUR.rippleGain));
      };
      stage.addEventListener("pointermove", onMove);

      /* Drawn only while the stage is on screen. */
      const stopWatch = watchScroll();
      let running = false;
      const io = new IntersectionObserver(([e]) => {
        if (e.isIntersecting && !running) {
          last = -1;
          warm = 0;
          gsap.ticker.add(tick);
          running = true;
        } else if (!e.isIntersecting && running) {
          gsap.ticker.remove(tick);
          running = false;
        }
      });
      io.observe(stage);

      return () => {
        io.disconnect();
        ro.disconnect();
        stopWatch();
        stage.removeEventListener("pointermove", onMove);
        gsap.ticker.remove(tick);
        enter.kill();
        fill.kill();
        out?.kill();
        clear.kill();
        inks.forEach((i) => i.style.removeProperty("clip-path"));
        canvas.removeEventListener("webglcontextlost", onLost);
        if (gl) {
          gl.deleteProgram(prog);
          gl.deleteShader(vs);
          gl.deleteShader(fs);
          gl.deleteBuffer(buf);
        }
      };
    },
    root
  );

  return (
    <div className="pour" ref={root}>
      <canvas className="pour-canvas" aria-hidden="true" />
      <div className="pour-fallback" aria-hidden="true" />
      {/* From here down the stage is dark: the header takes its cream. */}
      <div className="pour-ground" data-ground="dark" aria-hidden="true" />
      <Ink />
      <Ink sub />
    </div>
  );
}
