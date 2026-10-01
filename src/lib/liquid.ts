import { gsap } from "gsap";

import type { CargoKind } from "./cargo";

/**
 * The page's liquid, shared by everything that holds some: the pour
 * behind the services, the cargo in the cover flow's cards and the lip
 * the FAQ hangs from.
 *
 * One reading per frame of how the page is moving, so they all slosh
 * together from the same push; and the cargo currently in view, so the
 * tank can take its colour and the intro's chips can drive the cover
 * flow without either knowing about the other.
 */

/* ---- The scroll, as a force ------------------------------------------ */

const motion = { v: 0, a: 0 }; // px/s and px/s², down the page positive
let lastY = 0;
let lastT = 0;
let users = 0;

/* Smoothing per frame: the wheel arrives in notches and a finger in
   jolts, and liquid should feel the push, not every edge of it. */
const SMOOTH_V = 0.3;
const SMOOTH_A = 0.2;

const read = (time: number) => {
  const y = window.scrollY;
  const dt = Math.max(1 / 240, time - lastT);
  const v = motion.v + ((y - lastY) / dt - motion.v) * SMOOTH_V;
  motion.a += ((v - motion.v) / dt - motion.a) * SMOOTH_A;
  motion.v = v;
  lastY = y;
  lastT = time;
};

/** Start reading the scroll each frame; the returned function stops it. */
export function watchScroll(): () => void {
  if (users++ === 0) {
    lastY = window.scrollY;
    lastT = gsap.ticker.time;
    motion.v = motion.a = 0;
    /* First on the ticker, so everyone later in the frame reads the same
       numbers. */
    gsap.ticker.add(read, false, true);
  }
  let stopped = false;
  return () => {
    if (stopped) return;
    stopped = true;
    if (--users === 0) gsap.ticker.remove(read);
  };
}

/** How the page is moving right now. */
export const scrollMotion = (): Readonly<typeof motion> => motion;

/* ---- The cargo in view ------------------------------------------------ */

/** Each cargo's colour in the deep, 0-1 RGB. */
export const TONE: Record<CargoKind, [number, number, number]> = {
  "edible-oil": [0.91, 0.64, 0.24],
  molasses: [0.77, 0.43, 0.17],
  chemicals: [0.14, 0.34, 1],
  "finished-goods": [0.82, 0.9, 0.99],
  "dry-cargo": [0.89, 0.77, 0.55],
};

let inView: CargoKind = "edible-oil";
export const cargoInView = () => inView;

const SELECT = "zg:cargo-select";
const SHOWN = "zg:cargo-shown";

/** The cover flow says which cargo is at its centre. */
export function showCargo(kind: CargoKind) {
  inView = kind;
  window.dispatchEvent(new CustomEvent<CargoKind>(SHOWN, { detail: kind }));
}
export function onCargoShown(fn: (kind: CargoKind) => void) {
  const h = (e: Event) => fn((e as CustomEvent<CargoKind>).detail);
  window.addEventListener(SHOWN, h);
  return () => window.removeEventListener(SHOWN, h);
}

/** Anything else asks the cover flow to bring a cargo forward. */
export function selectCargo(kind: CargoKind) {
  window.dispatchEvent(new CustomEvent<CargoKind>(SELECT, { detail: kind }));
}
export function onCargoSelect(fn: (kind: CargoKind) => void) {
  const h = (e: Event) => fn((e as CustomEvent<CargoKind>).detail);
  window.addEventListener(SELECT, h);
  return () => window.removeEventListener(SELECT, h);
}
